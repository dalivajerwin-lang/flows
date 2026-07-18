#!/usr/bin/env node
/**
 * Dev-only accessibility audit runner.
 *
 * Walks every route in both roles against the running dev server, injects
 * axe-core, and writes a JSON + console summary. Not shipped to prod.
 *
 * Usage:
 *   bun run dev            # in another terminal (must be on http://localhost:8080)
 *   node scripts/a11y-audit.mjs
 *
 * Requires Playwright; if not installed:
 *   bun add -d @playwright/test
 *   bunx playwright install chromium
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "docs", "a11y");
const BASE = process.env.A11Y_BASE ?? "http://localhost:8080";

const ROUTES = [
  "/login",
  "/",
  "/leads",
  "/workflow",
  "/schedule",
  "/assistant",
  "/team",
  "/reports",
  "/leaderboard",
  "/projects",
  "/profile",
  "/settings",
];

const ROLES = [
  {
    label: "consultant",
    email: process.env.A11Y_CONSULTANT_EMAIL,
    pass: process.env.A11Y_CONSULTANT_PASSWORD,
  },
  {
    label: "manager",
    email: process.env.A11Y_MANAGER_EMAIL,
    pass: process.env.A11Y_MANAGER_PASSWORD,
  },
].filter((role) => role.email && role.pass);

async function login(page, role) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page
    .getByLabel(/email/i)
    .fill(role.email)
    .catch(() => {});
  await page
    .getByLabel(/password/i)
    .fill(role.pass)
    .catch(() => {});
  await page
    .getByRole("button", { name: /sign in|log in/i })
    .first()
    .click()
    .catch(() => {});
  await page
    .waitForURL((url) => !url.pathname.includes("/login"), { timeout: 5000 })
    .catch(() => {});
}

async function main() {
  if (ROLES.length === 0) {
    throw new Error(
      "Set A11Y_CONSULTANT_EMAIL/PASSWORD or A11Y_MANAGER_EMAIL/PASSWORD before running the audit.",
    );
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const axeSource = readFileSync(
    resolve(__dirname, "..", "node_modules", "axe-core", "axe.min.js"),
    "utf8",
  );

  const browser = await chromium.launch({ headless: true });
  const summary = { generated_at: new Date().toISOString(), results: [] };
  let totalCritical = 0;
  let totalSerious = 0;

  for (const role of ROLES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
    const page = await ctx.newPage();
    if (role.label !== "public") await login(page, role);

    for (const route of ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" }).catch(() => {});
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(async () => {
        return await axe.run(document, {
          resultTypes: ["violations"],
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
      });
      const critical = result.violations.filter((v) => v.impact === "critical").length;
      const serious = result.violations.filter((v) => v.impact === "serious").length;
      totalCritical += critical;
      totalSerious += serious;
      summary.results.push({
        role: role.label,
        route,
        critical,
        serious,
        moderate: result.violations.filter((v) => v.impact === "moderate").length,
        minor: result.violations.filter((v) => v.impact === "minor").length,
        violations: result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
        })),
      });
      console.log(
        `[${role.label}] ${route}: critical=${critical} serious=${serious} total=${result.violations.length}`,
      );
    }
    await ctx.close();
  }

  await browser.close();

  writeFileSync(resolve(OUT_DIR, "report.json"), JSON.stringify(summary, null, 2));
  const line = `TOTAL critical=${totalCritical} serious=${totalSerious}`;
  writeFileSync(resolve(OUT_DIR, "SUMMARY.txt"), line + "\n");
  console.log("\n" + line);
  process.exit(totalCritical + totalSerious > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
