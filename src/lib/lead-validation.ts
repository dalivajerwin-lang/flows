import { z } from "zod";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { LEAD_SOURCES, UNIT_TYPES } from "@/lib/lead-sources";

const nameRegex = /^[\p{L}\s.\-']+$/u;

export const leadCreateSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters")
      .regex(nameRegex, "Letters, spaces, hyphens, and periods only"),
    contact_number: z.string().trim().max(30),
    source: z.enum(LEAD_SOURCES),
    source_other_description: z.string().trim().max(120),
    project_id: z.string().min(1, "Select a project"),
    unit_types: z.array(z.enum(UNIT_TYPES)).min(1, "Select at least one unit type"),
    date_added: z.string().min(1, "Pick a date"),
    assigned_to: z.string(),
  })
  .refine(
    (v) => {
      if (!v.contact_number) return true;
      const n = normalizePhone(v.contact_number);
      return isValidPhone(n);
    },
    { message: "Phone must be 10–15 digits", path: ["contact_number"] },
  );

export type LeadCreateFormValues = z.infer<typeof leadCreateSchema>;
