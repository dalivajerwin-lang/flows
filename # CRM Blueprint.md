# CRM Blueprint

Team Name: Team Tenacious

## Platform

This CRM is a **web application** accessible via a browser on any device (mobile, tablet, or desktop). It is not a native iOS or Android app. All features must function fully within a browser environment.

- **Primary target devices**: Mobile phones and tablets (browsers on Android/iOS).
- **Secondary target**: Desktop/laptop browsers — the desktop experience is fully specified in the **Responsive Layout & Desktop Design Specification** section and must never be an unspecified stretch of the mobile layout.
- **No app store installation required**: Users access the CRM directly via a URL.
- **Browser compatibility**: Must work on Chrome, Safari, and other modern browsers.
- **PWA support** (recommended): The web app should be installable as a Progressive Web App on mobile browsers so users can add it to their home screen for quick access.

## Lead Workflow

All newly added clients should automatically start as New Lead.

The workflow should allow the user to add a client directly from the workflow screen. This action should create a new client record with the default status of New Lead.

### Manager Notes on Specific Leads

Managers should be able to add internal notes to a specific lead directly from the lead detail page and from the workflow view.

This feature should support:

- **Lead-specific notes**: Notes are attached to the selected lead and remain part of that lead’s history.
- **Manager-only entry**: Only managers can create or edit these notes, while assigned consultants can view them.
- **Timestamp and author tracking**: Each note should show who added it and when it was created.
- **Internal/private context**: Notes should be clearly labeled as internal guidance, not customer-facing communication.
- **Useful for coaching and follow-up**: Managers can leave reminders such as follow-up instructions, escalation details, or coaching notes for the assigned consultant.

These notes should appear in the lead’s activity/history section and remain visible for future follow-up and handoff purposes.

### Deadline Alerts

The system should provide alerts for leads that are approaching important deadlines.

This should include:

- **Alerts when a CRF is near expiry**: Warns the assigned consultant.
- **Alerts when a reservation is near expiry**: A countdown timer warning for the 24-hour expiration.
- **Visible reminders** on the dashboard and lead page.
- **Optional notifications** so the consultant does not miss deadlines.
- **Escalation Path for Expiring Reservations**: If a reservation is within 4 hours of expiring and has not been extended or marked as paid, the alert should automatically escalate to the **Manager's dashboard** under the Priority section, enabling the manager to follow up with the consultant proactively.

## Navigation

The app navigation bar should adapt based on the user's role to keep the interface focused. On mobile, navigation lives in the bottom tab bar defined below; on tablet and desktop, the bottom bar is replaced by the persistent left sidebar defined in the **Responsive Layout & Desktop Design Specification** section:

### Property Consultant Navigation

- **Dashboard**: Personal metrics, individual priority alerts, and recent activities.
- **My Leads**: List and workspace to search, filter, and manage their assigned leads.
- **(+) Quick Add**: A prominent, highlighted center action button in the bottom navigation bar to instantly open the "Add Client" form.
- **Workflow**: Visual pipeline board showing personal leads organized by stage.
- **Assistant**: A hybrid conversational page featuring a simulated AI copilot ("Tenacious AI") and a structured Console view, showing their daily agenda, reservation/CRF expiry warnings, stagnant lead reminders, and personal monthly goal progress.

### Manager Navigation

> **Mobile-first note**: The app is designed mobile/tablet-first. On mobile, the bottom nav bar has a strict 5-slot limit. The primary 5 slots are listed first; overflow items are accessed via the `(+)` center menu.

**Mobile Bottom Nav (5 persistent slots)**:

- **Dashboard**: Team-wide metrics, aggregated priority items, and team activity feed.
- **All Leads**: Central list of all leads across all consultants, with filters to view by specific consultant.
- **(+) Quick Add**: Prominent, elevated center action button. Opens the role-specific Quick Action menu.
- **Workflow**: Visual pipeline board showing all team leads by stage, with filters per consultant.
- **Assistant**: A hybrid conversational page featuring a simulated AI copilot ("Tenacious AI") and a structured Console view, showing automated team guards, bottleneck alerts, activity warnings, goal pace tracking, Stage Reversion Inbox, and Top Performer Spotlight.

**Overflow items** (accessed via the `(+)` center menu on mobile; persistent nav items on tablet/desktop):

- **Schedule**: Full team schedule management — create, edit, and remove appointments for any consultant.
- **Team**: Team list, displaying profiles, activity history, and lead count.
- **Reports**: Dedicated interface to generate, view, copy, and export consolidated reports.
- **Leaderboard**, **Projects Computation**, **CRF Link**: Also accessible from the `(+)` menu.

### Mobile Bottom Navigation Layout

On mobile phones, the bottom navigation bar will visually prioritize key actions:

- **For Property Consultants**:
  - Left-side tabs: `Dashboard` and `My Leads`.
  - Center Tab: Circular elevated `(+)` action button.
  - Right-side tabs: `Workflow` and `Assistant`. (Leaderboard and Projects Computation remain accessible via the center `(+)` menu).
- **For Managers**:
  - Left-side tabs: `Dashboard` and `All Leads`.
  - Center Tab: Circular elevated `(+)` action button.
  - Right-side tabs: `Workflow` and `Assistant`.
  - **Overflow items** (Schedule, Team, Reports, Leaderboard, Projects Computation, CRF Link) are accessed via the `(+)` center action menu — consistent with what is defined in the Manager Navigation section above.

### Behavior when tapping the `(+)` Quick Add button:

- **For Property Consultants**:
  - Tapping `(+)` opens a bottom sheet or modal **Quick Action Menu** with the following options:
    1. **Add a Client**: Opens the Add Lead form to directly create a new lead (default status: New Lead).
    2. **Projects Computation**: Opens the Projects list to view target computations.
    3. **CRF Link**: Quick-copy / setup shortcut. _(The CRF link is stored on the user's Profile Page — that is the single source of truth. This shortcut is a convenience entry point to it.)_
       - **If already set up**: Tapping this immediately copies the consultant's personal CRF link to their device clipboard and shows a confirmation: `📋 CRF Link copied to clipboard!`
       - **If not yet set up**: Tapping this deep-links directly to the **CRF Link field on their Profile Page** where they can enter and save it. Once saved, the link is automatically copied to the clipboard.
    4. **Schedule**: Opens their schedule view.
    5. **Submit Attendance**: Opens the official attendance submission form for the consultant to submit their attendance when going to the office or when assigned to a manning shift.
    6. **Report**: Generates/views their personal activity report.
    7. **Sellers Portal**: Opens DMCI Sellers Portal (`seller.dmcihomes.com/Login/Auth`).
    8. **Leaderboard**: Navigates straight to the team sales rankings.
- **For Managers**:
  - Tapping `(+)` opens a similar **Quick Action Menu** tailored for managers:
    1. **Add & Assign Client**: Opens the Add Lead form with the "Assign To" team dropdown.
    2. **Projects Computation**: Opens the Projects list to view or configure computations.
    3. **CRF Link**: Quick-copy / setup shortcut. _(The CRF link is stored on the Manager's Profile Page — that is the single source of truth. This shortcut is a convenience entry point to it.)_
       - **If already set up**: Tapping this immediately copies the manager's personal CRF link to their device clipboard and shows a confirmation: `📋 CRF Link copied to clipboard!`
       - **If not yet set up**: Tapping this deep-links directly to the **CRF Link field on their Profile Page** where they can enter and save it. Once saved, the link is automatically copied to the clipboard.
    4. **Reports**: Opens the Reports interface to view consolidated reports first.
    5. **Sellers Portal**: Opens DMCI Sellers Portal (`seller.dmcihomes.com/Login/Auth`).
    6. **Schedule**: Opens the team schedule management view.
    7. **Team**: Opens the Team dashboard to view agent profiles and last logins.
    8. **Leaderboard**: Navigates straight to the team sales rankings.

### Profile Avatar Dropdown (Upper Right)

The user's **profile picture** is always visible in the upper-right corner of the app on every screen. Tapping it opens a dropdown menu for both roles containing:

- **My Profile**: View and edit the user's own profile details and profile picture. The **Profile Page is the canonical location for setting or updating the CRF link** — changes made here are the source of truth reflected everywhere else in the system (Quick Action shortcut, leaderboard card, etc.).
- **Settings**: Account settings such as change display name and change password.
- **Log Out**: Ends the current session and returns to the login screen.

## Quick Action Options

The main interface features a floating/centered **`(+)`** quick action button on mobile that opens the role-specific menus detailed above to keep key tools one tap away.

### Property Consultant Quick Action Menu Items

- **Add a Client**: Add a new lead.
- **Projects Computation**: View dynamic project list and computations.
- **CRF Link**: Quick-copy / setup shortcut. Routes to the CRF Link field on the user's Profile Page (see **Profile Page** for the canonical setup flow). If already saved, copies it to clipboard instantly.
- **Schedule**: View schedule (read-only).
- **Submit Attendance**: Opens the official attendance submission form for office attendance or manning attendance: https://docs.google.com/forms/d/e/1FAIpQLSe3Oz5L_zFGdYdFavvAGgI5oFYC5YkifXfIN3AHssQK4fqm9Q/viewform?pli=1
- **Report**: Generate personal weekly/monthly performance reports.
- **Seller Portal**: Direct link to `seller.dmcihomes.com/Login/Auth`.
- **Leaderboards**: Team ranking board.

### Manager Quick Action Menu Items

- **Add & Assign Client**: Create lead and assign it to a consultant.
- **Projects Computation**: View, add, or delete projects and compute sheets.
- **CRF Link**: Quick-copy / setup shortcut. Routes to the CRF Link field on the Manager's Profile Page (see **Profile Page** for the canonical setup flow). If already saved, copies it to clipboard instantly.
- **Reports**: Open reports section to view team metrics first.
- **Sellers Portal**: Direct link to `seller.dmcihomes.com/Login/Auth`.
- **Schedule**: Open full team calendar and appointments management.
- **Team**: View team performance, profile pages, and last login statuses.
- **Leaderboards**: Team ranking board.

## Schedule

The CRM includes two separate scheduling subsystems to handle client interactions and team duties differently.

### 1. Client Schedule (Private)

- **Purpose**: Used for tracking specific client meetings, site trippings, and online or actual presentations.
- **Privacy Rules**:
  - **Managers**: Have full visibility. Can create, edit, delete, and view client appointments for any agent.
  - **Property Consultants**: Can view **only** their own personal client schedule. They are strictly restricted from seeing other consultants' client schedules or client names to maintain privacy.
- **Agent Controls**: Consultants cannot edit client schedules directly, but they can request or flag an appointment for cancellation (requiring Manager approval to remove).
- **Details Logged**: Type (Tripping, Online Pres., Actual Pres.), Client Name, Date/Time, Project target, and meeting Notes.

### 2. Manning & Booth Schedule (Public & Team-Shared)

- **Purpose**: Tracks roster shifts for booth duties, showroom manning, mall exhibits, or site hosting.
- **Visibility Rules**:
  - **Publicly Visible**: All Property Consultants can view the entire team's Manning & Booth schedule. This allows everyone to see who is on duty, where, and when to coordinate coverage and prevent scheduling overlaps.
  - **Managers**: Have full control to schedule, edit, assign, and delete manning shifts for any consultant.
  - **Property Consultants**: Read-only access to the shared calendar. Can filter by Location/Booth or Consultant Name.
- **Details Logged**: Location/Booth Name (e.g. "SM North Booth", "Showroom Host"), Assigned Consultant, Date, Start Time, and End Time.

### 3. Schedule View Modes

The Schedule screen supports two view modes, toggled via a control at the top of the page: **`[ List ]`** and **`[ Calendar ]`**.

#### List View

- Chronological list of upcoming appointments grouped by date (Today, Tomorrow, future dates).
- Each entry shows the event type icon, client/location name, time, and quick action buttons.
- Two sub-tabs at the top switch between **My Appointments** (Client Schedule) and **Manning & Booth Duty**.

#### Calendar View

- A full **month-grid calendar** is displayed by default with a **`[ Month ]` / `[ Week ]`** toggle.
- **Month View**:
  - Each day cell shows colored event dots or short event chips indicating how many/what type of appointments fall on that day.
  - Tapping any date expands a **Day Detail Panel** below the calendar showing all events for that day in list format.
  - Days with no events show an empty cell.
- **Week View**:
  - A 7-column day layout with time slots (e.g., 8 AM – 8 PM) displayed as horizontal rows.
  - Events appear as **time-block chips** positioned in their respective time slots and day columns.
  - Multiple events in the same time slot stack side-by-side within the day column.

#### Color Coding (Calendar & List)

| Event Type           | Color                 | Who Sees It                   |
| -------------------- | --------------------- | ----------------------------- |
| Client Tripping      | 🟢 Teal (`#069494`)   | Assigned Consultant + Manager |
| Online Presentation  | 🔵 Blue (`#3B82F6`)   | Assigned Consultant + Manager |
| Actual Presentation  | 🟣 Purple (`#8B5CF6`) | Assigned Consultant + Manager |
| Manning / Booth Duty | 🟠 Amber (`#D97706`)  | All Consultants + Manager     |

#### Role-Specific Calendar Behavior

- **Property Consultant**:
  - Calendar shows their own client appointment blocks in teal/blue/purple.
  - Team manning/booth shifts appear as amber blocks (visible across the whole team).
  - Other agents' client blocks are **never shown**.
- **Manager**:
  - Calendar shows all agents' client appointments color-coded per agent (with a legend).
  - A **Filter by Agent** dropdown at the top lets the Manager isolate one consultant's schedule.
  - Manning/booth blocks appear in amber across all days.
  - Tapping any event block opens the full event detail with Edit and Delete options.

### Schedule Notifications

- Consultants receive system notifications whenever the Manager schedules them for a Client meeting or a Manning/Booth shift.
- Reminder alerts are sent to the assigned agent prior to both client trippings and manning shifts.

## Projects & Computations Library

The Projects & Computations Library acts as a central repository for viewing sample computations of active projects, helping consultants answer pricing questions quickly.

### 1. Library Access

- Accessible to **both** Property Consultants and Managers by tapping **`Projects Computation`** in the `(+)` bottom sheet Quick Action menu.

### 2. Projects List View Layout

- Shows a data-dense grid list of active projects (preloaded with **Allegra Garden Residences** first and **Sonora Garden Residences** second).
- Each project item is displayed as a clean card containing:
  - Project Name
  - Developer Name (DMCI Homes)
  - Badge indicating file type of computation sheet (e.g. `PDF` or `IMG`)
  - A quick preview thumb icon.

### 3. Computation Viewer Panel

Tapping a project card opens a full-screen bottom drawer or modal displaying the document workspace:

- **File Previewer**: Renders the uploaded Sample Computation directly (interactive Zoom, page flipping for PDFs, or high-res layout for image formats).
- **Consultant Actions**:
  - **Copy Direct Link**: `[ 📋 Copy Link ]` — copies the sample computation sharing URL to the clipboard (allowing instant pasting into WhatsApp, Viber, or Messenger chats).
  - **Download File**: `[ 📥 Download ]` — triggers local browser download.
  - **Open External**: `[ 🔗 Open Full Screen ]` — opens the file in a new browser tab.
- **Manager-Only Actions**:
  - Displays an **`[ ✏️ Edit Project ]`** shortcut button at the top, directing them to the Manager Assistant Admin panel for that project.

The workflow should follow a simple and clear core path:

1. New Lead
   - This is the default starting point for every new client.
   - The lead is assigned to a Property Consultant and enters the active pipeline.
   - **Flexible Stage Transitions & System Guards**: Leads follow a guarded, forward-only progression path. While consultants may advance a lead to any forward stage, the system enforces the following policies to protect process integrity and minimize user error:
     - **Double-Confirmation Transition Prompt**: Before any stage transition is saved, the app displays a clear confirmation modal detailing the transition: _"You are moving [Client Name] from [Current Stage] to [New Stage]. Confirm transition?"_ showing the required fields for that stage.
     - **10-Minute Agent Grace Period (Undo Transition)**: If an agent makes a transition by mistake, a floating alert card is displayed on that Lead's detail page showing a countdown timer: _"Stage changed. ⏱️ 09:59 remaining to Undo"_. The agent has a **10-minute window** to click a **`[ ↩️ Undo Transition ]`** button, which immediately reverts the lead to its previous stage.
       - Once the 10-minute timer expires, or if the user navigates away from the Lead Page, the transition **locks against agent self-undo** — the agent can no longer reverse it on their own. The stage is not immutable: a Manager can still revert it at any time via the Stage Reversion Request flow.
     - **Forward-Only Progression for Consultants**: Outside of the active 10-minute Grace Period, Property Consultants are **strictly blocked** from moving a lead to an earlier stage. The stage selector dropdown in their workspace only displays the current stage, forward stages, and Cancelled.
     - **Manager-Only Backward Transitions (Reversion)**: Only a **Manager** can move a lead backward to a previous stage once it is locked. Agents must submit a formal Stage Reversion Request with a written reason via the Lead Page; the Manager approves or denies it from the Reversion Inbox.
     - **Reversion Justification**: To execute a backward transition, the Manager must input a correction reason (e.g. _"Client cancelled reservation and reverted to CRF"_). The system logs this explanation, the timestamp, and the Manager's name in the Lead's Audit Trail and notifies the assigned agent.
     - **Required Fields on Entry**: When transitioning into a stage, the system forces immediate entry of that stage's required fields:
       - Entering `CRF` requires: CRF Submission Date.
       - Entering `Reserved` requires: Unit Description, Unit Payment Date, and Payment Status (Paid/Unpaid).
       - Entering `Documentation` requires: Documentation Start Date.
     - **Documentation Check Block**: Moving a lead to `Closed Sale` (Pending Verification) is strictly blocked unless **every** document checklist item for **every** registered buyer/co-buyer is checked off.
     - **CRF Expiration Timer Retention**: If a lead enters the `CRF` stage, the 30-day countdown begins. Moving the lead to another stage and back to `CRF` does not reset the countdown; it resumes from its original expiration timeline to prevent deadline avoidance.
     - **Clean Funnel Reports**: Funnel conversion analytics only count the _first-time_ a lead enters a stage to prevent double-counting from back-and-forth movements.
     - **Manager-Only Close Verification**: Transitioning to `Closed Sale` is an Agent submission that requires Manager approval. Rejection reverts the lead to `Documentation`.

2. CRF / Customer Registration Form
   - A lead enters CRF after showing interest.
   - The CRF has a validity period of 30 days.
   - If the CRF is about to expire, it can be extended. The Property Consultant can extend it once (for an additional 30 days). Subsequent extensions require Manager approval.
     - **Extension Justification**: The system must require the user to enter a brief explanation or select a reason for the extension, which is logged in the Lead's history.
   - If a CRF reaches its 30-day limit (or extension limit) without moving to Reserved or Closed, the system will automatically transition the lead's status to `Cancelled` with the reason `"CRF Expired"`.
   - Once the client is successfully reserved or closed, the CRF is considered completed.

3. Reserved
   - The client reserves a unit when ready.
   - A reservation for a unit should last for 24 hours only.
   - The system should show a countdown timer for the reservation expiry.
   - **Reservation Expiry Outcome**: When the 24-hour countdown reaches zero with no extension and no confirmed payment, the system **automatically changes the lead's status badge to `Expired`** (a distinct amber/orange read-only badge displayed within the Reserved stage card). The lead does **not** auto-cancel and does **not** revert to CRF — it stays in Reserved but is visually flagged as Expired to both the agent and manager.
     - An **`Expired`** reservation is frozen: the agent cannot log any further activity or progress the lead until the status is resolved.
     - The assigned agent receives a notification: _"[Client Name]'s reservation has expired. Request an extension or confirm payment to resume."_
     - The Manager receives an escalation notification: _"[Client Name]'s reservation (owned by [Agent Name]) has expired with no action."_
     - To unfreeze the lead, the agent must either: **(a)** confirm payment (moves to Documentation) or **(b)** submit a reactivation/extension request that the Manager approves. Once approved, a new 24-hour countdown begins.
     - If the Expired reservation remains unresolved for **3 days**, the system auto-transitions the lead to `Cancelled` with the reason `"Reservation Expired – No Action"` and follows the standard auto-archiving timeline.
   - The reservation can be extended if needed by the consultant without requiring manager approval.
   - The system should ask whether the reservation is already paid.
   - The system should ask what unit was reserved.
   - The selected unit should automatically appear in the lead’s basic information section for that specific lead.
   - The system should ask when the payment date was made.

4. Documentation
   - This stage confirms that the client’s documents and required information are being compiled and completed.
   - The system should display a counter showing how many days the lead has spent in the Documentation stage to help track progress (e.g., "12 days in Documentation").
   - **Buyer / Co-Buyer / Co-Owner Document Checklists**:
     - Documents are tracked per registered buyer entity on the lead. By default, every lead has one **Primary Buyer**.
     - Agents can dynamically add one or more **Co-Buyers** or **Co-Owners** to the lead record.
     - Each individual registered person (Primary Buyer, Co-Buyer, or Co-Owner) must have their own document checklist with the required items:
       - `[ ]` Valid ID
       - `[ ]` Valid ID with Selfie
       - `[ ]` Proof of TIN
       - `[ ]` Proof of Account
     - The system must also support adding and tracking documents for **co-owners and co-buyers** as separate entities, not just the primary buyer.
     - The system enforces a validation rule: A lead **cannot** be transitioned to `Closed Sale` status unless every checklist item for every registered buyer, co-buyer, and co-owner is checked.
     - On the pipeline view, leads in the Documentation stage display a checklist progress indicator (e.g., `👥 2 Buyers | 5/8 Docs Checked`).

5. Closed Sale
   - This stage marks the sale as completed.
   - **Agent Submission**: The Property Consultant transitions the lead from `Documentation` to `Closed Sale` and inputs the **sale price** and **payment date**.
   - **Pending Verification**: Upon submission, the lead enters a `Pending Verification` status. It is not yet counted on the Leaderboard or team sales goals.
   - **Manager Verification**: The Manager reviews the pending sale on their Dashboard or Assistant Page. They have a simple **"Approve / Reject"** toggle:
     - **Approve**: The lead's status is officially confirmed as `Closed Sale` (Green status badge), and it is added to the Leaderboard and sales goal progress.
     - **Reject**: The Manager enters a brief correction reason (e.g. _"Wrong unit price"_). The lead automatically reverts to the `Documentation` stage. The assigned agent is notified of the rejection and the reason, allowing them to correct the details and re-submit.

6. Cancelled
   - This stage is used when a client backs out or cancels.
   - The system should allow a cancellation reason, notes, cancellation date, and whether the client may return later.
   - **Lead Reactivation**: To bypass duplicate checking when a cancelled or archived client returns, the consultant can search for the lead and click a **"Reactivate Lead"** button. This transitions the lead back to the `New Lead` stage, generates a new timestamp, and logs the reactivation in the Activity History.
   - **Automatic Archiving**: Leads that remain in the Cancelled stage or have an expired CRF for more than 30 days should be automatically moved to an "Archived" state, hiding them from the active list but keeping them searchable via an "Archived" filter.
   - **Archiving Warning Notifications**: The system must notify the assigned consultant 5 days before a lead is automatically archived (e.g. at day 25 of expiration or cancellation), allowing a final opportunity to follow up or re-engage the client.

Optional engagement actions:

- Tripping
- Online Presentation
- Actual Presentation

These actions should be available from the lead workflow as optional steps. The system must support **multiple logs** for each action (retaining history of dates and notes for each session, such as multiple trippings or Zoom presentations for a single client) rather than overwriting previous entries. All logged sessions should be included in the weekly report automatically.

> [!NOTE]
> **Stage-Gate for Activity Logging**: Once a client reaches the **Documentation** or **Closed Sale** stage, the ability to log new engagement activities (Tripping, Online Presentation, Actual Presentation) is disabled and hidden in the UI. Logically, these pre-sales marketing activities are complete at these advanced stages.

> [!NOTE]
> **Engagement activities are optional prerequisites**: A lead may move from **New Lead** to **Reserved** without having any Tripping, Online Presentation, or Actual Presentation activity logged. These actions are treated as optional engagement steps, not mandatory workflow requirements. The system should not block or require any of these entries before a lead can be moved to reservation.

Recommended flow:

- **Suggested flow**: New Lead → CRF → Reserved → Documentation → Closed Sale. **Property Consultants can only move a lead forward** — the stage dropdown shows only the current stage, forward stages, and Cancelled. Backward movement is blocked at the UI level.
- **Manager override**: Only Managers can move a lead to an earlier stage. Agents must submit a formal Stage Reversion Request (with a written reason) via the Lead Page; the Manager approves or denies it from the Reversion Inbox.
- **Optional flow**: Engagement actions can be added at any point before reservation (i.e., in New Lead, CRF, or Reserved stages).
- **Exit flow**: Cancelled can happen from any stage.

This keeps the workflow simple, clear, and tamper-resistant while still supporting all legitimate business scenarios.

## Roles

The system should support the following user roles:

- **Property Consultant**: Manages their own leads, updates lead stages, records engagement activities, and views their personal dashboard and leaderboard.
- **Manager**: Oversees all property consultants, monitors overall team performance, manages lead assignments, views all leads, and exports consolidated reports. (Note: Managers can also handle personal clients, but their personal sales are excluded from the main leaderboard to maintain competitive fairness for consultants).

### Roles Comparison Table

| Feature / Capability       | Property Consultant                      | Manager                                              |
| :------------------------- | :--------------------------------------- | :--------------------------------------------------- |
| **Primary Focus**          | Manage personal leads & pipeline sales   | Oversee team, performance, and assignments           |
| **Lead Visibility**        | View/manage assigned leads only          | View/manage all leads across all consultants         |
| **Lead Assignment**        | Create leads assigned to self            | Create, assign, and transfer any leads               |
| **Lead Deletion**          | No (can only cancel or archive leads)    | Yes (permanent deletion authority)                   |
| **Lead Sharing**           | Request sharing with other consultants   | Authorize and revoke shared access                   |
| **Dashboard Metrics**      | Personal metrics (My leads, CRFs, Sales) | Team metrics (Aggregated stats, agent overview)      |
| **Priority Tasks**         | Personal upcoming deadlines/expirations  | Unassigned leads, team-wide escalations              |
| **Leaderboard**            | Ranked as active participant             | Excluded from rankings (even if selling)             |
| **Reports**                | Generate personal activity reports       | Generate consolidated team/consultant reports        |
| **Reservation Extensions** | Can extend reservations directly         | Can review escalated expirations, follow up          |
| **CRF Extensions**         | Direct extension for the 1st time only   | Approve/perform subsequent extensions                |
| **System Configuration**   | Read-only access to projects/units       | Manage consultant team roster and project categories |

## Superadmin Role Plan

A **Superadmin** is a platform-level role for system-wide governance, operational control, and security management. This role is separate from Managers and Property Consultants and sits above them in the permission hierarchy.

### Production-Ready Superadmin Scope

The Superadmin role must be treated as a high-trust administrative role with full operational authority over the platform, while remaining tightly controlled through authentication, confirmation flows, and audit logging.

### Superadmin Responsibilities

- Manage all Managers and Property Consultants across the CRM.
- Approve or reject new Manager and agent registrations.
- Lock or unlock global registration access to prevent spam or unauthorized onboarding.
- Configure company-wide settings such as projects, units, team limits, broadcast policies, and system defaults.
- View all leads, notes, activities, reports, and audit logs across the platform.
- Oversee account recovery, role changes, account deactivation/reactivation, and other sensitive administrative actions.
- Monitor system health, backup/restore readiness, and critical security settings.
- Act as the final escalation point for disputes, compliance issues, and high-risk operational events.

### Superadmin Permissions

- Full read/write access to all platform data, including company-wide records and cross-team information.
- Ability to create, edit, deactivate, reactivate, and delete user accounts at the system level.
- Ability to approve registrations and control registration access globally.
- Ability to manage system settings, broadcast content, high-level reports, and platform-wide configuration.
- Access to audit trails, activity history, security logs, and recovery tools for oversight and troubleshooting.
- Ability to perform destructive or sensitive actions only through confirmation flows, role checks, and logging.

### Production-Ready Security Rules

- Superadmin accounts must use strong authentication and be restricted to approved administrators only.
- Superadmin must not be available for self-service signup; access is granted only through secure onboarding.
- Critical actions such as deleting accounts, resetting access, changing roles, or restoring deleted records must require explicit confirmation.
- All sensitive actions must be logged with actor, action, timestamp, and affected entity.
- Superadmin should not be able to bypass core business safeguards without a documented exception process.

### Superadmin Constraints

- Superadmin is not a frontline sales role and should not appear on the leaderboard.
- Superadmin should not replace Manager-level lead oversight; it acts as the highest platform authority for governance and control.
- Superadmin access must be limited to approved administrators only and protected by strong authentication and audit controls.
- Any destructive action should trigger a second confirmation step and be visible in the audit trail.

### Superadmin UX Expectations

- Superadmin should have a dedicated admin dashboard with quick access to user management, registration approvals, team health, system settings, and audit history.
- Sensitive actions should use clear confirmation modals, role validation, and visible audit trail entries.
- The interface should be simple, secure, and resistant to accidental misuse.
- The dashboard should expose only the minimum necessary controls for the current task to reduce administrative risk.

## Access / Privacy

- **Property Consultant Access**: Each consultant should only be able to view and manage their own leads, activity logs, and records. Records should not be visible to other consultants unless access is explicitly shared/delegated by the manager.
- **Manager Access**: The manager has full read and write access to all leads, notes, and activity histories across all consultants (including any personal leads the manager is handling).
- **Lead Assignment & Transfer**: The manager can assign unassigned leads and transfer ownership of any lead from one consultant to another.
- **Lead Deletion Security & Soft-Delete (Trash Bin)**: Property Consultants are restricted from deleting client records. Only Managers have deletion authority.
  - Deleted leads remain in the Trash Bin for **30 days**, during which the Manager can view and click **"Restore Lead"** to recover them. If restoring a lead triggers a duplicate phone or Facebook URL conflict with a newly created active lead, the system blocks the restore and prompts: _"Cannot restore. Client is already registered under [Active Agent]. Would you like to merge or view details?"_
  - After 30 days, Supabase automatically purges the record permanently.
- **Lead Sharing & Delegation**: If a consultant needs collaborative help or coverage (e.g., during leave), the Manager can delegate shared access (View-Only or Co-Owner) to another consultant. Consultants cannot share leads directly.

## Leaderboard

The system should include a leaderboard based on sales performance. All property consultants and managers should be able to view the leaderboard, which should rank consultants by total closed sales and/or total sales value.

- **Role Exclusion**: Only Property Consultants are ranked on the leaderboard. Manager accounts are excluded from leaderboard rankings to maintain focused competition and motivation for the frontline sales team.

### Leaderboard Filters

- **This Week**: Verified closed sales where the **Manager's approval timestamp** falls within the current calendar week (Monday 00:00 – Sunday 23:59, company timezone).
- **Monthly**: Any specific calendar month.
- **All Time**: Complete historical data.

These filters update the ranking based on the selected time period.

- **Rank Calculation & Cutoff Rules (applies to all filters)**: All ranking is based on the **Manager's approval timestamp** of the Closed Sale, not the date/time the consultant marked the sale as completed, using a standardized company timezone. This applies to This Week, Monthly, and All Time equally — ensuring all entries are verified and eliminating disputes over submission cutoffs regardless of the selected filter.

### Leaderboard Design

The leaderboard should be designed to feel motivating and exciting for consultants.

It should include:

- a clear ranking display for top performers
- visual emphasis for 1st, 2nd, and 3rd place
- simple progress or performance indicators
- a fun and energetic presentation style that makes consultants feel motivated and competitive
- a clean layout that is easy to view on mobile

## Consultant Profile Page

A dedicated profile page should be available for each consultant.

For the first version, each consultant profile page should include:

- Consultant name
- Profile picture
- A unique CRF link for that consultant
- **Account Settings**: Options to change display name, update profile picture, and change password.

Each consultant should be able to add and update their own CRF link so it is easier to find and use.

This page should be separate from the lead workflow and can later be expanded for assignments and scheduling.

## Design Approach

The CRM must be designed **mobile and tablet first**. The entire interface — every screen, form, modal, button, and table — must be designed and tested for phones and tablets before any consideration for larger screens. The desktop rendering of every screen is then derived from the **Responsive Layout & Desktop Design Specification** section — it is fully specified there, never improvised.

This means:

- **Touch-first interactions**: All buttons, action items, and tap targets must be large enough for finger input (minimum 44×44px touch areas).
- **Bottom navigation**: Primary navigation should be reachable with the thumb at the bottom of the screen on phones.
- **No horizontal scrolling**: Every screen must display fully within the device viewport width without requiring users to scroll sideways.
- **Tablet layout**: On tablets, the layout may expand to a two-column view where useful (e.g., lead list on the left, detail view on the right), but must never sacrifice usability for aesthetics.
- **Fast loading**: All screens should load quickly on mobile data connections (3G/LTE), with lazy loading for images and pagination for long lists.
- **Offline tolerance & Conflict Resolution**: The system should gracefully handle poor connectivity by queuing updates in local storage and syncing when connection is restored. To resolve write conflicts (e.g., an agent makes updates offline while a manager transfers ownership online), Supabase must enforce **Optimistic Locking** using a `version` or `updated_at` column. If a sync conflict occurs:
  - The system rejects the offline update.
  - A notification warns the offline agent of the conflict.
  - Instead of saving rejected changes as unstructured text notes (which are hard to parse and reconcile), the app must capture the rejected updates in a local "Conflicted" state and display a side-by-side visual diff tool.
  - The agent must be prompted to resolve the conflict by selecting one of the following resolution flows:
    1. **Force Overwrite** (only if the user has Manager/Superadmin permissions).
    2. **Discard Local Changes** (revert local state to match the current server version).
    3. **Field-by-Field Merge** (manually select which fields from the offline update to keep vs. which fields to overwrite with server values).

### UI/UX Usability Guidelines

To make the interface intuitive and understandable on first use:

1. **Traffic Light Color Coding**:
   - 🟢 **Green (Safe / Success)**: Active status, verified closed sales, completed documentation.
   - 🟡 **Yellow (Needs Attention / Pending)**: Stagnant leads (7+ days), upcoming appointments, items pending Manager approval.
   - 🔴 **Red (Critical Expiry / Escalation)**: Reservations expiring in `< 24 hours`, CRFs expiring in `< 3 days`, inactive agents (3+ days).
   - 🔵 **Blue (New Activity)**: Unread notifications in the Notification Center.

2. **Assistant Page Layout**:
   - **Dual-View Navigation**: The Assistant page features a persistent tab/segmented control at the top: **`[ Conversational (AI) ]`** and **`[ Console (Grid) ]`**. Switching views fades the screen smoothly (`opacity 0 ➔ 1` over `150ms`).
     - **Console (Grid) View**: Displays role-specific data panels as collapsible card accordions (6 panels for Property Consultants, 8 panels for Managers). Critical Expiry warnings and the Notification Center load expanded by default; other panels start collapsed to minimize scrolling.
     - **Conversational (AI) View**: A premium glassmorphic chat interface featuring **Tenacious AI** (represented by a glowing Success-green `#16A34A` online status badge and avatar). Displays an active message thread, quick-action suggestion chips, and a chat input with a microphone icon.
   - **Simulated AI Engine**: The chat interface runs entirely in the browser using client-side JavaScript rules (requiring **zero external API calls/credits**):
     - **Thinking Animation**: When a message is sent, the AI displays a typing placeholder bubble with a pulsing animation for `800ms–1200ms` before responding.
     - **Typewriter Effect**: AI text responses are streamed character-by-character (`15ms` per character) to simulate real-time generation.
     - **Dynamic Interactive Widgets**: The AI embeds standard interactive cards and lists (with buttons like `[ 📞 Call ]`, `[ ✅ Approve ]`, etc.) directly into the message bubbles.
     - **Smart Fallback Routing**: Unrecognized queries trigger a polite response (_"I specialized in CRM data..."_) and inject role-specific quick-action redirection buttons to guide the user back.

3. **Contextual Micro-Actions**:
   - Each card in a list or warning panel must include a clear, direct action button so the user doesn't have to navigate to a different page to respond.
   - Examples: A stagnant lead card displays a prominent `[ 📞 Call Client ]` button; an expiring reservation card displays a `[ 🔄 Request Extension ]` button.

4. **Workflow Board Mobile Gestures**:
   - On mobile phones, display only one stage column at a time. Users should swipe left/right to move through the stages (New Lead ➔ CRF ➔ Reserved ➔ Documentation ➔ Closed Sale), with clear pagination indicator dots at the bottom.

5. **Circular Floating Action Button (+)**:
   - The center **`(+)`** button must be visually dominant, filled with the primary brand teal (`#069494`; pressed state `#047A7A`). No blue, indigo, or gradient variants — the FAB is the single most prominent teal element on screen.
   - When tapped, the background should apply a soft-blur effect, sliding up the 5-item menu from the bottom within easy reach of the thumb.

### Design Inspiration & Aesthetic System

The CRM UI draws from three carefully weighted references to produce a **professional, high-density, modern SaaS** experience that feels premium and trustworthy — not gamified.

> **70% Attio** → Overall CRM layout, contact/lead profile architecture, relational data structure.
> **20% Linear** → Clean spacing system, micro-interactions, hover states, and interface rhythm.
> **10% Pipedrive** → Pipeline board layout, stage column headers, and deal card design.

#### Attio Influence (70%) — Structure & Professionalism

- **Record/Profile Architecture**: Lead profiles are structured as modular property rows — each field (status, stage, unit, payment date, assigned consultant) displayed as a labeled attribute with an inline edit interaction, similar to Attio's contact records.
- **Left Sidebar Navigation** (tablet/desktop): A persistent dark sidebar (`#111827`) provides navigation. On mobile, this collapses into the bottom tab bar. Full contents, dimensions, and item ordering are defined in the **Responsive Layout & Desktop Design Specification** section.
- **Color Philosophy**: The canonical Color System defines the palette — the primary teal (`#069494`) for key actions, with muted, desaturated supporting colors. Avoid neons or saturated primaries (Attio-style restraint).
- **Surface Hierarchy**: Three distinct surface levels — page (`#FFFFFF`), surface panels (`#F9FAFB`), and elevated overlays (`#FFFFFF` with Medium shadow `--shadow-md`).
- **1px Hairline Borders**: Dividers and card borders use 1px strokes (`#E5E7EB`), not thick colored borders.
- **Status Badges**: Soft, muted background-colored chips (e.g., a light teal bg with dark teal text for "Active"). Never harsh or neon.
- **Contextual Interaction**: Sidebars, drawers, and slide-over panels keep the user in context rather than navigating to a new page whenever possible.
- **Data-Dense Layouts**: Present more information per screen than a consumer app. Use compact list rows with secondary metadata on the same line.

#### Linear Influence (20%) — Spacing, Motion & Precision

- **Spacing Grid**: All spacing strictly follows an **8px base unit** rhythm using the device-specific scales defined in the Spacing System (Mobile: `8 12 16 24 32 48`; Desktop: `16 24 32 48 64 96`). No arbitrary or mid-point values.
- **Typography as a System**: Each text role has a fixed token (e.g., `label-xs`, `body-sm`, `title-md`, `heading-lg`). Never pick sizes ad-hoc.
- **Hover States**: Minimal, purposeful hover feedback — a subtle `background-color` shift (e.g., `#F9FAFB` → `#F3F4F6`) and a `0.12s ease-out` transition. No heavy shadows or scale transforms on hover.
- **Micro-animations**: Functional, not decorative. Use `cubic-bezier(0.4, 0, 0.2, 1)` easing curves for all transitions. Keep durations under 200ms. Avoid looping or idle animations.
- **Focus States**: Keyboard focus rings use a 2px `#069494` outline with a 2px offset — visible, but not jarring.
- **Command Palette / Search**: Instant, real-time filtering with no perceived lag. Results appear within the same render frame.

#### Pipedrive Influence (10%) — Pipeline Board

- **Horizontal Stage Columns**: The Workflow board displays leads in vertical columns, one per stage (New Lead → CRF → Reserved → Documentation → Closed Sale), flowing left to right.
- **Column Headers**: Each column header shows the stage name and a summary badge (total count of leads in that stage).
- **Deal Cards**: Cards on the board are clean white, compact, with the client name as primary text, the assigned consultant and stage age as secondary metadata, and a color-coded urgency dot (green = active, yellow = needs attention, red = critical expiry).
- **"Rotting" Visual**: Stagnant or bottlenecked leads in a column show a subtle amber left-border stripe to indicate they need attention — no additional icons needed.
- **Mobile Board**: On mobile, show one column at a time with swipe-left/right gesture navigation and stage dot indicators at the bottom.

### Color System (Canonical — Responsive Design System)

> [!IMPORTANT]
> **Single Source of Truth — Teal `#069494` is the only brand accent.** Every hex value in the application must come from this token set. There is no blue, indigo, navy, or "corporate blue" accent anywhere in the product. Any section of this document that names a color (buttons, badges, splash screen, FAB) resolves to a token defined here. If a color is needed that is not listed, the answer is one of these tokens — never a new invented hex.

**Core tokens**:

| Token            | Value     | Usage                                                                     |
| :--------------- | :-------- | :------------------------------------------------------------------------ |
| Primary          | `#069494` | Primary buttons, active states, focus rings, links, key metric highlights |
| Primary Hover    | `#047A7A` | Hover/pressed state of any primary element                                |
| Primary Light    | `#D9F3F3` | Teal chip backgrounds, selected-row tint, subtle brand fills              |
| Background       | `#FFFFFF` | Page background (the base layer)                                          |
| Surface          | `#F9FAFB` | Section panels, input fields, table header rows, hover tint base          |
| Border           | `#E5E7EB` | 1px hairline borders and dividers                                         |
| Text Primary     | `#111827` | Body text, headings                                                       |
| Text Secondary   | `#6B7280` | Metadata, labels, timestamps                                              |
| Text Placeholder | `#9CA3AF` | Input placeholders, disabled text                                         |
| Success          | `#16A34A` | Solid success buttons, positive trends                                    |
| Warning          | `#D97706` | Solid/outline warning actions, amber alerts                               |
| Error            | `#DC2626` | Solid destructive buttons, critical alerts, notification badge pills      |

**App-specific extensions** (required by the CRM, derived from the core tokens):

- **Deep Amber Alert (Broadcast Overlay)**: `#B45309` — the darkened variant of the Warning token, used only as the full-screen broadcast overlay background (white text on it passes WCAG AA).
- **Sidebar / Dark Surface**: `#111827` (the Text Primary token used as the dark sidebar and splash background). Sidebar text: `#9CA3AF`; active item text: `#FFFFFF`; active item background: `rgba(255,255,255,0.08)`.
- **Cards**: `#FFFFFF` on the white page they are separated by a 1px `#E5E7EB` border + Small shadow; on `#F9FAFB` surface bands they read as raised white panels.
- **Status Semantic Chips** (tinted background + dark text for WCAG contrast; the chip text colors are the darkened chip-variants of the Success/Warning/Error tokens above):
  - ✅ **Success / Verified**: Background `#DCFCE7`, Text `#15803D`.
  - ⚠️ **Warning / Pending**: Background `#FEF9C3`, Text `#854D0E`.
  - 🔴 **Critical / Expiring**: Background `#FEE2E2`, Text `#B91C1C`.
  - 🔵 **Info / Unread**: Background `#DBEAFE`, Text `#1D4ED8`.
  - ⚫ **Inactive / Archived**: Background `#F3F4F6`, Text `#6B7280`.
  - 🟩 **Brand / Active (Teal Chip)**: Background `#D9F3F3` (Primary Light), Text `#047A7A` — used for CRF Active and other "in-progress brand state" badges.
  - 🟪 **Stage Identity (Violet Chip)**: Background `#EDE9FE`, Text `#6D28D9` — used only where a stage needs visual identity distinct from the semantic set (e.g., the Reserved stage badge).

**Shadows** (the only three levels permitted):

- **Small** (resting cards, table rows): `0 2px 8px rgba(17,24,39,.06)`
- **Medium** (dropdowns, popovers, modals): `0 10px 30px rgba(17,24,39,.08)`
- **Large** (slide-over panels, full-screen overlays, command palette): `0 24px 60px rgba(17,24,39,.12)`

**CSS Variables** — declared once in `src/assets/styles/main.css`; every component reads from these, never from hardcoded hex:

```css
:root {
  --color-primary: #069494;
  --color-primary-hover: #047a7a;
  --color-primary-light: #d9f3f3;
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  --color-text: #111827;
  --color-text-secondary: #6b7280;
  --color-text-placeholder: #9ca3af;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-sidebar: #111827;
  --font-family: "Inter", sans-serif;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 9999px;
  --shadow-sm: 0 2px 8px rgba(17, 24, 39, 0.06);
  --shadow-md: 0 10px 30px rgba(17, 24, 39, 0.08);
  --shadow-lg: 0 24px 60px rgba(17, 24, 39, 0.12);
}
```

### Typography System

- **Font**: **Inter** (Google Fonts) — declared once as `--font-family: "Inter", sans-serif`.
- **Responsive Heading Scale** (canonical — from the Responsive Design System). Sizes shift per breakpoint; weights never change:

  | Element | Mobile | Tablet | Desktop | Weight |
  | ------- | ------ | ------ | ------- | ------ |
  | Hero    | 36px   | 48px   | 64px    | 800    |
  | H1      | 32px   | 40px   | 48px    | 700    |
  | H2      | 28px   | 32px   | 36px    | 700    |
  | H3      | 22px   | 26px   | 30px    | 600    |
  | H4      | 20px   | 22px   | 24px    | 600    |
  | Body    | 16px   | 16px   | 16–18px | 400    |
  | Small   | 14px   | 14px   | 14px    | 400    |
  | Caption | 12px   | 12px   | 12px    | 400    |
  | Button  | 16px   | 16px   | 16px    | 600    |

  > **Scale usage rule**: `Hero` and `H1` are reserved for the login screen, splash wordmark, and empty-state headlines. In-app screens are data-dense: page titles use `H3`, section headers `H4`, and everything else the token scale below. Never render a 48–64px heading inside a working CRM screen.

- **In-App Component Tokens** (each maps to the responsive scale; use these names in component specs):

  | Token        | Maps To         | Size                 | Weight | Line-Height | Usage                                     |
  | ------------ | --------------- | -------------------- | ------ | ----------- | ----------------------------------------- |
  | `heading-xl` | H3              | 22–30px (responsive) | 600    | 1.3         | Page titles                               |
  | `heading-lg` | H4              | 20–24px (responsive) | 600    | 1.3         | Section headers                           |
  | `title-md`   | Body (semibold) | 16px                 | 600    | 24px        | Card titles, panel headers, button labels |
  | `body-md`    | Body            | 16px                 | 400    | 24px        | Default body text                         |
  | `body-sm`    | Small           | 14px                 | 400    | 20px        | Secondary descriptions, table cells       |
  | `label-xs`   | Caption         | 12px                 | 500    | 16px        | Badges, metadata tags, timestamps         |

### Component Radius Scale

Only the five radius tokens exist: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl: 20px`, `--radius-pill: 9999px`.

- **Buttons**: `8px` (`--radius-sm`)
- **Input Fields**: `8px` (`--radius-sm`)
- **Cards & Panels**: `12px` (`--radius-md`)
- **Modals & Sheets**: `16px` (`--radius-lg`; top corners only for bottom sheets)
- **Large feature surfaces** (Computation Viewer, broadcast overlay card): `20px` (`--radius-xl`)
- **Status Chips / Badges & FAB**: `9999px` (`--radius-pill`)
- **Avatars**: `50%` (circle)

### Spacing System

- **Base grid**: All spacing follows an **8px base unit** rhythm. No arbitrary or mid-point values.
- **Section/step scale by device** (padding between major blocks, card gaps, section margins):
  - **Mobile**: `8 12 16 24 32 48`
  - **Desktop**: `16 24 32 48 64 96`
- Component-internal spacing (chip padding, icon gaps) may use `4px` as the half-step of the base unit.

### Interaction & Motion Rules

- All interactive elements must show a clear hover state within `100–150ms`.
- No bounce or elastic animations. No decorative idle animations.
- Page transitions: simple `opacity 0→1` fade over `150ms`.
- Drawer/sheet slide: `translateY` or `translateX` over `200ms` with `cubic-bezier(0.4, 0, 0.2, 1)`.
- Sale confirmation: a subtle green success flash (not a full-screen confetti explosion).
- **Performance rule**: All animations must use **only `opacity` and `transform`** CSS properties. Never animate `height`, `width`, `top`, `left`, or `background-color` directly — these trigger layout reflows and cause jank on low-end Android devices.

### Splash Screen / App Preloader

To give the app a native, polished feel on launch (especially when installed as a PWA to the home screen), a **1.5-second splash screen** is shown on every cold start.

- **Display**: Full-screen background using the app's sidebar dark color (`#111827` — the same token as the Attio-signature dark sidebar). Centered app logo/wordmark fades in at `opacity 0 → 1` over `400ms`.
- **Progress indicator**: A thin **1px horizontal progress bar** at the bottom of the screen fills from left to right over the 1.5 seconds using a CSS linear animation. Color: primary brand teal (`#069494`).
- **Exit transition**: At 1.5 seconds, the splash screen fades out (`opacity 1 → 0` over `200ms`) and the Dashboard fades in simultaneously — no hard cut.
- **Skip condition**: If the user is returning (app was backgrounded, not fully closed), the splash screen is **skipped**. It only shows on full cold start or after session expiry login.
- **No heavy assets**: The splash must use only CSS + SVG/text logo. No GIF, no video, no Lottie — to keep launch time fast on low-end devices.

### Micro-Animation Guide

All animations are intentionally **subtle and functional** — they exist to give feedback and direction, not to decorate. Every animation must be performant on mid-to-low-end Android phones (e.g., devices with 2–3GB RAM).

| Trigger                               | Animation                                       | Duration | Easing                      |
| :------------------------------------ | :---------------------------------------------- | :------: | :-------------------------- |
| App cold start                        | Splash logo fade in                             | `400ms`  | `ease-out`                  |
| Page / tab switch                     | Fade `opacity 0→1`                              | `150ms`  | `ease-out`                  |
| Bottom sheet / drawer open            | Slide up `translateY(100%→0)`                   | `220ms`  | `cubic-bezier(0.4,0,0.2,1)` |
| Bottom sheet / drawer close           | Slide down `translateY(0→100%)`                 | `180ms`  | `ease-in`                   |
| Button tap / press                    | Scale down `scale(1→0.97)`                      |  `80ms`  | `ease-in-out`               |
| Card tap feedback                     | Background flash (opacity overlay)              | `100ms`  | `ease-out`                  |
| Toast banner appear                   | Slide down `translateY(-60px→0)` + fade         | `250ms`  | `ease-out`                  |
| Toast banner dismiss                  | Slide up `translateY(0→-60px)` + fade           | `180ms`  | `ease-in`                   |
| Badge counter update                  | Scale pulse `scale(1→1.3→1)`                    | `300ms`  | `ease-in-out`               |
| Lead card added to list               | Fade + slide in `translateY(8px→0)`             | `200ms`  | `ease-out`                  |
| Stage chip change                     | Cross-fade between colors                       | `200ms`  | `ease`                      |
| Success action (e.g., sale confirmed) | Subtle green border flash on the card           | `400ms`  | `ease-out`                  |
| Destructive action (e.g., archive)    | Card fades out `opacity 1→0` + collapses height | `250ms`  | `ease-in`                   |
| Modal/dialog open                     | Scale `scale(0.95→1)` + fade                    | `180ms`  | `ease-out`                  |
| Progress bar fill (Goal tracker)      | Animate `width` on mount only                   | `600ms`  | `ease-out`                  |

> **Low-end device note**: Animations longer than `300ms` should only be used on mount/unmount events. Avoid chaining multiple animations simultaneously. When possible, use `will-change: transform` on animated elements to hint the GPU — but remove it after the animation completes.

### Assistant Conversational UI Visual Standards

To deliver a premium, native-feeling "AI Assistant" without external latency or cost, the conversational view must adhere to these detailed design and interaction parameters:

1. **Glassmorphic Chat Bubble Canvas**:
   - **AI Messages**: Translucent cool white bubbles (`background: rgba(255, 255, 255, 0.72); backdrop-filter: blur(12px); border: 1px solid rgba(229, 231, 235, 0.6)`).
   - **User Messages**: Solid primary teal (`background: #069494; color: #FFFFFF`).
   - **Spacing**: Margins adhere strictly to the 8px grid (8px between bubbles, 16px lateral padding inside bubbles).

2. **Proactive Pulse Status Ring (Avatar)**:
   - The Tenacious AI avatar features a 2px outer glowing halo that pulses dynamically (`pulse` keyframe, scaling opacity and outline size over a 2s loop):
     - 🟢 **Teal Pulse (`rgba(6,148,148,0.6)`)**: Standard online/idle state.
     - 🔴 **Red Pulse (`rgba(220,38,38,0.6)`)**: Triggers automatically when high-priority expiries (unit reservations < 24h, CRFs < 3d) or unverified closed sales (Manager view) are active in the database.

3. **Typing Placeholder bubble**:
   - The placeholder is displayed during the `800ms–1200ms` thinking state: three inline dots (`● ● ●`) bouncing in sequence (`dots-bounce` keyframe, scaling dot transforms `scale(0.8) ➔ scale(1.2) ➔ scale(0.8)` with a consecutive `150ms` delay per dot).

4. **Smooth Viewport Scroll Anchoring**:
   - When the typewriter effect is rendering text character-by-character, the chat scroll container locks its scroll anchor to the bottom. It scrolls down dynamically using `scroll-behavior: smooth` to keep the actively generated line in the center-third of the screen, preventing the typing text from overflowing off the screen.

5. **Keyboard Commands Autocomplete Pop-up**:
   - Typing `/` or action words (like `call`, `note`, `move`) triggers a clean, high-density drop-up list above the mobile keyboard (solid white `#FFFFFF` card, 1px `#E5E7EB` borders). It provides instant, fuzzy-matched active client names to enable one-tap autocomplete, reducing mobile typing friction.

6. **Web Speech API Audio Feedback Visualizer**:
   - When speech recognition is active (microphone button clicked), the mic icon changes into a live soundwave visualizer: 3 vertical teal bars (`#069494`) scaling dynamically on the Y-axis via a fast CSS animation (`scaleY(0.4) ➔ scaleY(1.3) ➔ scaleY(0.4)`), giving immediate visual feedback that the device is recording input.

7. **Mobile-First Conversational UI Guidelines**:
   - **Full-Viewport Containment**: On mobile screens, the chat panel must take up the exact height of the remaining viewport space (excluding the sticky top header and the bottom navigation bar). The conversation threads scroll independently within this container, rather than scrolling the entire page body.
   - **Keyboard-Overlay Offset Security**: Web layouts must hook into the browser's `visualViewport` API or use passive focus listeners to dynamically reduce the container height when the mobile soft keyboard is raised. This locks the chat text input and suggestions carousel exactly on top of the keyboard, keeping them in view.
   - **Horizontal Swipe Suggestion Chips**: Quick-action prompts (e.g. _'My Agenda'_, _'Check Expirations'_) are placed in a single, horizontally scrollable row (`white-space: nowrap; overflow-x: auto; padding: 8px 16px`). This prevents suggestion buttons from stacking vertically on mobile viewports, saving valuable screen height.
   - **Thumb-Reachable Action Drawers**: Tapping any interactive button or card inside a chat bubble (like `[ ➕ Assign Lead ]` or `[ 🔄 Extend ]`) must slide up a standard mobile bottom sheet (`translateY` offset, top-rounded corners) instead of loading a new page or opening desktop-style centered popups, keeping all interactions within thumb reach.
   - **Touch Target Padding**: Every interactive element, including suggestion chips, inline widget buttons, voice input mic controls, and toggle tabs, must adhere to a strict minimum tap size of `44px × 44px` with at least `8px` of separation between adjacent click elements.

8. **Dynamic Inline AI Action Buttons**:
   - **Functional Construction**: The simulated AI constructs standard HTML `<button>` nodes dynamically inside message bubbles. These buttons are marked with datasets mapping to local actions: `data-action="[type]"` and `data-target="[id]"`.
   - **Global Event Delegation**: To avoid memory leaks, a single event listener is attached to the chat container. Click delegation intercepts taps, runs the mapped JavaScript controller, and updates the chat or CRM state immediately.
   - **Supported Button Categories & Actions**:
     - `[ 📞 Call {Client Name} ]`: Runs a local `tel:` window protocol and writes a Call Attempt log to the Lead's history.
     - `[ 💬 Message {Client Name} ]`: Opens the Facebook Messenger URL link in a new browser tab.
     - `[ 🔄 Request Extension ]` / `[ 🔄 Extend CRF ]`: Opens the modal for justification and applies the 30-day extension locally.
     - `[ 💳 Confirm Payment ]`: Confirms receipt of reservation payment, advancing the stage from Reserved to Documentation.
     - `[ ✅ Approve Reversion ]` / `[ ❌ Deny ]`: (Manager only) Instantly resolves agent reversion inbox requests.
     - `[ ✅ Approve Closed Sale ]` / `[ ❌ Reject ]`: (Manager only) Confirms or returns sales pending manager validation.
     - `[ 📢 Broadcast Message ]`: (Manager only) Directly broadcasts a typed prompt to all online agents.
     - `[ 📋 Copy Link ]`: Copies computations or CRF URLs instantly to the clipboard, displaying a toast confirmation: `📋 Copied to clipboard!`.
     - `[ 📥 Export PDF Report ]`: Triggers local browser PDF printing or triggers a mock export file download of the currently shown inline report widget table.
     - `[ 📋 Copy Report Data ]`: Copies the raw markdown database grid values of the shown report directly to the clipboard.
   - **Click State feedback**: To prevent double-clicks during CSS animations, clicked buttons scale down to `scale(0.97)` within `80ms` and transition their text dynamically (e.g. `[ 💳 Confirm Payment ]` ➔ `[ ⌛ Processing... ]` ➔ `[ ✓ Paid ]`).

9. **Clickable Entity Mentions (Inline Preview Popover)**:
   - **Purpose**: Whenever Tenacious AI mentions a **Lead/Client name** or a **specific Consultant (agent) name** in any chat response, briefing, or inline widget, that name is rendered as a tappable entity chip. Tapping it opens a lightweight **inline preview popover** with key details — the user never leaves the conversation to check who or what is being referenced. This runs **entirely client-side against the local reactive store — zero external API calls/credits** (consistent with the Simulated AI Engine).
   - **Entity Detection (Local, No API)**: After the AI composes a response, a local post-processor scans the rendered text and matches substrings against the in-memory `leads` and `consultants` collections (case-insensitive, trimmed, longest-match-first to avoid partial overlaps). Only names the current user is **authorized** to see are linked — a Property Consultant's chat never links another consultant's private client (respects the same visibility rules as the rest of the CRM). Unmatched or unauthorized names render as plain text.
   - **Functional Construction**: Each matched name is wrapped in a `<span>` chip carrying datasets: `data-entity="lead|agent"` and `data-id="[recordId]"`. Detection runs **after** the typewriter effect finishes rendering a message (not per-character) to avoid re-scanning partial text. Uses the same **Global Event Delegation** listener already attached to the chat container — no new per-chip listeners (prevents memory leaks).
   - **Visual Style (Entity Chip)**:
     - **Lead/Client mention**: subtle teal underline-dotted text with a tiny leading `👤` glyph, using the primary accent (`#069494`). On AI (glassmorphic) bubbles it reads as an inline link; it must remain legible on the translucent white bubble background.
     - **Agent/Consultant mention**: same treatment with a leading `🧑‍💼` glyph and the muted secondary text weight, so agents are visually distinguishable from clients at a glance.
     - Chips are inline (do not break the text flow) but honor a **minimum 44×44px effective tap area** via vertical padding and an expanded hit region, per the mobile touch-target standard.
   - **Inline Preview Popover Behavior**:
     - Tapping a chip opens a compact **glassmorphic popover card** anchored to the chip (`background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); 1px #E5E7EB border; 12px radius; Medium shadow --shadow-md`). It appears with a `scale(0.95→1)` + fade over `150ms` and dismisses on outside-tap, scroll, or a close `✕`.
     - **Smart Anchoring**: The popover opens **above** the chip by default; if there is insufficient space (chip near the top of the viewport), it flips to open **below**. It never renders off-screen horizontally — it clamps within the 16px lateral safe margin. On narrow phones it may present as a small bottom-anchored card instead of a floating bubble.
     - **Lead Preview Content**: Client name, current **Stage badge**, assigned consultant (if manager view), project, phone (masked per privacy rules), and the most urgent live indicator if any (e.g. `⏰ Res. Expires in 14:20` or `⚠️ CRF Expires in 2 days`). Footer holds thumb-reachable quick actions reusing the existing inline action buttons: `[ 📂 Open Lead ]`, `[ 📞 Call ]`, `[ 💬 Message ]`.
     - **Agent Preview Content**: Consultant name, avatar, Active Leads count, Closed Sales (count & value, compact notation), and **Last Login** (Manager-viewed only — hidden for consultant viewers per Last Login Visibility Rules). Footer action: `[ 📂 View Profile ]`; for Managers, also `[ 📊 View Their Leads ]`.
     - Only **one** popover is open at a time — opening a new chip closes any existing one.
   - **Fallback & Edge Cases**:
     - If the referenced record was deleted/archived after the message was generated, the popover shows a graceful state: _"This record is no longer available."_ with a single `[ Dismiss ]` action — never a broken link.
     - Ambiguous matches (two clients with the same name) resolve using the `data-id` captured at render time, so the correct record always opens regardless of later duplicates.
     - Chips remain fully functional in scrollback (older messages stay interactive) because detection is stored in the DOM, not recomputed on scroll.

### Number & Currency Formatting Standard

All monetary values displayed in the UI (dashboards, cards, leaderboards, reports, and goal trackers) must use **compact abbreviated notation** to keep the interface clean and readable on mobile screens.

| Raw Value   | Displayed As                               |
| :---------- | :----------------------------------------- |
| ₱18,500,000 | **₱18.5M**                                 |
| ₱4,000,000  | **₱4.0M**                                  |
| ₱600,000    | **₱600K**                                  |
| ₱75,000     | **₱75K**                                   |
| ₱1,250      | **₱1,250** (no abbreviation below ₱10,000) |

- **Rule**: Values ≥ ₱1,000,000 are shown in **M** (Millions, 1 decimal place). Values ≥ ₱10,000 and < ₱1,000,000 are shown in **K** (Thousands, rounded to nearest whole). Values below ₱10,000 are shown in full with comma separators.
- **Exception**: Full unabbreviated values are shown only inside the **Lead Detail Page** (sale price field), **Report export files (PDF/Excel)**, and **Closed Sale verification confirmation modals** — where precision matters.
- **Tooltip on hover/tap**: Tapping or hovering any abbreviated value on a card or dashboard shows a small tooltip with the full exact figure (e.g. tapping `₱18.5M` shows `₱18,500,000.00`).

## Responsive Layout & Desktop Design Specification

The app uses the **five canonical breakpoints** of the Responsive Design System. Every responsive rule in this document resolves to these — components must never invent their own:

| Device            | Viewport Width  | Container Max Width    | Grid       | Navigation                                       |
| :---------------- | :-------------- | :--------------------- | :--------- | :----------------------------------------------- |
| **Mobile**        | `< 640px`       | 100% (16–20px padding) | 4 columns  | Bottom tab bar + `(+)` FAB                       |
| **Tablet**        | `640 – 1023px`  | `720px`                | 8 columns  | Left sidebar (collapsed, icon-only, `64px` wide) |
| **Laptop**        | `1024 – 1279px` | `960px`                | 12 columns | Left sidebar (expanded, `240px` wide)            |
| **Desktop**       | `1280 – 1535px` | `1200px`               | 12 columns | Left sidebar (expanded, `240px` wide)            |
| **Large Desktop** | `≥ 1536px`      | `1280px`               | 12 columns | Left sidebar (expanded, `240px` wide)            |

- **CSS implementation**: Mobile styles are the base (mobile-first); larger devices layer on via `@media (min-width: 640px)`, `(min-width: 1024px)`, `(min-width: 1280px)`, and `(min-width: 1536px)`.
- **Container rule**: The content area is centered at the container max-width for the active breakpoint; the sidebar sits outside this measure. Exception: the Workflow board and data tables may extend to the full content area width (edge padding `24px`) since pipeline columns and wide tables need the room.
- In this document, **"desktop layout" collectively means Laptop and above (≥ 1024px)** — the expanded-sidebar, multi-column workspace. Where Laptop differs from Desktop/Large Desktop (e.g., number of visible board columns), it is called out explicitly.

> [!NOTE]
> **Navigation is app-shell navigation, not a website navbar.** This CRM never renders a marketing-style horizontal top navigation (Home / Properties / Blog / Contact). Navigation is always the role-based bottom tab bar (mobile) or the dark left sidebar (tablet and up) defined below. The top bar carries only the page title, global search, notifications, and the profile avatar.

### 1. Desktop Sidebar (replaces the bottom nav at ≥ 640px)

The persistent left sidebar is the Attio-signature element: background `#111827`, full viewport height, fixed position.

- **Width**: `240px` expanded (desktop default), `64px` collapsed (tablet default, icon-only with tooltips on hover). A collapse/expand toggle chevron sits at the sidebar's bottom edge; the user's choice is persisted in `localStorage`.
- **Structure, top to bottom**:
  1. **App wordmark** ("Tenacious" + logo mark, `heading-lg`, white) — `64px` tall header zone.
  2. **`[ ➕ Add Client ]` primary button** — full-width (208px) solid teal `#069494` button. This is the desktop home of the mobile `(+)` FAB. Clicking it opens the same role-specific **Quick Action Menu** as mobile, rendered as a dropdown panel anchored below the button (not a bottom sheet).
  3. **Navigation items** — one row per destination, `40px` tall, `8px` radius, icon + label. Text `#9CA3AF`; hover background `rgba(255,255,255,0.06)`; active item: background `rgba(255,255,255,0.08)`, text `#FFFFFF`, plus a `2px` teal `#069494` left edge indicator.
  4. **Spacer** (flex-grow).
  5. **User zone** (bottom): profile avatar + display name + role label (`label-xs`, `#6B7280`). Clicking opens the same dropdown as the mobile upper-right avatar (My Profile / Settings / Log Out).
- **Sidebar item order — Property Consultant**: Dashboard, My Leads, Workflow, Schedule, Assistant, Projects Computation, Leaderboard.
- **Sidebar item order — Manager**: Dashboard, All Leads, Workflow, Schedule, Team, Reports, Assistant, Projects Computation, Leaderboard. _(The mobile 5-slot limit does not apply — all overflow items become persistent sidebar entries; the `(+)` menu on desktop only carries action shortcuts: Add Client / CRF Link / Submit Attendance / Sellers Portal / Broadcast.)_
- **Badge counters**: The unread notification badge that sits on the mobile Assistant tab renders on the desktop Assistant sidebar item as a right-aligned red pill (Error `#DC2626` background, white `label-xs` count, `--radius-pill`).

### 2. Desktop Top Bar

A slim `56px` white top bar (1px `#E5E7EB` bottom hairline) spans the content area (not the sidebar):

- **Left**: Page title (`heading-xl`) — the single `<h1>` per page.
- **Center**: **Global search field** (`⌘K` / `Ctrl+K` shortcut hint shown inside), 320–480px wide. Focusing or pressing the shortcut opens the command palette: fuzzy search across leads, consultants, projects, and links with instant results (Linear influence — results render in the same frame).
- **Right**: Notification bell (opens a `380px` right-anchored dropdown panel listing the Notification Center feed) and the profile avatar dropdown. _(On desktop the avatar appears both here and in the sidebar user zone; both open the same menu.)_

### 3. Modal & Sheet Transformation Rules

| Component            | Mobile (< 640px)              | Tablet and up (≥ 640px)                                                                                                                                   |
| :------------------- | :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quick Action Menu    | Bottom sheet slide-up         | Dropdown panel anchored to sidebar `[ ➕ Add Client ]` button                                                                                             |
| Add/Edit Lead form   | Full-screen bottom sheet      | Centered modal, `560px` wide, `16px` radius, Medium shadow                                                                                                |
| Lead Detail          | Full page navigation          | **Slide-over panel** from the right, `640px` wide, over a scrim `rgba(0,0,0,0.32)` — the list stays visible behind it (Attio contextual-interaction rule) |
| Confirmation dialogs | Centered modal                | Centered modal, `440px` wide                                                                                                                              |
| Computation Viewer   | Full-screen bottom drawer     | Centered modal `880px` wide with side-by-side file preview + action column                                                                                |
| Toast banners        | Slide in from top, full-width | Slide in from **top-right corner**, `380px` wide, stacked with `8px` gaps                                                                                 |
| Broadcast overlay    | Full-screen                   | Full-screen (identical — it must block the entire viewport including the sidebar)                                                                         |
| Filter chips row     | Horizontal scroll             | Wraps to multiple lines; no horizontal scroll                                                                                                             |

Keyboard rules on desktop: `Esc` closes the topmost modal/panel; focus is trapped inside open modals; all interactive elements reachable via `Tab` with the standard `2px #069494` focus ring.

### 4. Per-Page Desktop Layouts

#### Dashboard (Desktop)

- **12-column grid**, `24px` gutters.
- Row 1 — **Summary cards**: 6 metric cards in a single row (2 columns each). Each card: white surface, `12px` radius, metric value in `heading-xl`, label in `label-xs`.
- Row 2 — **Priority Section** (span 7) beside **Workflow Overview** funnel (span 5). Priority items keep their urgency ordering and inline micro-action buttons.
- Row 3 — **Recent Activity** feed (span 7) beside **Quick Insights / Goal Progress** (span 5).
- Manager dashboard inserts the **Pending Actions Block** as a full-width row above Row 2, and the **Consultant Team Overview Table** as a full-width row below Row 3.
- The sticky mobile header is not used; the top bar carries the page title, and role quick-action buttons render as a button row under the top bar.

#### My Leads / All Leads (Desktop)

- Replaces mobile cards with a **data table** (Attio style): columns `Name` | `Phone` | `Stage badge` | `Project` | `Source` | `Date Added` | `Last Updated` | row-hover reveal of micro-actions (`📞 Call`, `Open`).
- Row height `48px`, 1px `#E5E7EB` row dividers, header row in `label-xs` uppercase `#6B7280`, sticky under the top bar.
- Search field, filter chips, and the Manager "Sort By" control sit in a toolbar row above the table.
- **Clicking a row opens the Lead Detail slide-over panel** (640px, right side) — never a page navigation. Inside the panel, lead fields render as Attio-style labeled attribute rows with inline editing; the activity timeline scrolls beneath them.
- Pagination stays infinite-scroll with the same skeleton-row loading pattern (3 skeleton table rows).

#### Workflow Board (Desktop)

- **All 5 stage columns are visible simultaneously at ≥ 1280px** (New Lead → CRF → Reserved → Documentation → Closed Sale), equal width, filling the content area. On Laptop (1024–1279px), 4 columns show with horizontal scroll for the fifth; columns never compress below `220px`.
- Column headers: stage name + count badge, sticky while the column scrolls vertically.
- Cards keep the Pipedrive anatomy (client name, consultant + stage age, urgency dot, amber rotting stripe). On hover, a card raises from Small to Medium shadow and reveals a `[ Open ]` micro-button.
- Clicking a card opens the same Lead Detail slide-over panel as the list view.
- Swipe gestures and pagination dots are mobile-only and must not render at ≥ 640px. Tablet shows 2–3 columns with horizontal scroll.
- The This Week / Monthly / All Time filter and the Manager's consultant filter dropdown sit in a toolbar row above the board.

#### Schedule (Desktop)

- **Calendar view is the desktop default** (List is default only on mobile). The Month/Week toggle, sub-tabs (My Appointments / Manning & Booth), and Manager's Filter-by-Agent dropdown sit in the toolbar row.
- Month grid uses the full content width; day cells show up to 3 event chips before a `+N more` link that opens the Day Detail as a right-anchored popover (not a below-calendar panel).
- Week view renders the 7-column × time-slot grid with events as positioned time blocks, using the established event-type colors.
- Clicking any event opens an event detail popover with Edit/Delete (Manager) or the read-only view + `[ ⚠️ Flag for Cancellation ]` (Consultant).

#### Assistant (Desktop)

- The Conversational (AI) and Console (Grid) modes become a **split view**: the Tenacious AI chat occupies a fixed `480px` right column; the Console panels fill the remaining left area as a **2-column masonry grid** of the role's accordion cards (6 for Consultants, 8 for Managers). The mobile segmented toggle is replaced by a `[ ⬒ Hide Console ]` control that expands the chat to a centered `720px` single column.
- Chat visuals (glassmorphic bubbles, typing dots, typewriter effect, entity chips, inline action buttons) are identical to mobile. Inline widget taps open centered modals or the Lead slide-over instead of bottom sheets.
- Suggestion chips wrap onto multiple lines instead of horizontal scrolling.

#### Reports (Manager, Desktop)

- The four report modules render as a **2×2 grid of report cards**, each with its own time filter; clicking `[ Expand ]` on a module opens it full-width with the chart above the table.
- Tables use the full data-table treatment; charts (MoM bars, Lead Source ROI) render side-by-side with their tables at ≥ 1024px.
- The `[ 📤 Smart Export ]` modal is centered, `640px` wide, with the preview pane beside the configuration options rather than below them.

#### Team Page (Manager, Desktop)

- Consultant list renders as a data table: `Avatar + Name` | `Status` | `Last Login` | `Active Leads` | `This Week's Activity` | `Closed Sales (count / value)` | actions column (`View Profile`, `View Leads`, `Reset Password`, `Deactivate`).
- `[ ➕ Add Consultant ]` is a solid teal button in the toolbar row.

#### Leaderboard (Desktop)

- Top 3 render as an elevated **podium row** (2nd | 1st | 3rd) of cards with avatar, value, and rank medal; ranks 4+ continue as a table beneath. Time filters in the toolbar row. Same teal-accented, non-gamified styling.

#### Projects & Computations Library (Desktop)

- Project cards render in a **3-column grid** (4 at ≥ 1536px). The Computation Viewer opens as the centered `880px` modal defined in the transformation table.

### 5. Desktop-Only Interaction Additions

- **Hover states everywhere**: every row, card, and button uses the standard hover treatment (`#F9FAFB → #F3F4F6` surface shift, `0.12s ease-out`). Touch-only affordances (long-press, swipe) must have a visible hover/click equivalent.
- **Tooltips**: abbreviated currency values, icon-only buttons, and collapsed-sidebar icons show a dark tooltip (`#111827` background, white `label-xs` text, `8px` radius) after a `400ms` hover delay.
- **Command palette** (`⌘K` / `Ctrl+K`) as defined in the Top Bar — this is the desktop-first power feature and must not appear on mobile.
- **Density**: desktop may show more metadata per row than mobile cards, but spacing still follows the 8px grid; never compress below `40px` row height.

> [!IMPORTANT]
> **No layout may exist in only one mode undefined in the others.** If a feature is specified for mobile, its tablet/desktop rendering follows this section's transformation rules; anything genuinely mobile-only (swipe gestures, bottom sheets, FAB) or desktop-only (command palette, hover tooltips, slide-over panels) is explicitly labeled as such here. Lovable and other AI builders must not invent additional breakpoints, navigation patterns, or accent colors.

## Lead Information

When adding a lead, the system should capture:

**Add Lead Form Fields** (kept minimal for speed):

- Full name
- Phone number (optional; input is normalized by the system before storing)
- Source of lead: Social Media, Walk-in, Flyers, Ads, Referral, Personal Network, Other (with optional description field)
- Project: dropdown list of target projects. Preloaded with **Allegra Garden Residences** (first) and **Sonora Garden Residences** (second). This dropdown list is dynamically populated based on active projects managed in the **Project Management Admin** panel.
- Unit type: Studio to 3BR, with the option to select multiple unit types
- Date: default to the current date when adding a new client, with the option to manually choose a date for older or existing clients

> Profile picture and Facebook profile are **not part of the Add Lead form**. They can be added later directly from the Lead Page to keep the client creation process fast and simple.

### Field Input Validation Rules (Supabase)

To ensure database integrity and clean reports, the system enforces the following input validation rules:

1. **Full Name**: Required field. Minimum 2 characters, maximum 100 characters. Letters, spaces, hyphens, and periods only.
2. **Phone Number**: Optional field. If entered, the system normalizes the input (removes spaces, hyphens, parentheses, and prefixes) and formats it to standard international format (e.g. `+63XXXXXXXXXX` for PH). Must contain exactly 10-15 digits after normalization.
3. **Facebook Profile Link**: Optional field. Must be a valid URL starting with `https://facebook.com/` or `https://www.facebook.com/`. Max 200 characters.
4. **Sale Price**: Required when the **Property Consultant** submits a lead for `Closed Sale` (Pending Verification). Numeric input only. Must be greater than zero. No letters, symbols, or currency formatting characters allowed in database storage.
5. **Notes / Justifications**: Maximum 1,000 characters per entry to prevent mobile app slowdowns.

## Contact Import

The system should support an optional contact import feature so agents can quickly add a lead from their phone contacts.

This feature should:

- allow the agent to select a contact from the device contact list
- auto-fill the lead name and phone number
- allow manual editing after import
- work as an optional shortcut, with manual entry still available if contact access is unavailable

## Duplicate Lead Prevention

To prevent multiple consultants from contacting the same client, the system must enforce strict uniqueness checks at the point of lead creation. Because phone number is optional and Facebook profile is only addable after creation, duplicate detection uses a **tiered fallback system** so every lead triggers at least one check:

- **Tier 1 — Phone Number Match** _(runs if phone is provided)_: A lead is flagged as a duplicate if the normalized phone number already exists in the system for any active or cancelled lead (soft-deleted leads in the Trash Bin are ignored). This is the strongest check.
  - **Phone Number Normalization**: Because phone numbers can be typed differently (e.g., `0917-123-4567`, `+63 917 123 4567`, or `639171234567`), the system must run all numbers through an E.164 normalization function before performing a check or saving (stripping all non-numeric characters, formatting with standard country codes, and translating local prefixes like `09` to `+63`). Only these fully normalized E.164 strings must be compared.
- **Tier 2 — Facebook Profile Link Match** _(runs if Facebook link is provided)_: A lead is flagged as a duplicate if the Facebook URL already exists in the system (soft-deleted leads in the Trash Bin are ignored).
  - **Facebook URL Parsing & Normalization**: Since Facebook profiles can have varied URL formats (e.g., `https://facebook.com/john.doe`, `https://m.facebook.com/john.doe?id=1000...`, or `facebook.com/profile.php?id=12345`), the system must use regular expressions to extract the core canonical username or profile ID. Only this extracted identifier must be stored and compared, preventing duplicate entries from bypassing the uniqueness check via variations in URL subdomain or parameter structures.
- **Tier 3 — Name + Project Match (Fallback — always runs)**: If neither phone nor Facebook is provided, the system checks for an existing lead with the **same full name** (case-insensitive, trimmed) assigned to the **same project target**. A match triggers a soft duplicate warning rather than a hard block, since names can legitimately repeat across different clients. The warning reads: _"A lead with this name and project already exists. Please verify this is a different client before proceeding."_ The consultant must explicitly confirm to proceed.
- **Creation Blocking (Tier 1 & 2)**: When a hard duplicate is detected (phone or Facebook match), the system blocks the action and displays: _"This client is already registered in the system. Please request lead sharing or transfer from your Manager."_
- **Privacy Protection**: The system must not reveal the name of the consultant who currently owns the duplicate lead to maintain privacy.

## Lead Page Design

The lead page should be fast, simple, and easy to use for 100+ clients.

### Recommended Layout

The page should be designed as a simple, mobile-first lead workspace with the following structure:

1. Top Section

- Search bar for lead name, phone number, project, source, status, or date
- Add New Lead button
- Quick filter chips for:
  - All
  - New Lead
  - CRF
  - Reserved
  - Documentation
  - Closed Sale
  - Cancelled
  - **Archived** (so consultants can search for and reactivate past cancelled/expired leads)

2. Lead List View
   Each lead row should show:

- Lead name
- Phone number
- Current status
- Project
- Date added
- A small status badge

3. Main Action Area
   Each lead row should have one main action:

- Open Lead

Optional secondary actions may include:

- Call
- Edit
- History

4. Lead Detail View
   When a lead is opened, the page should show:

- Lead name and contact information
- Current stage
- Key notes
- Status update buttons
- Quick action buttons such as:
  - **Stage Selector**: A dropdown or segmented control listing valid stages. **The options shown are role-gated**:
    - **Property Consultants**: The dropdown shows only the **current stage**, **forward stages**, and **Cancelled**. Backward stages are hidden entirely — they do not appear as disabled; they are absent from the list.
    - **Managers**: The dropdown shows all stages (including backward stages), enabling reversion after the agent has submitted a formal Stage Reversion Request and the manager has approved it.
    - Selecting a new stage triggers the double-confirmation modal and the required-field entry prompt before the transition is saved.

5. Activity and Notes Panel
   The detail view should also include:

- Activity history
- Notes
- Engagement actions
- Reservation details
- **Profile picture**: The agent can upload or update the client's profile picture directly from this panel.
- **Facebook profile link**: The agent can add or update the client's Facebook profile URL directly from this panel.

6. Mobile & Tablet Experience
   The lead page must be fully optimized for mobile and tablet use:

- **Large tap targets**: All action buttons must be at minimum 44×44px.
- **Simple cards** instead of dense tables for lead listings.
- **Sticky action buttons**: Key actions (e.g., Move to CRF, Reserve, Cancel) remain pinned to the bottom of the screen when scrolling.
- **Minimal clutter**: Only the most essential information is shown per card; additional details expand on tap.
- **One-column layout on phones**: Full-width stacked cards.
- **Two-column layout on tablets**: Lead list alongside the detail panel for faster navigation.
- **Desktop**: The list becomes a data table and the detail view opens as a right slide-over panel — see _Responsive Layout & Desktop Design Specification → My Leads / All Leads (Desktop)_.

### Recommended Flow

1. The user searches or filters leads
2. The user taps a lead card
3. The user sees the lead details and updates the status
4. The user adds notes or activity
5. The user returns quickly to the list

### Design Goal

The page should stay focused on:

- finding the lead fast
- seeing the current status clearly
- updating the workflow in one or two taps

## Workflow Page

The CRM must include a dedicated Workflow Page that displays leads as a **visual pipeline board**, organized by their current stage. This gives users a bird's-eye view of all leads at a glance without needing to search or filter.

### Layout

The page should display leads in vertical stage columns:

```
[ New Lead ] → [ CRF ] → [ Reserved ] → [ Documentation ] → [ Closed Sale ]
```

- Each column represents one workflow stage.
- Each lead appears as a **card** within its current stage column.
- Each card should show: Lead name, project, date added, and any urgent indicator (e.g., CRF expiry countdown, reservation timer).
- Tapping a card opens the full Lead Detail View.
- Cancelled and Archived leads are **hidden** from the workflow board by default but can be shown via a toggle filter.
- **Workflow Pipeline Filters**:
  - The pipeline board includes a filter toggle to view leads by creation date: **This Week (default)**, **Monthly**, or **All Time**.
  - Selecting **"This Week"** displays leads added during the current calendar week (Monday–Sunday). **"Monthly"** filters for the current calendar month. **"All Time"** displays all active records.
- **Stage Selection Rules**: When updating a lead's stage from the Lead Detail View or edit drawer, the stage options presented are **role-gated** — not a flat list of all stages:
  - **Property Consultants**: The dropdown shows only the current stage, forward stages, and Cancelled. No backward stage ever appears in the list — they are absent, not merely disabled.
  - **Managers**: The dropdown shows all stages, including backward stages, to enable approved reversions.
  - This is the UI enforcement point for the Forward-Only Progression rule. The constraint lives here, not just in documentation.

### Role Behavior

- **Property Consultant**: Sees only their own leads organized by stage.
- **Manager**: Sees all team leads by default, with a **filter dropdown** to view by a specific consultant's pipeline.

### Mobile & Tablet Design

- **On phones**: Each stage column is horizontally scrollable (swipe left/right to move between stages). Only one column is visible at a time.
- **On tablets**: Multiple stage columns are visible side-by-side, allowing a true Kanban board experience.
- **On desktop**: All 5 stage columns display simultaneously — see _Responsive Layout & Desktop Design Specification → Workflow Board (Desktop)_.
- Cards must use large tap targets and clear status badges for mobile readability.

### Interaction

- Leads can only have their stage updated by tapping the card and using the Lead Detail View actions. Drag-and-drop between columns is not required in the first version.
- Urgent cards (expiring CRF, expiring reservation) should be visually highlighted (e.g., red border or warning icon) on the board.

### Design Goal

The Workflow Page should answer one question instantly:

- _"Where is every lead right now in the pipeline?"_

## Dashboard Page

The CRM should include a dashboard page as the main overview screen.

### Recommended Layout

The dashboard should be designed as a simple, action-focused overview that helps the user quickly understand what needs attention today.

1. Top Header

- Welcome message or page title
- Date or current day view
- Role-specific actions/links:
  - **For Property Consultants**:
    - Add New Lead button
    - Quick Action Buttons: Add Client, Send CRF Link, View Schedule, Sellers Portal
  - **For Managers**:
    - Add & Assign Client button
    - Quick Action Buttons: Reassign Leads, Export Team Report, Sellers Portal

2. Summary Cards
   The dashboard should show a small set of the most important summary cards, tailored by role:

- **For Property Consultants**: Personal metrics (My Total Leads, My New Leads, My CRF, My Reserved, My Closed Sales, My Cancelled).
- **For Managers**: Aggregated team metrics (Team Total Leads, Team New Leads, Team CRF, Team Reserved, Team Closed Sales, Team Cancelled).

These should be easy to scan and should not feel crowded.

3. Priority Section
   This should be the most important section of the dashboard, highlighting items needing attention today:

- **For Property Consultants**: Leads assigned to them with expiring CRFs, near-expiry reservations, or no recent activity.
- **For Managers**: Unassigned leads, escalated issues, and team-wide urgent deadlines (e.g., high-value reservations expiring).
- **Sorting Logic (Urgency Hierarchy)**: Priority items must be displayed in a strict urgency order:
  1. Unit reservations expiring in `< 24 hours` (highest priority).
  2. CRFs expiring in `< 3 days`.
  3. Stagnant Leads (no activity for `> 7 days`).
  4. Leads awaiting documentation.

4. Workflow Overview
   The dashboard should include a simple visual overview of the workflow:

- New Lead
- CRF
- Reserved
- Documentation
- Closed Sale
- Cancelled

This should make it easy to see where leads are moving and where they are getting stuck.

5. Recent Activity
   To prevent mobile screen clutter, this dashboard feed must only display **high-importance milestone events** (e.g. Lead moved to CRF, Reservation made, CRF Expiry Warning, Sale Pending Verification, Sale Approved, Lead Cancelled). Minor activities (such as general notes logged or tripping schedules updated) should be hidden here and only visible on the specific lead's detail page timeline.

6. Quick Insights / Reports
   The dashboard should include role-specific quick insights:

- **For Property Consultants**: Personal lead source breakdown, personal weekly/monthly sales performance.
- **For Managers**: Team lead source breakdown, team weekly/monthly sales performance, and a consultant performance overview (ranking and activity summary per consultant).

7. Mobile & Tablet Design
   The dashboard must be fully usable on mobile and tablet screens as the primary devices:

- **One-column layout on phones**: Sections stack vertically in priority order (Pending Actions → Summary Cards → Priority Section → Workflow Overview → Recent Activity).
- **Two-column layout on tablets**: Summary cards and the priority section may display side-by-side.
- **Desktop**: 12-column grid layout — see _Responsive Layout & Desktop Design Specification → Dashboard (Desktop)_.
- **Large cards and clear spacing**: Each section card must be tap-friendly and easy to scan at a glance.
- **Sticky header**: The welcome message and quick action buttons remain visible while scrolling.
- **Minimal clutter**: Charts and analytics collapse into expandable sections on small screens to preserve space.

### Design Goal

The dashboard should help the user answer three questions quickly:

- What needs attention today?
- What is moving well?
- What is stuck?

### Manager Dashboard Focus & Details

When a user logs in with the **Manager** role, their dashboard should specifically highlight:

1. **Pending Actions Block** (Top Priority):
   - **Closed Sales Pending Verification**: Leads marked as "Closed Sale" by consultants that require Manager validation of contract/payment. Displays inline `[ ✅ Approve ]` and `[ ❌ Reject ]` toggles for instant verification.
   - **Escalated Expirations**: Unit reservations expiring in `< 4 hours` without updates.
   - **Overdue CRF Extensions**: Requests for a 2nd or 3rd CRF extension.

2. **Team Pipeline Health & Bottlenecks**:
   - **Stagnant Leads**: Leads with no logged activity for `> 7 days`.
   - **Document Collection Lag**: Leads in the Documentation stage for `> 15 days`.
   - **Unassigned Leads Pool**: Inquiries waiting to be distributed to agents.

3. **Consultant Team Overview Table**:
   - Displays a dynamic table: `Consultant Name` | `Active Leads Count` | `Trippings Logged (This Week)` | `Presentations Logged (This Week)` | `Closed Sales Count` | `Closed Sales Value` | `Last Login`.
   - The **Last Login** column shows the date and time the consultant last accessed the CRM, so the Manager can quickly identify who is actively using the system and who is not.
   - Allows the manager to quickly identify lead distribution vs. high-performing activity levels.

4. **Goal Progress Tracker**:
   - A visual progress bar comparing the team's combined closed sales value against a configurable monthly **Team Goal** (e.g. ₱18M closed of ₱20M goal).
   - **Setting the Team Goal**: The Manager sets or updates the team monthly revenue goal directly on this panel via an inline editable field. Changes take effect immediately for the current month.
   - **Setting Individual Consultant Targets**: Below the team goal, the Manager can set a **Personal Monthly Target** for each consultant — an editable ₱ value per consultant per month. This is the **canonical source of truth** for the `vs. Personal Target` column in the Sales Revenue report. If no individual target has been set for a consultant, the system falls back to displaying `Team Goal ÷ Number of Active Consultants` as a calculated default, clearly labeled as `(Auto)`.
   - **Lead Source ROI**: Breakdown of closed sales by lead source (Ads, Walk-in, Referrals) to guide marketing budgets.

## Notification Delivery System

Every notification in the CRM is delivered through **three signal layers** working together. This ensures no user ever misses a critical update — whether they are actively using the app, minimized it, or have their phone in their pocket.

### Layer 1: 🔴 Badge Counter on the Assistant Tab

The **`Assistant`** tab in the bottom navigation bar always shows a **red badge** with the count of unread notifications. This is always visible regardless of which screen the user is on — no navigation required to see that something is waiting.

```
[ Dashboard ]  [ My Leads ]  [ (+) ]  [ Workflow ]  [ Assistant 🔴3 ]
```

- The count increments for every new unread notification.
- The count decrements as the user reads notifications inside the Assistant page.
- If the count exceeds 9, it displays as **`9+`** to keep the badge compact.

### Layer 2: 📢 In-App Slide-In Toast Banner

When a new notification arrives **while the user is actively inside the app**, a compact banner slides in from the **top of the screen** and auto-dismisses after **4 seconds**.

```
┌─────────────────────────────────────────────────────┐
│  🔔  Maria Santos submitted a Closed Sale           │
│       Juan Cruz · Allegra Garden Residences          │
└─────────────────────────────────────────────────────┘
```

- The toast **does not block** the current screen — the user can continue working.
- Tapping the toast navigates directly to the relevant lead or approval screen.
- If multiple notifications arrive within 4 seconds of each other, they queue and display one after another.

### Layer 3: 📲 Browser Push Notification (PWA)

Since the system supports **PWA (Progressive Web App)** and can be installed to the home screen, it can fire an **OS-level push notification** even when the app is minimized or the screen is off.

- Appears in the phone's notification tray like any native app notification.
- Shows the same summary text as the toast banner.
- Tapping the push notification **deep-links** the user directly into the relevant screen (lead detail, reversion inbox, broadcast, etc.) without needing to navigate manually.
- Users are prompted to enable push notifications on first launch. If denied, Layers 1 and 2 remain active.

### Notification Priority Matrix

The table below defines which signal layers are triggered for each notification type:

| Trigger                                    | 🔴 Badge | 📢 Toast |             📲 Push             |
| :----------------------------------------- | :------: | :------: | :-----------------------------: |
| Sale pending verification                  |    ✅    |    ✅    |               ✅                |
| Reservation escalating < 4 hours           |    ✅    |    ✅    |               ✅                |
| Stage reversion request received (Manager) |    ✅    |    ✅    |               ✅                |
| Stage reversion approved / denied (Agent)  |    ✅    |    ✅    |               ✅                |
| CRF near expiry                            |    ✅    |    ✅    |               ✅                |
| CRF extension request (Manager)            |    ✅    |    ✅    |               ✅                |
| Lead auto-archived                         |    ✅    |    ✅    |               ✅                |
| New lead assigned to agent                 |    ✅    |    ✅    |               ✅                |
| Broadcast message from Manager             |    ✅    |    —     | ✅ _(then full-screen overlay)_ |
| New unassigned lead (Manager)              |    ✅    |    ✅    |                —                |
| Note added or general update               |    ✅    |    —     |                —                |

---

## Live Broadcast Message System

To distribute critical updates to the frontline team immediately, the CRM includes a **Live Full-Screen Broadcast** feature.

### 1. Manager Broadcasting Tool

- The Manager has a **"Broadcast Message"** composer located on their Dashboard and Assistant Page.
- The broadcast composer supports:
  - **Text message**: standard announcement text
  - **Image attachment**: upload a photo or screenshot
  - **Link**: share a URL or external resource
  - **File upload**: attach a document or media file
- The Manager types the message and optionally adds media content, then clicks **`[ 📢 Broadcast Live ]`**.
- **Real-Time Delivery & Fallback Synchronization**:
  - The broadcast is pushed in real-time to all active users via Supabase Realtime WebSocket channels.
  - **Connection Resiliency Fallback**: To handle cases where a consultant's mobile device is locked, the app is in the background, or the network drops during transmission, the system must not rely solely on WebSocket events. On app initialization, visibility changes (returning to the browser tab), or WebSocket reconnection, the client must query the database to fetch any active broadcasts that have not yet been acknowledged by the current user:
    `SELECT * FROM broadcasts WHERE id NOT IN (SELECT broadcast_id FROM broadcast_acknowledgments WHERE user_id = :current_user)`
  - If any unacknowledged broadcasts are returned, the client must immediately freeze the screen and display the full-screen overlay interruption.

### 2. Full-Screen Agent UI Interruption

- The moment a broadcast is pushed, any active consultant currently using the CRM has their screen immediately blocked by a **full-screen overlay**.
- The overlay uses the design system's alert styling: deep amber background (`#B45309` — the dark variant of the Warning token, used because white text on it passes WCAG contrast), bold white text, and a warning exclamation icon.
- The message is displayed in large centered text: _"📢 Message from Manager: [Message Content]"_
- If the broadcast includes media, the overlay displays the attached **image, link preview, or downloadable file** below the text message so consultants can view or access it immediately.
- **Mandatory Interruption**: All bottom navigation tabs, quick-action menus, and lead work pages are completely disabled. The consultant **cannot close the overlay or continue using the CRM** until they acknowledge.

### 3. Acknowledgment Flow

- The overlay displays a single dominant **primary teal `[ 👍 I Acknowledge ]`** button (styled to the system's primary accent `#069494`).
- Tapping the button logs their username and timestamp into the broadcast's read list, closes the overlay, and restores full CRM access.

### 4. Manager Read-Receipt Tracking

- On the Manager's Assistant page under Notifications, a **"Broadcast History"** link displays a modal showing sent messages.
- Tapping a sent message shows a dynamic checklist: `Consultant Name` | `Acknowledged (Yes/No)` | `Timestamp`.
- The history view should also preserve the broadcast content, including text, image preview, link, or attached file metadata.
- This lets the Manager see exactly who has read the broadcast and who is still inactive or ignoring updates.

## Team Page

This page is accessible only by the **Manager**. It provides a full team view of all Property Consultants on the team.

### Layout

Each consultant is shown as a card or row in a list containing:

- **Profile picture** and name
- **Status**: Active or Inactive (deactivated)
- **Last Login**: Exact date and time the consultant last logged into the CRM (e.g., `Today, 9:42 AM` or `3 days ago`). This helps the Manager quickly identify who is actively using the system.
- **Active Leads Count**: How many leads are currently assigned to them.
- **This Week's Activity**: Trippings logged, presentations logged.
- **Total Closed Sales**: Count and value.

### Manager Actions from This Page

- **View Profile**: Open the consultant's full profile.
- **View Their Leads**: Jump directly to a filtered All Leads view for that consultant.
- **Deactivate / Reactivate**: Toggle the consultant's account status.
- **Reset Password**: Trigger a password reset for the consultant if they are locked out.

### Last Login Visibility Rules

- **Managers** can see the last login date/time for all consultants.
- **Property Consultants** cannot see other consultants' last login information.
- If a consultant has **never logged in**, the field should display `Never logged in` as a clear indicator for the Manager.

## Manager Assistant Page

This is a dedicated page accessible only by the **Manager**. It operates in two modes toggled at the top: **Console (Grid) Mode** and **Conversational (AI) Mode**.

### Conversational (AI) Mode Specifications

In Conversational Mode, the page renders a high-fidelity chat companion interface ("Tenacious AI"). It parses user inputs locally using client-side JavaScript rules and returns natural summaries combined with fully interactive CRM data widgets. **Any Lead/Client or Consultant name the AI mentions is rendered as a tappable entity chip that opens an inline preview popover** (see _Assistant Conversational UI Visual Standards → Clickable Entity Mentions_), so the Manager can inspect who or what is referenced without leaving the chat:

- **Morning Briefing (Auto-Run)**: On load, Tenacious AI scans the team status and prints: _"Good morning, Manager [Name]! Today the team has [X] closed sales pending verification, [Y] idle consultants, and [Z] active reversion requests. The monthly team goal is at [P]% pace. What would you like to review?"_
- **Speech Controls**: A microphone button toggles browser-native Speech-to-Text input. A speaker icon allows the user to listen to the AI's textual analysis read aloud via native browser SpeechSynthesis (100% free, runs locally).
- **Dynamic Charting Widgets**: If the user asks for goal pace or lead source metrics, the assistant embeds a clean, animated HTML5 SVG pie or line chart inline in the chat bubble.
- **Natural Language Commands**:
  - Command: `"broadcast [message]"` ➔ Parses the text and immediately triggers the **Live Broadcast Message System**, pushing the full-screen warning overlay to all active consultants.
  - Command: `"todo [text]"` ➔ Logs a quick task item into the Manager's personal agenda checklist and returns confirmation.
  - Keyword inputs map directly to database widgets, reports, and schedulers:
    - Keywords `idle`, `team guard`, `consultants` ➔ Embeds the **Team Guard** list with direct action buttons to ping or reassign.
    - Keywords `bottleneck`, `documentation`, `lag` ➔ Embeds the **Bottleneck Alert** list.
    - Keywords `goal`, `pace`, `projection` ➔ Embeds the **Goal Pace Calculator** widget.
    - Keywords `reversion`, `request`, `inbox` ➔ Embeds the **Stage Reversion Request Inbox** with inline Approve/Deny actions.
    - Keywords `projects`, `calculations` ➔ Embeds the **Project Management Admin** panel.
    - Keywords `links`, `library` ➔ Embeds the **Links Library Admin** panel.
    - Keywords `report`, `weekly summary`, `performance` ➔ Generates and embeds the **Consolidated Team Activity Report** widget (a dynamic high-density grid displaying `Consultant Name` | `Active Leads` | `Trippings Logged (This Week)` | `Presentations Logged` | `Closed Sales Count & Value` | `Last Login`). Includes inline action buttons: `[ 📥 Export PDF Report ]` and `[ 📋 Copy Report Data ]`.
    - Keywords `rank`, `leaderboard` ➔ Displays the complete team leaderboard ranking and individual consultant sales metrics.
    - Keywords `shift`, `manning`, `booth` ➔ Embeds the public Manning & Booth Duty shift scheduler (listing which consultants are assigned to showroom duties and mall exhibits this week).

### Console (Grid) Mode Specifications

In Console Mode, the page is divided into 8 key panels:

### 1. 🚨 Team Guard (Idle Agent Detector)

- **Rule**: If any active Property Consultant has not logged into the system for **more than 3 consecutive days (72 hours)**, they are flagged here.
- **Display**: Lists flagged agents with:
  - Consultant name
  - Last login date and time
  - Number of active leads currently assigned to them (highlighting leads that may be neglected)
- **Manager Actions**:
  - Tapping a button next to the agent triggers a manual system reminder.
  - Quick action to open lead reassignment to distribute their active leads to active agents.

### 2. ⏱️ Bottleneck Alert (Documentation Stagnation)

- **Rule**: Flags any lead that has remained in the **Documentation stage for more than 20 consecutive days**.
- **Display**: List of stagnant leads showing:
  - Lead name and current agent assigned
  - Precise number of days spent in the Documentation stage (e.g., `24 Days`)
  - The date of the last note or status change
- **Manager Actions**:
  - Tap to directly view the lead details and history.
  - Option to send an urgent ping/reminder to the assigned agent's notification bell.

### 3. 📊 Goal Pace Calculator

- **Rule**: Projects the final monthly team sales value based on current day performance pace vs target.
- **Display**: Shows:
  - **Current Pace**: Based on the number of verified closed sales and their value so far this month vs. the number of working days elapsed (e.g., `14 days done, ₱8.4M closed = ₱600K/day pace`).
  - **Projected Monthly Close**: Extrapolates the current daily pace to the end of the month (e.g., `Projected total: ₱18.0M by month-end`).
  - **Goal Gap**: Shows the difference between the projection and the configurable team monthly goal (e.g., `Projected to hit 120% of ₱20.0M goal ✅` or `Still needs ₱2.0M to hit goal pace ⚠️`).
  - **Pending Buffer**: Shows sales currently in Pending Verification that, if approved, would push the team closer to or past the goal.

### 4. 🔔 Notification Center

- **Rule**: Displays transactional updates and activity changes.
- **Display**: A list of recent notifications showing the alert message and timestamp (e.g., `10 minutes ago`). Unread updates are highlighted with a blue dot. Tapping a notification marks it as read and redirects the manager to the relevant screen (e.g. Lead details or Reports).
- **Manager Notification Triggers**:
  - **Closed Sale Pending Verification**: _"[Consultant Name] has submitted a sale for [Client Name]. Pending your verification."_
  - **Reservation Escalation (< 4 hours)**: _"[Client Name]'s reservation (owned by [Consultant Name]) expires in under 4 hours with no update."_
  - **CRF Extension Request (2nd+)**: _"[Consultant Name] is requesting a CRF extension for [Client Name]. Approval required."_
  - **Lead Auto-Archived**: _"[Client Name] (owned by [Consultant Name]) has been automatically archived."_
  - **New Unassigned Lead**: _"A new unassigned lead has arrived. Assign it from the All Leads section."_
  - **Stage Reversion Requested**: _"[Consultant Name] is requesting a stage reversion for [Client Name] from [Current Stage] to [Target Stage]. Review in your Reversion Inbox."_

### 5. 🔗 Links Library (Manager Admin)

- **Purpose**: A centralized repository where the Manager can store and organize all team-shared links — marketing materials, property brochures, promotional collateral, news articles, update announcements, and external tools. This completely eliminates the need to manually forward links through chats or emails.
- **CRF links are excluded** from this library. Each consultant's personal CRF link is handled separately in their profile.
- **Manager Controls (Full CRUD)**:
  - **Add Link**: A form with three required fields:
    - **Label** (text): Short descriptive name, e.g., _"The Vine Residences – Unit Brochure"_
    - **Category** (dropdown): `Marketing`, `News`, `Promos`, `Updates`, `Forms`, `Tools`, or `Other`
    - **URL** (text): The full link. Must pass a basic URL format validation before saving.
  - **Edit Link**: Tap the edit icon next to any saved link to modify its Label, Category, or URL.
  - **Delete Link**: Tap the delete icon. A confirmation prompt appears before permanent deletion.
- **Display Layout**:
  - Links are grouped by **Category** using collapsible accordion sections (e.g., all `Marketing` links under one expandable header).
  - Within each category, links are listed alphabetically by Label.
  - Each link row shows: **Label** | **Category Badge** | **[ 🔗 Open ]** button (opens in new tab) | **[ 📋 Copy ]** button (copies URL to clipboard) | **Edit icon** | **Delete icon**.
- **Search**: A search bar at the top of the panel filters links in real-time across all categories by Label or URL keyword.
- **State**: All saved links are shared team-wide. Any link added by the Manager is immediately visible to all active Property Consultants in their own Assistant page.

### 6. 🏗️ Project Management Admin

- **Purpose**: A panel where the Manager manages the target projects list (e.g. adding new project targets, deactivating old ones, or editing names) and uploads the corresponding sample computations.
- **Manager Controls (Full CRUD)**:
  - **Add Project**: A form containing:
    - **Project Name** (text): Unique name, e.g. _"Allegra Garden Residences"_.
    - **Sample Computation File**: File uploader simulating document upload (accepts mock PDF, PNG, JPG, or spreadsheets up to 10MB).
  - **Edit Project**: Edit the project name or replace the current Sample Computation file.
  - **Delete/Deactivate Project**: Remove the project target. A warning prompt warns if active leads are currently target-linked to this project before confirmation.
- **Dynamic Propagation**: Adding, modifying, or removing a project immediately updates the drop-down listings in the `Add Lead` form, lead detail edit panel, and Reports filtering controls.
- **State**: Project changes and computations are immediately pushed to all consultants' instances.

### 7. 📥 Stage Reversion Request Inbox

- **Purpose**: A formal in-app channel for Property Consultants to request a stage rollback from the Manager without resorting to external messaging. This replaces informal chat requests and creates a traceable approval log.
- **Agent-Facing Request Flow** (from Lead Detail Page):
  - After the 10-minute Undo Grace Period expires, the consultant's Lead Page shows a **`[ 📥 Request Stage Reversion ]`** button.
  - Tapping it opens a short form: selecting the **Target Stage** (must be a previous stage) and entering a **Reason** (required, minimum 10 characters).
  - Submitting adds the request to the Manager's inbox and fires a notification.
- **Manager Inbox Display**:
  - Each request row shows: `Lead Name` | `Agent Name` | `Current Stage` | `Requested Stage` | `Agent's Reason` | `Time Requested`.
  - Sorted by most recent request first.
  - Two action buttons per row: **`[ ✅ Approve Reversion ]`** (executes the backward transition with Manager authority and logs both reason and approver) | **`[ ❌ Deny ]`** (closes the request and sends a denial notification to the agent).
- **Notification to Agent**:
  - On Approval: _"Your stage reversion request for [Client Name] has been approved. Lead is now in [Target Stage]."_
  - On Denial: _"Your stage reversion request for [Client Name] was denied by the Manager."_

### 8. ⭐ Monthly Top Performer Spotlight

- **Rule**: Activates automatically during the **last 5 calendar days of each month** (e.g., July 27–31). Outside this window, this panel is hidden.
- **Purpose**: A practical coaching reminder for the Manager to identify, support, and prioritize the top-performing consultant as the month ends — to help close any pending verifications before the cutoff date.
- **Display**:
  - Shows a highlighted card for the current **#1 ranked consultant** by verified closed sales value for the current month.
  - Card shows: **Consultant name**, **Avatar**, **Closed Sales Count**, **Total Verified ₱ Value**, **Pending Verification Buffer (₱ and count)**, and **Days Remaining in Month**.
  - Below the spotlight, a compact mini-leaderboard shows the **Top 3 consultants** for context.
  - A quick action button: **`[ 📋 View Their Leads ]`** — jumps to a filtered All Leads view for that consultant to review their pending submissions.

## Property Consultant Assistant Page

This is a dedicated page accessible only by the active **Property Consultant**. It operates in two modes toggled at the top: **Console (Grid) Mode** and **Conversational (AI) Mode**.

### Conversational (AI) Mode Specifications

In Conversational Mode, the page renders the **Tenacious AI** chat companion. The assistant analyzes the agent's personal workspace locally and provides text briefings combined with interactive lead cards and actions. **Any Client name the AI mentions is rendered as a tappable entity chip that opens an inline preview popover** (see _Assistant Conversational UI Visual Standards → Clickable Entity Mentions_) showing that lead's stage and urgent indicators — only the consultant's own authorized leads are linked, never another agent's private clients:

- **Morning Briefing (Auto-Run)**: On load, Tenacious AI prints: _"Good morning, [Name]! Today you have [X] trippings scheduled, [Y] expiring reservations, and [Z] stagnant leads. You are at [P]% of your monthly sales target. Let's get to work!"_
- **Speech Controls**: Features browser-native Speech-to-Text input (microphone button) and SpeechSynthesis read-aloud support (speaker icon), operating completely client-side for hands-free utility.
- **Natural Language Commands**:
  - Command: `"call [client name]"` ➔ Searches the local database for the client, triggers the browser's dialer (`tel:` protocol), and logs the activity in the Lead's Audit Trail.
  - Command: `"add note to [client name]: [text]"` ➔ Searches the database for the client name, appends the text as a timestamped note, and prints a success notification.
  - Command: `"move [client name] to [stage]"` ➔ Triggers the double-confirmation modal inline and prompts for any required fields before committing the stage transition.
  - Command: `"todo [text]"` ➔ Logs a quick task item into their personal **Daily Agenda Planner** checklist and displays visual confirmation.
  - Keyword inputs map directly to database widgets, reports, and schedulers:
    - Keywords `agenda`, `today`, `schedule` ➔ Embeds the **Daily Agenda Planner** list.
    - Keywords `expir`, `warning`, `deadline` ➔ Embeds the **Expiry Warnings** card with inline action buttons to request extensions or confirm payment.
    - Keywords `stagnant`, `inactive` ➔ Embeds the **Stagnant Lead Reminders** card with inline Call and Note buttons.
    - Keywords `goal`, `target`, `progress` ➔ Embeds the **Personal Goal Tracker** card with the personal progress bar and pacing projections.
    - Keywords `notifications` ➔ Embeds the **Notification Center** feed.
    - Keywords `links`, `resources` ➔ Embeds the **Links Library** (read-only accordion).
    - Keywords `report`, `weekly report`, `my activity` ➔ Generates and embeds the **Personal Activity Report** widget (a dynamic high-density grid summarizing their logged trippings, presentations, active leads, and goal metrics). Includes inline action buttons: `[ 📥 Export PDF Report ]` and `[ 📋 Copy Report Data ]`.
    - Keywords `rank`, `leaderboard`, `position` ➔ Executes the **Leaderboard Position Tracker** (prints current sales rank e.g., _"You are ranked #4 of 12 agents, trailing the leader by ₱1.5M. Keep pushing!"_ and embeds a mini-leaderboard card of top 3 agents).
    - Keywords `shift`, `manning`, `booth` ➔ Executes the **Manning & Booth Duty Shift Checker** (queries their assigned duty roster shifts, showing location, date, and hours).

### Console (Grid) Mode Specifications

In Console Mode, the page is divided into 6 key panels:

### 1. 📅 Daily Agenda Planner

- **Rule**: Summarizes all scheduled trippings, online presentations, or actual presentations set for the current day.
- **Display**: A chronological list of today's appointments, showing:
  - Time and type of appointment
  - Client/Lead name
  - Direct quick-action button to open the client's record to log details or notes
- **Visual Alert**: If an appointment time has passed without notes being logged, the entry turns yellow with a prompt: _"Logging required: How did the session go?"_

### 2. ⏳ Expiry Warnings (Critical Actions)

- **Rule**: Flags their assigned leads with active countdowns or validity periods nearing deadline limits:
  - **Unit Reservations** expiring in **less than 24 hours**.
  - **CRF forms** expiring in **less than 3 days**.
- **Display**: Lists threatened leads with the exact remaining time (e.g., `CRF expires in 2d 4h` or `Reservation expires in 3h 15m`).
- **Consultant Actions**:
  - For reservations: Tapping opens the option to request/log a paid status or request extension.
  - For CRFs: Single-tap to apply the consultant's one-time 30-day extension, requiring the mandatory explanation.

### 3. 💤 Stagnant Lead Reminders

- **Rule**: Identifies leads assigned to the consultant that have had **no logged activity or notes for more than 7 consecutive days**.
- **Display**: Lists stagnant leads showing:
  - Lead name and current stage
  - Number of days inactive (e.g., `8 days since last contact`)
- **Consultant Actions**:
  - Quick action buttons to immediately call the client or add a note to restart engagement and remove them from this alert panel.

### 4. 🎯 Personal Goal Tracker

- **Rule**: A rule-based progress visual comparing verified closed sales against the consultant's individual monthly target (e.g., ₱5.0M).
- **Display**:
  - **Progress Bar**: Shows personal closed sales value versus target.
  - **Pacing projection**: Calculates if they are on track based on the current day of the month.
  - **Pending Buffer**: Highlights sales in the "Pending Verification" stage, showing how close they are to meeting their goal once approved by the Manager.

### 5. 🔔 Notification Center

- **Rule**: Displays transactional updates and status changes.
- **Display**: A list of recent notifications with timestamps. Unread notifications have a blue indicator. Tapping an alert marks it as read and takes the agent to the specific lead or schedule workspace.
- **Property Consultant Notification Triggers**:
  - **CRF Near Expiry**: _"[Client Name]'s CRF expires in 3 days. Consider extending or following up."_
  - **Reservation Near Expiry**: _"[Client Name]'s reservation expires in 24 hours. Act now."_
  - **Lead Nearing Archiving**: _"[Client Name] will be archived in 5 days. Follow up to keep them active."_
  - **Closed Sale Approved**: _"Your sale for [Client Name] has been verified and is now Closed."_
  - **Closed Sale Rejected**: _"Your sale for [Client Name] was returned for review. Check notes."_
  - **New Assignment**: _"A new lead, [Client Name], has been assigned to you."_
  - **Ownership Transferred Away**: _"[Client Name] has been transferred to another consultant."_
  - **Shared Access Granted**: _"You have been given access to [Client Name]'s lead record."_
  - **Schedule Added**: _"A new appointment has been added to your schedule: [Type] on [Date]."_
  - **Schedule Updated**: _"Your appointment for [Client Name] on [Date] has been updated."_
  - **Schedule Reminder**: _"Reminder: [Appointment Type] with [Client Name] is coming up at [Time]."_
  - **CRF Auto-Cancelled**: _"[Client Name]'s CRF has expired and the lead has been automatically cancelled."_

### 6. 🔗 Links Library (Read-Only Access)

- **Purpose**: Gives Property Consultants instant access to all team-shared resources curated by the Manager — without needing to ask for a link in a group chat or dig through old messages.
- **Display Layout**:
  - Identical accordion structure to the Manager's panel, grouped by Category (e.g., `Marketing`, `News`, `Promos`, `Updates`, `Forms`, `Tools`, `Other`).
  - Each link row shows: **Label** | **Category Badge** | **[ 🔗 Open ]** button (opens in new tab) | **[ 📋 Copy ]** button (copies URL to clipboard).
  - **No Add, Edit, or Delete controls** are shown to consultants — this is strictly read-only.
- **Search**: A search bar filters links in real-time by Label or URL keyword.
- **Empty State**: If no links have been added by the Manager yet, display a friendly empty state graphic with the message: _"No resources yet. Check back soon!"_

## Activity History / Audit Trail

Every action taken on a lead should be recorded clearly and completely.

This includes:

- every stage change
- every engagement activity such as tripping, online presentation, and actual presentation
- every reservation update (including extensions)
- every documentation update
- every sale completion
- every cancellation action
- every administrative action, including lead assignment, transfer of ownership between consultants, or access sharing by the manager (e.g. logging: "Lead ownership transferred from [Consultant A] to [Consultant B] by Manager [Manager Name]")
- **Activity & Sale Attribution on Ownership Transfer**: If a lead is transferred from Consultant A to Consultant B, all recorded historical engagement activities (such as trippings and presentations) remain credited in reports to the consultant who actually performed them (attributed via an immutable `performed_by_user_id` field). To prevent sales poaching friction, when the lead is closed, the Manager's Closed Sale verification panel includes a **Split-Credit Attribution selector** (allowing the Manager to allocate leaderboard and revenue metrics between the qualifying consultant A and closing consultant B, e.g., 50/50 or 100% to either).
- notes or remarks added by the user

Each record should show:

- what happened
- when it happened
- who performed it
- the current stage of the lead

This will make the workflow easy to follow, fully traceable, and flawless for every lead.

## History Page

Each lead should have a dedicated history page that shows the full activity timeline of that lead.

This page should be accessible when needed, but it should be hidden from the main navigation so the main interface stays simple.

## Reports

### Who Can Generate Reports

- **Property Consultants**: Can generate and export reports for their own activity only (their leads, trippings, presentations, and sales).
- **Managers**: Can generate, filter, and export consolidated reports for any individual consultant or the entire team.

### Report Content & Time Filters

All reports support the following time range filters:

- **This Week**: The current calendar week — Monday 00:00 to Sunday 23:59 in the configured company timezone. Does **not** include the previous week.
- **Monthly**: Any specific calendar month, selected via a month picker.
- **All Time**: Complete historical data since account creation.

### Consultant Report History After Leaving the Team

- **Active Consultants**: Can access their own report history at any time, covering all past activity.
- **Deactivated Consultants**: Once a consultant account is deactivated by the Manager, the consultant **loses access** to the CRM immediately, including their report history. They can no longer log in or view any data.
- If a departing consultant needs a copy of their report history, the **Manager must export and share it with them manually** before deactivation.

### Deactivated Consultant Data in Team Reports

- When a consultant is deactivated, their **historical data is preserved** and continues to appear in the Manager's team reports.
- The deactivated consultant's name will be clearly tagged (e.g., `[Inactive] Juan Cruz`) in all team report views so the Manager knows the consultant is no longer active.
- Their past activity (trippings, sales, leads) remains fully traceable in the Audit Trail and is never deleted upon deactivation.
- Their leads are moved to the **Unassigned Leads Pool** for the Manager to redistribute.

### Report Export & Sharing

- **Smart Export Panel**: Both Managers and Property Consultants have access to a custom export configuration modal triggered by a `[ 📤 Smart Export ]` button.
  - **Manager Scope**: Can customize and bundle any combination of the four reports, filter by custom date ranges or individual/multiple agents, and choose output type.
  - **Property Consultant Scope**: Read-only access to their own data only. Can configure a personal summary export (e.g., selecting date ranges for their personal sales and activity reports).
  - **Supported Formats**:
    - **PDF**: Format-clean, print-ready layout containing "Team Tenacious" headers, date range, and optional graphical charts.
    - **Excel/CSV**: Multi-sheet workbook where each selected report populates a dedicated tab.
    - **Copy Summary**: A text-based, condensed summary ready for clipboard copying and direct messaging.
  - **Preview Window**: A dynamic text preview displays in the modal summarizing the selected bundle content before final download.

---

## Manager Reports Page

The Reports page is a **Manager-only dedicated screen** accessible from the navigation bar. It is divided into four distinct report modules. Each module has its own time filter (Weekly / Monthly / All Time) applied independently, and every module supports **PDF export**, **Excel/CSV export**, and a **Copy Summary** action.

---

### Report 1: 💰 Sales Revenue Summary

**Purpose**: Shows total verified closed sales revenue in ₱, broken down by consultant and time period.

**Metrics Displayed**:

- **Team Total Revenue** for the selected period (large headline number, e.g., `₱24,500,000`).
- **Per-Consultant Revenue Table**:

  | Consultant           | Closed Sales (Count) | Total Value (₱) | Avg. Sale Value (₱) | vs. Personal Target |
  | -------------------- | -------------------- | --------------- | ------------------- | ------------------- |
  | Maria Santos         | 3                    | ₱12,000,000     | ₱4,000,000          | 120% ✅             |
  | Juan Cruz            | 1                    | ₱3,800,000      | ₱3,800,000          | 38% 🔴              |
  | [Inactive] Ana Reyes | 2                    | ₱8,700,000      | ₱4,350,000          | —                   |

- **Team Goal Attainment**: A progress indicator showing team total vs. the configured monthly team revenue target (e.g., `₱24.5M of ₱30M goal — 81.7%`).
- **Only verified (Manager-approved) closed sales** are counted. Pending verification sales are shown separately as a **"Pending" buffer** row at the bottom of the table.
- **`vs. Personal Target` column**: Each consultant's closed sales value is compared against their individual Personal Monthly Target set by the Manager in the Goal Progress Tracker panel. If no personal target has been set, the column shows the auto-calculated fallback (`Team Goal ÷ Active Consultants`, labeled `(Auto)`). Deactivated consultants always show `—` in this column.

**Filters**: Time period (Weekly / Monthly / All Time). Monthly filter shows a month picker.

---

### Report 2: 📈 Month-over-Month (MoM) Trend View

**Purpose**: Shows how team and individual performance is trending across the last 3–6 months — not just the current period.

**Metrics Displayed**:

- **Team Revenue Bar Chart**: A horizontal or vertical bar chart showing total team closed sales ₱ value for each of the last 6 calendar months. Each bar is labeled with the month name and exact value (e.g., `Jan: ₱8.0M`, `Feb: ₱12.0M`, `Mar: ₱6.5M`).
- **Per-Consultant Trend Table**: A table showing each consultant's closed sales count and revenue for each of the last 3 months, side by side:

  | Consultant   | 2 Months Ago | Last Month | This Month   |
  | ------------ | ------------ | ---------- | ------------ |
  | Maria Santos | 1 / ₱4.0M    | 2 / ₱8.5M  | 3 / ₱12.0M ↑ |
  | Juan Cruz    | 2 / ₱7.2M    | 1 / ₱3.8M  | 0 / ₱0 ↓     |

- **Trend Indicator**: An up arrow (↑ green) or down arrow (↓ red) next to each consultant's current month vs. prior month.
- **Team Activity Trend**: Below the revenue chart, a secondary line chart or table showing team-wide total trippings, presentations, and CRF submissions by month — so the Manager can correlate activity levels with revenue outcomes.

**Filters**: Toggle between 3-month view and 6-month view.

---

### Report 3: 🎯 Lead Source ROI Report

**Purpose**: Tells the Manager which lead sources are producing the most value, so they know where to focus marketing effort and budget.

**Metrics Displayed**:

- A table or card-grid showing each lead source (Social Media, Walk-in, Flyers, Ads, Referral, Personal Network, Other) with:

  | Source       | Leads Added | CRF Reached | Closed Sales | Conversion Rate | Total Value (₱) |
  | ------------ | ----------- | ----------- | ------------ | --------------- | --------------- |
  | Social Media | 32          | 18          | 4            | 12.5%           | ₱16,200,000     |
  | Referral     | 8           | 7           | 5            | 62.5%           | ₱19,500,000     |
  | Walk-in      | 5           | 3           | 1            | 20.0%           | ₱3,800,000      |
  | Ads          | 14          | 6           | 0            | 0%              | ₱0              |

- **Conversion Rate** = (Closed Sales ÷ Leads Added) × 100. Displayed as a percentage.
- **Top Source Highlight**: The source with the highest conversion rate is highlighted with a badge (e.g., `⭐ Best Conversion`). The source with the highest total value is highlighted with `💰 Highest Revenue`.
- **Visual**: A horizontal bar chart below the table showing total leads vs. closed sales side by side per source, making it easy to see volume vs. quality at a glance.

**Filters**: Time period (Weekly / Monthly / All Time). Can also filter by individual consultant to see that consultant's source breakdown.

---

### Report 4: 🏃 Activity Volume Report (Engagement Report)

**Purpose**: Shows how actively each consultant is engaging with their leads — independent of sales outcomes. This is the Manager's primary coaching tool.

**Metrics Displayed**:

- A per-consultant activity table for the selected period:

  | Consultant   | Leads Owned | Trippings | Online Pres. | Actual Pres. | Total Activities | Notes Logged |
  | ------------ | ----------- | --------- | ------------ | ------------ | ---------------- | ------------ |
  | Maria Santos | 18          | 9         | 4            | 3            | 16               | 22           |
  | Juan Cruz    | 35          | 1         | 0            | 0            | 1                | 3            |

- **Activity Rate**: Total activities ÷ Leads Owned × 100, shown as a percentage. Low activity rate suggests low contact engagement.
- **Zero-Activity Flag**: Any consultant with 0 logged activities in the selected period is highlighted in red with a `⚠️ No Activity` badge.
- **Trippings-per-Sale Ratio**: For consultants with at least one closed sale, shows how many trippings it took to close (e.g., `4.5 trippings per sale`). Higher ratio = less efficient conversion.

**Filters**: Time period (Weekly / Monthly / All Time). Default view shows the current month.

## Feature List

The CRM should include the following features:

- **Multi-Role Access Control**: Role-based views and permissions for Property Consultants and Managers (including dual-role capability for Managers who also manage personal leads)
- **Lead Assignment, Ownership Transfer & Shared Delegation**: Manager capabilities to route, reassign, and temporarily delegate leads
- **Lead Deletion Security**: Restriction of lead deletion capabilities solely to the Manager role
- **System Administration & Settings**: Manager tools to add/deactivate users (consultant team), approve new agent registrations, lock or unlock agent registration, and update target projects and unit lists
- **Duplicate Lead Prevention**: Blocking duplicate contact creation via normalized phone number checks or Facebook profile links, with a **Lead Reactivation** feature to bypass blocks for returning cancelled/archived clients
- **Lead Aging Counter**: Tracking the duration (number of days) a lead has spent in the Documentation stage
- **Activity Attribution splitting**: Crediting engagement activities to the actual performer after lead transfers
- **Closed Sale Verification Workflow**: Booking approvals by the Manager before leaderboard updates
- **Live Broadcast Messages**: Manager capability to push real-time full-screen alerts that consultants must tap 'I Acknowledge' to unlock their app view.
- **Auto-Archiving & Warnings**: Deactivating cancelled/expired leads after 30 days to keep lists clean, with warning notifications sent 5 days prior
- **Auto-Cancellation on CRF Expiry**: Transitioning leads to Cancelled with reason "CRF Expired" after 30 days (or extension limits)
- **Priority Urgency Sorting**: Sorting dashboard priority feeds strictly by urgency (Reservation Expiry -> CRF Expiry -> Stagnant Leads -> Documentation)
- **CRF Extension Justification**: Mandatory comments/reasons logged in lead history when extending CRFs
- **Manager Dashboard Analytics**: Key dashboards for target tracking, lead source ROI, and agent activity rosters
- **Automatic client registration** with default status as **New Lead**
- **Forward-only stage transitions for Property Consultants** — the stage dropdown is restricted to the current stage, forward stages, and Cancelled. Backward movement is blocked at the UI level. Only Managers can reverse a stage, and only after an agent submits a formal Stage Reversion Request with a written reason.
- **CRF / Customer Registration Form** with 30-day validity
- **Option to extend an expiring CRF**: Consultants can perform the first extension, subsequent extensions require manager approval
- **Optional engagement activities** (Tripping, Online Presentation, and Actual Presentation) supporting multiple logged entries and historical session tracking
- **Reservation tracking**
- **Documentation tracking**
- **Closed Sale tracking**
- **Lead information fields** for name, phone number, source, project, unit type, and date
- **Support for older or existing clients** with manual date entry
- **Automatic weekly report** based on workflow activity:
  - Property Consultants can generate and export reports for their own activities only.
  - Managers can generate, filter, and export consolidated reports for individual consultants or the entire team.
  - Deactivated consultant data is preserved and tagged `[Inactive]` in team reports.
  - Deactivated consultants lose CRM access immediately; managers must export their data prior to deactivation if needed.
- **Weekly summary** for sales, trippings, CRF, presentations, and walk-ins
- **Weekly reports** should track which lead was involved, who handled the activity, and when the activity happened
- **Reports should support copy and export** actions for Weekly, Monthly, and All Time views (PDF or Excel/CSV, plus copy summary capability)
- **Workflow Page**: Visual Kanban-style pipeline board showing leads by stage for both Consultants (personal) and Managers (full team with consultant filter)

## System Architecture & Technology Stack

The application is structured as a fast, serverless web application.

> [!NOTE]
> **Prototype Phase Requirement**: To facilitate instant sandbox testing and user evaluation without external service configurations, all data persistence, authentication, and security logic are implemented using an **in-memory reactive store** on the client side. The architecture below defines the target production system; for the current build, all Supabase services, RLS policies, and database transactions are simulated locally.

- **Frontend Hosting**: **Netlify** (for fast global content delivery, automated Git deployments, and serverless redirects).
- **Backend & Database**: **Supabase Online Cloud** (direct connection to the hosted online SaaS instance, simulated via in-memory mock tables).

---

## First-Time System Onboarding & Mock Seeding (Cold Start)

To address the "cold start" problem (when the application is deployed for the first time with an empty database, or when a new user logs in to a blank environment), the system follows two separate flows: one for production bootstrapping and one for the sandbox prototype.

### 1. Production Bootstrapping (Empty Database)

When the application is deployed to production with a completely empty database:

- **The Setup Route `/setup`**: If the `users` table contains zero records, any attempt to access the app will automatically redirect to a secure `/setup` page.
- **Bootstrapping the Superadmin**: The first user on this screen registers the master **Superadmin** account.
- **Disabling the Setup Route**: Once the Superadmin account is successfully created in Supabase, the `/setup` route is permanently locked, and subsequent requests redirect back to the standard login screen `/login`.
- **Superadmin Role Initialization**: The Superadmin then logs in to their dashboard and creates the first **Manager** account(s).
- **Manager Role Initialization**: The Manager logs in, registers the **Property Consultants**, and uploads the computed project sheets.

### 2. Prototype Phase Mock Seeding

To make the sandbox prototype instantly interactive and testable without manual setup:

- **Automatic Mock Data Seeding**: If the local reactive store (`mock-db.js`) detects that `localStorage` is empty, it automatically populates the mock tables with:
  - **3 Active Consultants** (1 Manager, 2 Property Consultants).
  - **15 Simulated Leads** (spread across all stages from New Lead to Closed Sale, complete with mock documents, transaction prices, and manager notes).
  - **5 Simulated Calendar Events** (Client trippings and team booth manning shifts).
  - **A populated notification feed** containing unread alerts.
- **Testing Toggle (Developer Tool Widget)**: In prototype mode, a persistent floating widget `[ 🧪 Sandbox Console ]` is displayed in the bottom corner of the viewport. This widget allows developers and reviewers to:
  - **Clear All Data (Simulate Cold Start)**: Erases all local database records to test empty state screens and register the very first users from scratch.
  - **Reset Data to Seeded State**: Restores the 15 simulated leads and setup configurations.

### 3. First-Time User Onboarding Guidance

When a user logs in to an active system but has no data, they are not presented with empty dashboard spaces. The app replaces empty feeds with a **"First Steps" Onboarding Checklist Card**:

- **For Property Consultants (0 Leads Assigned)**:
  - Display a card titled `🚀 Let's Get Started!` with actionable checklist tasks:
    1. `[ ]` **Add your Profile Photo** (Tapping this routes to `/profile` settings).
    2. `[ ]` **Set your Canonical CRF Link** (Tapping this opens the profile page CRF link input field).
    3. `[ ]` **Create your First Client** (Tapping this opens the circular `(+)` Quick Add menu).
    4. `[ ]` **Submit Office/Shift Attendance** (Tapping this links to the Manning shift page).
- **For Managers (0 Consultants Registered)**:
  - Display a card titled `📋 Manager Setup Checklist` with tasks:
    1. `[ ]` **Add your first Property Consultant** (Tapping this routes directly to the Team page `Add Consultant` form).
    2. `[ ]` **Schedule a team manning/booth shift** (Tapping this opens the calendar view with the Manning sub-tab selected).
    3. `[ ]` **Configure Projects Library computed sheets** (Tapping this routes to the computed sheets library to upload the first project).

---

## Authentication Design (Supabase Simulation)

The application utilizes a simulated **Supabase Auth** session system to manage user accounts, sessions, and roles.

### 1. User Registration & Onboarding

To prevent unauthorized users from accessing the CRM client lists:

- **No public signup form**: Property Consultants cannot register accounts themselves.
- **Manager approval required**: All new agent accounts must be approved by a Manager before access is granted.
- **Registration lock toggle**: The Manager can lock new registrations at any time to prevent spam or unauthorized onboarding.
  - When **locked**, the registration flow is disabled and no new requests can be submitted.
  - When **unlocked**, the Manager can review and approve new registration requests manually.
- **Username uses the agent's unique number**: Each agent account uses their unique phone number as the username/login identifier.
- **Registration requires number input**: During onboarding, the agent must provide their unique number, which is validated for uniqueness before approval.
- **Manager-led Onboarding**:
  1. The Manager adds a consultant to the team from the **Team Page**.
  2. The Manager inputs the consultant's name, unique number, optional email address, and selects their role (default: Property Consultant).
  3. The system validates that the number is unique and stores it as the agent's username.
  4. The system adds the agent to the mock database store and triggers an email simulation (logging the activation link to the developer console).
  5. Accessing the activation link redirects the user to the password setup page.

### 2. Sign-In Flow

- **Fields**: Agent Number / Username and Password.
- **Remember Me**: Uses localStorage persistence so users stay logged in for up to 30 days.
- **Post-Login Routing**:
  - The system checks the user's role metadata.
  - Redirects **Property Consultants** straight to the **Consultant Dashboard**.
  - Redirects **Managers** straight to the **Manager Dashboard**.

### 3. Password Reset Flow (Manager-Controlled)

- Agents do **not** have a self-service password reset option.
- Password recovery is controlled by the Manager only.
- **Process**:
  1. The Manager resets the agent's password from the Team Page or Admin panel.
  2. The system generates a temporary password and provides access to the agent.
  3. After logging in, the agent is prompted to change the password immediately.
  4. The agent can later change the password again from the Settings page.

### 4. Security & Role-Level Security (RLS) Schema & Simulation

In the production database (Supabase), the following tables and RLS configurations must be set up. For the prototype phase, the client-side reactive store must simulate this exact enforcement logic:

#### A. Shared Lead Access (Join Table Schema)

To implement temporary or view-only lead sharing/delegation by Managers, a join table `lead_permissions` tracks delegated access:

- **Table Name**: `lead_permissions`
- **Fields**:
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `lead_id`: `UUID REFERENCES leads(id) ON DELETE CASCADE`
  - `user_id`: `UUID REFERENCES auth.users(id) ON DELETE CASCADE`
  - `access_level`: `VARCHAR(20) CHECK (access_level IN ('view_only', 'co_owner'))`
  - `granted_by`: `UUID REFERENCES auth.users(id)`
  - `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT NOW()`

#### B. Lead Table RLS Policies

The `leads` table enforces isolation for Property Consultants using the following RLS policy checks:

- **Consultants**: Can select, insert, or update a lead if `assigned_to` equals their user ID, **or** if there is an active record in `lead_permissions` mapping the `lead_id` to their user ID.
- **Managers & Superadmins**: Bypass isolation checks and have full read/write access to all rows.
- **SQL RLS Rule Example**:
  ```sql
  CREATE POLICY "Leads isolation policy" ON leads
  FOR ALL USING (
      assigned_to = auth.uid()
      OR EXISTS (
          SELECT 1 FROM lead_permissions
          WHERE lead_permissions.lead_id = leads.id
          AND lead_permissions.user_id = auth.uid()
      )
      OR EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('manager', 'superadmin')
      )
  );
  ```

#### C. Immutable Audit Trail

To ensure compliance, historical integrity, and commission verification, the `audit_trail` (or `activity_log`) table must be **write-only**:

- **RLS Policy**: Allow `INSERT` operations for authenticated users (attributing the action to their user ID).
- **Blocking Rules**: Strictly block `UPDATE` and `DELETE` queries on audit trail rows for **all** roles (including Managers and Superadmins). Once written, audit history is permanent.

#### D. Session Timeout & Enforcements

- Users are logged out automatically after 14 days of inactivity.

---

## Full Database Schema

This section defines every table, field, type, constraint, and relationship required to run the CRM in production on Supabase PostgreSQL. The client-side `mock-db.js` store **must simulate these exact table shapes and relationships** to guarantee zero-friction migration to production.

> [!IMPORTANT]
> All `UUID` primary keys use `DEFAULT gen_random_uuid()`. All timestamps use `TIMESTAMP WITH TIME ZONE DEFAULT NOW()`. All tables reside in the `public` schema unless noted. `auth.users` is the Supabase-managed identity table and must never be manually modified.

---

### Table 1: `profiles`

Extends `auth.users` with application-level metadata for each user account. One row per registered user.

```sql
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              VARCHAR(20)  NOT NULL CHECK (role IN ('superadmin', 'manager', 'property_consultant')),
  display_name      VARCHAR(100) NOT NULL,
  agent_number      VARCHAR(30)  UNIQUE NOT NULL,          -- Used as login username
  email             VARCHAR(200),
  phone             VARCHAR(20),                            -- Normalized E.164 format
  profile_photo_url TEXT,
  crf_link          TEXT,                                   -- Canonical CRF link; single source of truth
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at     TIMESTAMP WITH TIME ZONE,
  personal_monthly_target NUMERIC(15,2),                   -- Set by Manager; null = use auto-calc fallback
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes**:

- `crf_link` is the single canonical source of truth referenced by the Quick Action CRF shortcut and the leaderboard card.
- `personal_monthly_target` is set by the Manager from the Goal Progress Tracker panel. If `NULL`, the system displays `Team Goal ÷ Active Consultant Count` as a labeled `(Auto)` fallback.
- `last_login_at` is written on every successful sign-in. Powers the Manager's Team Page "Last Login" column and the Team Guard idle detector.

---

### Table 2: `projects`

The canonical project list that populates the "Project" dropdown in the Add Lead form, the Leaderboard, and the Computations Library.

```sql
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL UNIQUE,
  developer_name  VARCHAR(200) NOT NULL DEFAULT 'DMCI Homes',
  computation_file_url  TEXT,                              -- Uploaded PDF or image URL
  computation_file_type VARCHAR(10) CHECK (computation_file_type IN ('pdf', 'img', 'xlsx')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,           -- Inactive = hidden from dropdowns
  display_order   INTEGER NOT NULL DEFAULT 0,              -- Lower number = shown first in lists
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes**:

- `display_order = 0` for Allegra Garden Residences, `display_order = 1` for Sonora Garden Residences (preloaded seed data).
- Deleting or deactivating a project (`is_active = FALSE`) hides it from new lead forms but preserves historical lead associations.

---

### Table 3: `leads`

The core pipeline table. Every client/lead record lives here.

```sql
CREATE TABLE leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Client Info
  full_name             VARCHAR(100) NOT NULL,
  phone_normalized      VARCHAR(20) UNIQUE,                -- E.164 normalized; NULL if not provided
  facebook_url_canonical TEXT UNIQUE,                      -- Extracted canonical username/ID; NULL if not provided
  profile_photo_url     TEXT,
  source                VARCHAR(50) NOT NULL CHECK (source IN (
                          'social_media', 'walk_in', 'flyers', 'ads',
                          'referral', 'personal_network', 'other')),
  source_description    TEXT,                              -- Free text for 'other' sources
  project_id            UUID REFERENCES projects(id),
  unit_types            TEXT[],                            -- Array: ['studio','1br','2br','3br']

  -- Pipeline Stage
  stage                 VARCHAR(30) NOT NULL DEFAULT 'new_lead'
                          CHECK (stage IN ('new_lead','crf','reserved',
                                           'documentation','closed_sale',
                                           'cancelled','archived')),
  previous_stage        VARCHAR(30),                       -- Retained for undo/reversion reference
  stage_entered_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ownership & Assignment
  assigned_to           UUID REFERENCES profiles(id),      -- NULL = unassigned pool
  created_by            UUID REFERENCES profiles(id) NOT NULL,

  -- CRF Stage Fields
  crf_submitted_at      TIMESTAMP WITH TIME ZONE,
  crf_expires_at        TIMESTAMP WITH TIME ZONE,          -- Always 30d from first entry; never reset on re-entry
  crf_extension_count   INTEGER NOT NULL DEFAULT 0,        -- 0=none, 1=consultant-done, 2+=manager-required

  -- Reserved Stage Fields
  unit_description      TEXT,                              -- Unit reserved (e.g. "Unit 12A, Tower 1")
  reservation_paid      BOOLEAN,
  unit_payment_date     DATE,
  reservation_starts_at TIMESTAMP WITH TIME ZONE,
  reservation_expires_at TIMESTAMP WITH TIME ZONE,         -- starts_at + 24 hours
  reservation_status    VARCHAR(20) DEFAULT 'active'
                          CHECK (reservation_status IN ('active','expired','paid','extended')),

  -- Documentation Stage Fields
  documentation_started_at TIMESTAMP WITH TIME ZONE,

  -- Closed Sale Fields
  sale_price            NUMERIC(15,2),
  sale_payment_date     DATE,
  closed_sale_submitted_at TIMESTAMP WITH TIME ZONE,
  closed_sale_status    VARCHAR(30) DEFAULT 'pending_verification'
                          CHECK (closed_sale_status IN ('pending_verification','verified','rejected')),
  closed_sale_verified_by UUID REFERENCES profiles(id),
  closed_sale_verified_at TIMESTAMP WITH TIME ZONE,
  closed_sale_rejection_reason TEXT,

  -- Cancellation Fields
  cancellation_reason   TEXT,
  cancellation_notes    TEXT,
  cancellation_date     DATE,
  may_return            BOOLEAN DEFAULT FALSE,

  -- Archiving
  archived_at           TIMESTAMP WITH TIME ZONE,
  archive_reason        VARCHAR(100),                      -- e.g. 'crf_expired', 'cancellation_30d', 'reservation_expired_no_action'

  -- Optimistic Locking
  version               INTEGER NOT NULL DEFAULT 1,

  -- Soft Delete (Trash Bin)
  deleted_at            TIMESTAMP WITH TIME ZONE,          -- NULL = active; non-null = in trash bin
  deleted_by            UUID REFERENCES profiles(id),

  -- Timestamps
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes**:

- `phone_normalized` and `facebook_url_canonical` have `UNIQUE` constraints powering Tier 1 and Tier 2 duplicate detection.
- `version` is incremented on every `UPDATE`. Offline sync conflicts are detected by comparing the client's cached `version` against the server value before committing.
- `deleted_at` implements the 30-day Trash Bin soft-delete. Supabase scheduled function hard-deletes rows where `deleted_at < NOW() - INTERVAL '30 days'`.
- `crf_expires_at` is set once on first entry into the `crf` stage and never reset to prevent deadline avoidance.

---

### Table 4: `lead_buyers`

Tracks all buyers, co-buyers, and co-owners registered per lead (for the Documentation checklist).

```sql
CREATE TABLE lead_buyers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id        UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  buyer_type     VARCHAR(20) NOT NULL CHECK (buyer_type IN ('primary','co_buyer','co_owner')),
  full_name      VARCHAR(100) NOT NULL,

  -- Document Checklist (checked = TRUE)
  doc_valid_id           BOOLEAN NOT NULL DEFAULT FALSE,
  doc_valid_id_selfie    BOOLEAN NOT NULL DEFAULT FALSE,
  doc_proof_of_tin       BOOLEAN NOT NULL DEFAULT FALSE,
  doc_proof_of_account   BOOLEAN NOT NULL DEFAULT FALSE,

  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes**:

- One `primary` buyer row is auto-created when a lead enters the `documentation` stage.
- The `Closed Sale` block validation checks that **all four `doc_*` fields are `TRUE` for every row** belonging to the `lead_id` before the stage transition is allowed.
- Pipeline board shows a progress summary (e.g., `👥 2 Buyers | 5/8 Docs Checked`) computed from this table.

---

### Table 5: `lead_activities`

All engagement activities logged against a lead: trippings, presentations, manager notes, manual call logs.

```sql
CREATE TABLE lead_activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  activity_type     VARCHAR(30) NOT NULL CHECK (activity_type IN (
                      'tripping', 'online_presentation', 'actual_presentation',
                      'manager_note', 'call_log', 'general_note')),
  notes             TEXT CHECK (char_length(notes) <= 1000),

  -- Attribution (immutable after insert; survives lead transfers)
  performed_by_user_id UUID NOT NULL REFERENCES profiles(id),
  lead_stage_at_time   VARCHAR(30) NOT NULL,               -- Snapshot of stage when activity was logged

  -- Scheduling (for trippings/presentations)
  scheduled_at      TIMESTAMP WITH TIME ZONE,

  -- Manager-only note visibility flag
  is_manager_only   BOOLEAN NOT NULL DEFAULT FALSE,        -- TRUE = manager note, visible to manager + assigned consultant only

  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- NOTE: No updated_at — activity records are immutable. Edits must insert a corrective note.
);
```

**Notes**:

- `performed_by_user_id` is permanently attributed to the consultant who logged it. If ownership is transferred, historical credits remain with the original performer.
- `is_manager_only = TRUE` renders the note with an "🔒 Internal" label; it is visible to the assigned consultant (read-only) and the manager.
- New engagement activity logging is **blocked by the UI** once `stage` enters `documentation` or `closed_sale` (Stage-Gate rule).

---

### Table 6: `audit_trail`

Immutable write-only system log. Records every stage transition, ownership change, approval, reversion, and administrative action.

```sql
CREATE TABLE audit_trail (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,  -- NULL for non-lead system events
  actor_user_id   UUID NOT NULL REFERENCES profiles(id),
  action_type     VARCHAR(60) NOT NULL,                    -- e.g. 'stage_transition', 'ownership_transfer', 'reversion_approved'
  action_detail   JSONB NOT NULL,                          -- Structured payload; see examples below
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- No updated_at, no deleted_at — rows here are permanent.
);
```

**`action_detail` JSONB payload examples**:

```json
// Stage transition
{ "from_stage": "crf", "to_stage": "reserved", "required_fields_entered": ["unit_description","unit_payment_date"] }

// Manager reversion
{ "from_stage": "documentation", "to_stage": "reserved", "reversion_reason": "Client cancelled and needs to reserve different unit", "request_id": "<uuid>" }

// Ownership transfer with split credit
{ "from_user_id": "<uuid>", "to_user_id": "<uuid>", "credit_split": { "original_pct": 50, "closing_pct": 50 } }
```

**RLS Policy**:

```sql
-- Allow all authenticated users to INSERT
CREATE POLICY "audit_insert_only" ON audit_trail FOR INSERT TO authenticated WITH CHECK (actor_user_id = auth.uid());
-- Block UPDATE and DELETE for ALL roles, including manager and superadmin
CREATE POLICY "audit_no_update" ON audit_trail FOR UPDATE USING (FALSE);
CREATE POLICY "audit_no_delete" ON audit_trail FOR DELETE USING (FALSE);
```

---

### Table 7: `appointments`

All calendar events: client trippings/presentations (private) and manning/booth shifts (public).

```sql
CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_type  VARCHAR(30) NOT NULL CHECK (appointment_type IN (
                      'client_tripping', 'online_presentation', 'actual_presentation',
                      'manning_duty', 'booth_duty')),

  -- Client appointments (private)
  lead_id           UUID REFERENCES leads(id) ON DELETE CASCADE,  -- NULL for manning/booth
  assigned_to_user_id UUID NOT NULL REFERENCES profiles(id),

  -- Event Details
  title             VARCHAR(200),                           -- e.g. "SM North Booth", auto-filled for client events
  location_or_booth VARCHAR(200),                          -- Used for manning/booth events
  project_target    VARCHAR(200),                          -- For client appointments
  notes             TEXT,
  starts_at         TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at           TIMESTAMP WITH TIME ZONE,

  -- Visibility flag
  is_public         BOOLEAN NOT NULL DEFAULT FALSE,         -- TRUE for manning/booth (team-wide), FALSE for client (private)

  -- Cancellation (soft)
  is_cancelled      BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_requested_by UUID REFERENCES profiles(id),  -- Agent who flagged for cancellation
  cancelled_by      UUID REFERENCES profiles(id),           -- Manager who confirmed cancellation

  created_by        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes**:

- `is_public = TRUE` (Manning/Booth events) are visible to all team members.
- `is_public = FALSE` (Client events) are visible only to `assigned_to_user_id` and the Manager.
- The calendar color-coding is derived from `appointment_type` (see the Color Coding table in the Schedule section).

---

### Table 8: `stage_reversion_requests`

Formal in-app requests from Property Consultants to roll back a lead to a previous stage.

```sql
CREATE TABLE stage_reversion_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  requested_by      UUID NOT NULL REFERENCES profiles(id),
  current_stage     VARCHAR(30) NOT NULL,
  target_stage      VARCHAR(30) NOT NULL,                  -- Must be a previous stage
  reason            TEXT NOT NULL CHECK (char_length(reason) >= 10),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by       UUID REFERENCES profiles(id),
  reviewed_at       TIMESTAMP WITH TIME ZONE,
  manager_correction_reason TEXT,                          -- Required when approving (logged in audit_trail)
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Table 9: `crf_extensions`

Tracks every CRF extension event per lead to enforce the one-consultant / manager-approval-required rule.

```sql
CREATE TABLE crf_extensions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  extension_number INTEGER NOT NULL,                       -- 1 = first (consultant), 2+ = manager required
  new_expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
  reason           TEXT NOT NULL CHECK (char_length(reason) >= 5),
  extended_by      UUID NOT NULL REFERENCES profiles(id),
  approved_by      UUID REFERENCES profiles(id),           -- NULL for extension_number = 1
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Table 10: `notifications`

Per-user notification feed. Drives the badge counter, toast banners, and push notifications.

```sql
CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id           UUID REFERENCES leads(id) ON DELETE SET NULL,
  notification_type VARCHAR(60) NOT NULL,                  -- e.g. 'crf_near_expiry', 'sale_pending_verification'
  title             VARCHAR(200) NOT NULL,
  body              TEXT NOT NULL,
  deep_link_path    TEXT,                                   -- e.g. '/leads/<uuid>' for tap-to-navigate
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  layers            JSONB NOT NULL DEFAULT '{"badge": true, "toast": false, "push": false}',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes**:

- `layers` JSONB controls which of the three delivery layers fire per the Notification Priority Matrix.
- `deep_link_path` is used by PWA push notifications to open the exact correct screen.

---

### Table 11: `broadcasts`

Live full-screen team broadcast messages sent by the Manager.

```sql
CREATE TABLE broadcasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by         UUID NOT NULL REFERENCES profiles(id),
  message_text    TEXT NOT NULL,
  image_url       TEXT,
  link_url        TEXT,
  file_url        TEXT,
  file_name       TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE broadcast_acknowledgments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id    UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (broadcast_id, user_id)
);
```

**Notes**:

- On app load or visibility change, the client queries for any `broadcasts` whose `id` is not in `broadcast_acknowledgments` for `auth.uid()`. Any unacknowledged broadcast triggers the mandatory full-screen overlay.

---

### Table 12: `links_library`

Team-shared resource links curated by the Manager, visible to all consultants.

```sql
CREATE TABLE links_library (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       VARCHAR(200) NOT NULL,
  url         TEXT NOT NULL,
  category    VARCHAR(20) NOT NULL CHECK (category IN (
                'marketing', 'news', 'promos', 'updates', 'forms', 'tools', 'other')),
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Table 13: `lead_permissions`

Join table for temporary or view-only lead sharing/delegation by Managers (defined earlier in the RLS section, repeated here for completeness).

```sql
CREATE TABLE lead_permissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('view_only', 'co_owner')),
  granted_by   UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (lead_id, user_id)
);
```

---

### Table 14: `team_goals`

Stores the Manager-configured monthly team revenue target. One row per calendar month. Historical rows are preserved for MoM trend reporting.

```sql
CREATE TABLE team_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month         DATE NOT NULL UNIQUE,        -- Always stored as the 1st of the month (e.g. '2026-07-01')
  target_value  NUMERIC(15,2) NOT NULL CHECK (target_value > 0),
  set_by        UUID NOT NULL REFERENCES profiles(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes**:

- The Manager sets or updates the goal for the current month from the Goal Progress Tracker panel on the Dashboard. Changes take effect immediately.
- If no row exists for the current month, the Goal Pace Calculator and reports display `No Goal Set` with a prompt for the Manager to configure one.
- Historical rows power the Month-over-Month (MoM) Trend Report — never delete old rows.

---

### Table 15: `system_settings`

A single-row global configuration table for platform-wide settings managed by the Superadmin and Manager.

```sql
CREATE TABLE system_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- There should only ever be ONE row in this table.

  -- Registration Control
  registration_locked       BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE = no new agent registrations accepted

  -- Timezone
  company_timezone          VARCHAR(60) NOT NULL DEFAULT 'Asia/Manila',  -- IANA timezone string

  -- PWA / App Identity
  app_name                  VARCHAR(100) NOT NULL DEFAULT 'Team Tenacious CRM',
  app_short_name            VARCHAR(30)  NOT NULL DEFAULT 'Tenacious',
  app_theme_color           VARCHAR(7)   NOT NULL DEFAULT '#069494',   -- Hex; matches primary teal
  app_background_color      VARCHAR(7)   NOT NULL DEFAULT '#111827',   -- Hex; matches sidebar dark

  -- Session
  session_timeout_days      INTEGER NOT NULL DEFAULT 14,

  updated_by                UUID REFERENCES profiles(id),
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Notes**:

- This table must always contain exactly **one row** seeded at bootstrap time.
- `registration_locked` is toggled by the Manager from the Team Page and by the Superadmin from the Admin Dashboard.
- `company_timezone` is used by all date comparisons for Weekly/Monthly filters, leaderboard cutoffs, and scheduled archiving.
- The PWA fields (`app_name`, `app_short_name`, `app_theme_color`, `app_background_color`) directly populate the generated `manifest.json` at build time.

---

### Schema Relationship Diagram (Entity Map)

```text
auth.users (Supabase managed)
    │
    └── profiles (1:1)
            │
            ├── leads (assigned_to → profiles.id)
            │       │
            │       ├── lead_buyers              (1:many, documentation checklist)
            │       ├── lead_activities           (1:many, engagement + notes history)
            │       ├── lead_permissions          (1:many, shared access join table)
            │       ├── stage_reversion_requests  (1:many)
            │       ├── crf_extensions            (1:many)
            │       ├── audit_trail               (1:many, immutable log)
            │       └── appointments              (1:many via lead_id)
            │
            ├── notifications   (1:many per recipient_user_id)
            ├── broadcasts      (sent_by → profiles.id)
            │       └── broadcast_acknowledgments (many:many join)
            └── links_library   (created_by → profiles.id)

projects        (referenced by leads.project_id)
team_goals      (one row per calendar month; set by Manager)
system_settings (single-row global config; set by Manager / Superadmin)
```

---

### Mock DB Implementation Notes for `mock-db.js`

When implementing the client-side reactive store, the following rules must apply:

1. **Mirror the schema exactly**: Each mock table must be a JavaScript array of objects whose keys match the SQL column names above.
2. **Enforce constraints in JS**: Unique checks (phone, Facebook URL, broadcast acknowledgment), NOT NULL guards, and CHECK enum validations must be applied at the store mutation layer — not in the UI layer.
3. **Write audit_trail on every lead mutation**: Any function in `lead-store.js` that changes a lead's `stage`, `assigned_to`, or `deleted_at` must atomically append a row to the mock `audit_trail` array in the same transaction.
4. **Never expose cross-agent leads**: The `getLeadsByCurrentUser()` function must filter by `assigned_to === currentUser.id` unless the current user's role is `manager` or `superadmin`.
5. **Seed order matters**: Seed `system_settings` → `profiles` → `projects` → `team_goals` → `leads` → `lead_buyers` → `lead_activities` → `notifications`. Foreign key references must resolve in this order.
6. **system_settings is always a singleton**: On boot, `mock-db.js` must check if the `system_settings` array is empty. If so, seed one default row. Never allow more than one row to exist.
7. **team_goals month key**: Always normalize the month to the 1st day at midnight in `company_timezone` before inserting (e.g. `2026-07-01T00:00:00+08:00`). This prevents duplicate keys from timezone drift.

---

## UI Copy, Labels, and Button System

To maintain visual consistency and ensure frontend developers build exactly what is expected, the following copy, badges, and button styles are standardized:

### 1. Stage Badges (Renders on Cards and Boards)

All stage badges use tokens from the **Status Semantic Colors** set in the Brand Color Palette — no ad-hoc colors:

- **New Lead**: `[ New Lead ]` (Info chip — Text `#1D4ED8` | BG `#DBEAFE`)
- **CRF**: `[ CRF Active ]` (Brand teal chip — Text `#047A7A` | BG `#D9F3F3`)
- **Reserved**: `[ Reserved ]` (Stage identity violet chip — Text `#6D28D9` | BG `#EDE9FE`)
- **Documentation**: `[ Documentation ]` (Warning chip — Text `#854D0E` | BG `#FEF9C3`)
- **Closed Sale**: `[ Closed Sale ]` (Success chip — Text `#15803D` | BG `#DCFCE7`)
- **Cancelled**: `[ Cancelled ]` (Inactive chip — Text `#6B7280` | BG `#F3F4F6`)
- **Archived**: `[ Archived ]` (Outline only — Text `#6B7280` | transparent BG | 1px `#E5E7EB` border)

### 2. Live Expiry Warning Badges (Renders on Assistant and Cards)

- **CRF expiring in < 3 days**:
  - _Text_: `⚠️ CRF Expires in [X] days` (e.g. `⚠️ CRF Expires in 2 days`)
  - _Color_: Orange text, orange border.
- **Reservation expiring in < 24 hours**:
  - _Text_: `⏰ Res. Expires in [HH:MM]` (with live ticking countdown, e.g. `⏰ Res. Expires in 14:20`)
  - _Color_: Bold red text, solid red card border.
- **Reservation escalated (< 4 hours)**:
  - _Text_: `🚨 ESCALATED Expiry: [HH:MM]`
  - _Color_: Solid red background, white text (Manager only).

### 3. Action Block Warning Modals (User Prompts)

- **Duplicate Lead Block**:
  - _Title_: `Duplicate Client Found`
  - _Message_: _"This client is already registered in the system. Please request lead sharing or transfer from your Manager."_
  - _Button_: `[ Back to Leads ]` (Solid teal `#069494`)
- **Confirm Permanent Delete**:
  - _Title_: `Move to Trash?`
  - _Message_: _"This lead will be moved to the Trash Bin. It can be recovered within 30 days before permanent database deletion."_
  - _Buttons_: `[ Cancel ]` (Grey `#6B7280` outline) | `[ 🗑️ Move to Trash ]` (Solid critical red `#B91C1C`)

### 4. Empty State Messages (To prevent blank screens)

Every data-heavy screen must have a defined empty state so developers never ship a blank white panel. All empty states follow the same design pattern: a small illustrative icon or SVG, a short friendly headline, and an optional action button.

**Lead Screens**

- **No Leads (My Leads — Agent)**:
  - _Text_: _"Your pipeline is empty. Tap the (+) button to register your first client!"_
  - _Button_: `[ ➕ Add Client ]`
- **No Leads (All Leads — Manager)**:
  - _Text_: _"No leads yet. Add your first client or assign an existing one to a consultant."_
  - _Button_: `[ ➕ Add & Assign Client ]`
- **No Results After Search/Filter**:
  - _Text_: _"No leads match your current filter. Try adjusting your search or clearing the filters."_
  - _Button_: `[ Clear Filters ]`

**Workflow Board**

- **All Stages Empty (no active leads)**:
  - _Text_: _"Nothing in the pipeline yet. Start by adding a client!"_
  - _Button_: `[ ➕ Add Client ]`
- **Specific Stage Column Empty**:
  - _Text_: _"No leads in [Stage Name] right now."_ (shown inline inside the empty column — no button needed)

**Leaderboard**

- **No Closed Sales for Selected Period (This Week / Monthly)**:
  - _Text_: _"No verified sales recorded for this period yet. Keep pushing — the board updates as soon as a sale is approved!"_
  - _(No action button — informational only)_
- **No Consultants on Team**:
  - _Text_: _"No consultants have been added to the team yet."_ (Manager sees this; consultant would never reach leaderboard without teammates)
  - _Button_: `[ 👥 Go to Team Page ]`

**Reports (Manager)**

- **No Data for Selected Period**:
  - _Text_: _"No activity recorded for the selected period. Try a different date range or check back after your team logs their first activity."_
  - _Button_: `[ Change Period ]`
- **No Consultants — First-Time Setup**:
  - _Text_: _"Reports will appear here once you've added consultants and they start logging activity."_
  - _Button_: `[ 👥 Go to Team Page ]`

**Team Page (Manager)**

- **No Consultants Added Yet**:
  - _Title_: `Your team is empty`
  - _Text_: _"Add your first Property Consultant to get started. They'll receive an email invite to set up their account."_
  - _Button_: `[ ➕ Add Consultant ]`

**Schedule**

- **No Upcoming Appointments**:
  - _Text_: _"No appointments scheduled. Client meetings and tripping schedules will appear here."_
  - _(No action button — schedules are created by the Manager or triggered by activity)_

**Notifications**

- **No Notifications**:
  - _Text_: _"All quiet here! You are fully caught up."_

**Assistant Page Panels**

- **No Active Warnings (Expiry & Escalation Panel)**:
  - _Text_: _"Great job! None of your leads are currently stagnant or expiring."_
- **No Stagnant Leads**:
  - _Text_: _"No stagnant leads. Your pipeline is active and moving."_
- **Stage Reversion Inbox — No Pending Requests (Manager)**:
  - _Text_: _"No pending reversion requests. All stage transitions are locked and confirmed."_

### 5. Standardized Buttons & Icons

All buttons resolve to the Color System tokens and follow the three-variant button system. Button labels are always `16px` weight `600`. The primary action color across the entire app is **teal `#069494`** — there are no blue or navy buttons:

- **Button Variants**:
  - **Primary**: BG `#069494` | Text `#FFFFFF` | Hover `#047A7A`
  - **Secondary**: BG `#FFFFFF` | Border `#E5E7EB` | Text `#111827` | Hover BG `#F9FAFB`
  - **Ghost**: Transparent BG | Text `#069494` | Hover BG `#D9F3F3`
- **Primary Actions (Primary variant)**:
  - Add Client: `[ ➕ Add Client ]` (Primary teal)
  - Save/Confirm: `[ Save Changes ]` (Primary teal)
  - Close Sale (Manager only): `[ ✅ Log Closed Sale ]` (Solid Success `#16A34A` | White text — the only non-teal filled button besides destructive red)
- **Warning & Risk Actions (Alerts)**:
  - Cancel Lead: `[ ❌ Cancel Lead ]` (Solid Error `#DC2626` | White text)
  - Flag Appointment: `[ ⚠️ Flag for Cancellation ]` (Warning `#D97706` border | Warning `#D97706` text)
- **Inline Micro-Actions (Secondary/Ghost variants on cards)**:
  - Call: `[ 📞 Call ]` (Ghost teal)
  - Log activity: `[ 📝 Log Activity ]` (Secondary)
  - Extend CRF: `[ 🔄 Extend CRF ]` (Warning `#D97706` outline)
  - Reactivate lead: `[ ⚡ Reactivate ]` (Success `#16A34A` outline)

---

## Repository Folder Structure & File Naming Standards

To ensure project consistency, maintainability, and quick understanding for both human developers and AI coding assistants, the repository follows a strict directory layout and file naming convention.

### 1. Directory Tree Schema

The codebase is organized as a single-page application (SPA) with a clear separation between user interface views, reusable components, and reactive data stores (simulating Supabase services client-side):

```text
crm-app/
├── public/                      # Static assets served as-is (e.g., logo.svg, favicon.ico)
│   └── assets/                  # Publicly downloadable media and computation templates
│
├── src/                         # Application source code
│   ├── assets/                  # Compiled assets (CSS, branding logos, design system tokens)
│   │   └── styles/
│   │       ├── main.css         # Global styles & design system tokens (8px grid, CSS variables)
│   │       └── components/      # Specific component styles (BEM overrides for calendar, AI view)
│   │
│   ├── components/              # Reusable, self-contained UI components
│   │   ├── common/              # System-wide design system UI atoms (buttons, badges, inputs, skeletons)
│   │   │   ├── button.js        # Standardized primary/warning/outline button definitions
│   │   │   ├── badge.js         # Traffic-light status badges (CRF Active, Expired, Escalated)
│   │   │   ├── modal.js         # Modal wrappers with backdrop-blur and slide-up sheet animations
│   │   │   └── toast.js         # Floating notification alerts with auto-dismiss timers
│   │   │
│   │   ├── dashboard/           # Dashboard-specific elements (activity widgets, metrics)
│   │   ├── workflow/            # Kanban board column containers, swipe tracking logic
│   │   ├── schedule/            # Calendar grids, week slots, day detail drawers
│   │   └── assistant/           # Tenacious AI avatar chat bubble, glassmorphic layout
│   │
│   ├── pages/                   # Main page/route views (loaded dynamically via router)
│   │   ├── login.js             # Sign-in page (Agent number + password checks)
│   │   ├── dashboard.js         # Role-tailored home screen (consultant priority lists, manager feeds)
│   │   ├── leads.js             # Detailed list view & lead profile attribute tables (Attio style)
│   │   ├── schedule.js          # Combined Client/Manning schedule screen (List vs Calendar views)
│   │   ├── assistant.js         # Split segmented view: Conversational AI and Console Grid
│   │   └── profile.js           # Setting user profile and setting/copying the canonical CRF link
│   │
│   ├── store/                   # Reactive state stores & client-side database simulation
│   │   ├── mock-db.js           # Client-side reactive database (in-memory tables, localStorage sync)
│   │   ├── auth-store.js        # Current user sessions, roles (consultant/manager/superadmin)
│   │   └── lead-store.js        # Lead operations (transitions, 10-min grace period undo queues)
│   │
│   ├── utils/                   # Pure utility functions & schema validators
│   │   ├── date-helpers.js      # Countdown timer parsing and local/company timezone formatting
│   │   ├── fb-normalizer.js     # RegEx parser to extract canonical usernames from Facebook URLs
│   │   └── validators.js        # Integrity checks (ensuring all buyer docs are checked off before Close)
│   │
│   ├── app.js                   # Application entry point, router handler, and viewport setups
│   └── index.html               # Main single-page application wrapper
│
├── .gitignore                   # Files to exclude from Git (node_modules, local keys)
├── netlify.toml                 # Routing configuration for SPA fallback and headers
├── package.json                 # Project dependencies, build, and dev scripts
└── README.md                    # Setup instructions, architecture overview, and deployment info
```

### 2. Architectural Boundaries & Data Flow Rules

To maintain codebase cleanliness, the following architectural boundaries are strictly enforced:

- **State Isolation**: UI components and page modules (`src/components/` and `src/pages/`) must never directly write to local storage, edit mock database arrays, or perform authentication validations. They must dispatch requests via the stores in `src/store/`.
- **State Subscriptions**: UI views should subscribe to store updates. When a store's state changes (e.g., a lead stage is reverted), components must update reactively.
- **Pure Utilities**: Files in `src/utils/` must be pure functions. They should not import states from `src/store/` or manipulate the DOM directly.

### 3. File Naming Conventions

All files and directories must adhere to the following naming styles:

| Asset Type          | Convention                                | Case         | Example                                        |
| :------------------ | :---------------------------------------- | :----------- | :--------------------------------------------- |
| **Directory Names** | lowercase hyphenated                      | `kebab-case` | `src/components/common/`, `src/lead-store/`    |
| **Component Files** | lowercase hyphenated                      | `kebab-case` | `button.js`, `lead-card.js`, `modal-dialog.js` |
| **Page View Files** | lowercase hyphenated                      | `kebab-case` | `login.js`, `leads-dashboard.js`               |
| **Store Files**     | lowercase hyphenated with `-store` suffix | `kebab-case` | `auth-store.js`, `lead-store.js`               |
| **Utility Files**   | lowercase hyphenated or camelCase         | `kebab-case` | `date-helpers.js`, `fb-normalizer.js`          |
| **Style Sheets**    | lowercase hyphenated                      | `kebab-case` | `main.css`, `kanban-board.css`                 |

### 4. Implementation Guidelines for AI coding assistants

When auto-generating code or creating new components:

1. **Always verify components match design guidelines**: All new UI files must check variables in `src/assets/styles/main.css` for color tokens. The brand accent is always teal (`#069494`, pressed `#047A7A`); the only non-teal hues permitted are the Status Semantic chip tokens and the calendar event-type colors (`#3B82F6` online presentation, `#8B5CF6` actual presentation, `#D97706` manning/booth) — which are data-visualization colors, never UI accents.
2. **Never split state**: Do not spin up parallel state arrays inside single UI components for shared database objects (like Leads or Active Users). Always read from and mutate the store in `src/store/`.
3. **Do not introduce imports outside bounds**: Never import pages into components. Keep the flow hierarchical: `app.js` -> `pages` -> `components` -> `common`.

---

## Global System Constants

The following platform-wide constants must be declared once in a dedicated `src/utils/constants.js` file and imported wherever needed. Never hardcode these values inline in components.

```js
// src/utils/constants.js

export const COMPANY_TIMEZONE = "Asia/Manila"; // Philippine Standard Time (UTC+8)
export const CURRENCY_LOCALE = "en-PH"; // Used for ₱ number formatting
export const CURRENCY_SYMBOL = "₱";

// Lead pipeline stages (in forward progression order)
export const STAGES = [
  "new_lead",
  "crf",
  "reserved",
  "documentation",
  "closed_sale",
  "cancelled",
  "archived",
];

// Deadline thresholds (in milliseconds or days)
export const CRF_VALIDITY_DAYS = 30; // Base CRF validity
export const CRF_WARNING_DAYS = 3; // Trigger ⚠️ warning banner
export const RESERVATION_VALIDITY_HOURS = 24; // Reservation window
export const RESERVATION_ESCALATION_HOURS = 4; // Escalate to Manager dashboard
export const STAGNANT_LEAD_DAYS = 7; // Flag as stagnant
export const BOTTLENECK_DOCUMENTATION_DAYS = 20; // Flag in Manager bottleneck panel
export const IDLE_AGENT_DAYS = 3; // Flag in Team Guard
export const ARCHIVING_DAYS = 30; // Auto-archive after cancellation
export const ARCHIVING_WARNING_DAYS = 5; // Warn agent before archiving
export const RESERVATION_EXPIRED_AUTO_CANCEL_DAYS = 3; // Auto-cancel expired reservation
export const UNDO_GRACE_PERIOD_MINUTES = 10; // Agent self-undo window after stage change
export const SESSION_TIMEOUT_DAYS = 14; // Auto-logout after inactivity
export const TRASH_BIN_RETENTION_DAYS = 30; // Hard-delete from trash after this period
export const TOP_PERFORMER_SPOTLIGHT_DAYS = 5; // Activate spotlight in last N days of month

// Pagination
export const LIST_PAGE_SIZE = 20; // Default rows per page for lead lists
export const ACTIVITY_PAGE_SIZE = 30; // Rows per page for activity/audit feeds

// Notification badge cap
export const NOTIFICATION_BADGE_MAX = 9; // Display '9+' when count exceeds this
```

---

## Pagination & List Loading Rules

All data-heavy lists in the application must follow these rules to ensure fast load times on mobile data connections.

### Lead Lists (`My Leads`, `All Leads`)

- **Page size**: `20` leads per page (controlled by `LIST_PAGE_SIZE` constant).
- **Loading strategy**: **Cursor-based pagination** using `created_at` as the cursor. Each page request fetches the next `N` rows after the last seen cursor timestamp.
- **Trigger**: The next page loads automatically when the user scrolls within `200px` of the bottom of the list (infinite scroll pattern).
- **Loading indicator**: Display **3 skeleton card rows** (grey animated pulse) while the next page is fetching. Never show a blank space.
- **Total count**: Display a lightweight count label at the top of the list (e.g., `Showing 20 of 84 leads`). The total count is fetched as a separate `COUNT(*)` query and cached for the current filter session.

### Activity / Audit Trail Feeds

- **Page size**: `30` rows per page (controlled by `ACTIVITY_PAGE_SIZE` constant).
- **Loading strategy**: Same cursor-based infinite scroll as lead lists.
- **Display**: Newest entries appear at the top. Oldest entries load as the user scrolls down.

### Notification Center

- **Initial load**: Always load the **most recent 20 unread notifications** on page open.
- **Read notifications**: Load separately below unread, limited to 30, on a "Show older" tap button.
- **Real-time**: New notifications prepend to the top of the list via Supabase Realtime. Do not reload the full list on each new notification.

### Search Behavior

- **Debounce**: Search inputs must debounce at **`350ms`** before firing a query to avoid flooding the store on every keystroke.
- **Scope**: All search in the Lead List is **client-side** for the prototype (filtering the in-memory store). In production (Supabase), the search must use `ilike` queries with normalized text.
- **Minimum characters**: Search activates after **2 characters** are typed. Below 2 characters, the full list is shown.

---

## Default Sort Orders

Every list screen must have an explicitly defined default sort order. Developers must never leave sort order to chance.

| Screen                             | Default Sort                                                              | Tiebreaker                                        |
| :--------------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------ |
| **My Leads / All Leads**           | `updated_at DESC` (most recently updated first)                           | `created_at DESC`                                 |
| **Workflow Board columns**         | `stage_entered_at ASC` (longest in stage first)                           | `full_name ASC`                                   |
| **Dashboard Priority Section**     | Urgency rank (Reservation Expiry → CRF Expiry → Stagnant → Documentation) | `stage_entered_at ASC`                            |
| **Notifications**                  | `created_at DESC` (newest first), unread before read                      | —                                                 |
| **Audit Trail / Activity History** | `created_at DESC` (newest first)                                          | —                                                 |
| **Leaderboard**                    | `total_verified_value DESC`                                               | `closed_sale_count DESC`, then `display_name ASC` |
| **Team Page (Manager)**            | `display_name ASC` (alphabetical)                                         | `created_at ASC`                                  |
| **Stage Reversion Inbox**          | `created_at DESC` (most recent request first)                             | —                                                 |
| **Appointments / Schedule List**   | `starts_at ASC` (soonest first)                                           | —                                                 |
| **Links Library**                  | Grouped by `category`, then `label ASC` within each group                 | —                                                 |
| **Broadcast History**              | `created_at DESC` (most recent broadcast first)                           | —                                                 |

> [!NOTE]
> Managers can apply an additional **"Sort By" control** on the All Leads screen to override the default (options: Date Added, Last Updated, Name A–Z, Stage). This preference is persisted in `localStorage` per user session.

---

## Error States & Network Failure Handling

Every screen that fetches data must have a defined error state so developers never ship a broken blank panel. Error states follow a consistent pattern: a warning icon, a short descriptive message, and a **`[ 🔄 Try Again ]`** button that retries the last failed request.

### Standard Error State Template

```
┌──────────────────────────────────────┐
│           ⚠️                          │
│   Couldn't load your leads.           │
│   Check your connection and retry.    │
│                                       │
│         [ 🔄 Try Again ]              │
└──────────────────────────────────────┘
```

### Error State Definitions Per Screen

| Screen                              | Error Message                                                            |
| :---------------------------------- | :----------------------------------------------------------------------- |
| **Lead List (load failure)**        | _"Couldn't load leads. Check your connection and try again."_            |
| **Lead Detail (load failure)**      | _"Couldn't load this client's details. Try again."_                      |
| **Workflow Board (load failure)**   | _"Pipeline couldn't load. Check your connection."_                       |
| **Dashboard (load failure)**        | _"Dashboard data is unavailable. Pull to refresh."_                      |
| **Notifications (load failure)**    | _"Notifications unavailable right now."_                                 |
| **Reports (load failure)**          | _"Report data couldn't be loaded. Try a different date range or retry."_ |
| **File Upload (computation sheet)** | _"Upload failed. File must be PDF, PNG, or JPG and under 10MB."_         |
| **Stage Transition (save failure)** | _"Stage update failed. Your changes were not saved. Please retry."_      |
| **Broadcast send failure**          | _"Broadcast couldn't be sent. Check your connection and try again."_     |

### Offline Behavior

- When the device loses network connectivity, a **persistent slim banner** appears at the top of the screen: `📡 You're offline — changes will sync when reconnected.` (Amber background, dark text).
- The banner auto-dismisses when connectivity is restored and sync completes.
- Read operations (viewing lead details, browsing the workflow board) should still work using cached data from the last successful load.
- Write operations (stage changes, adding notes) are queued in the offline store and synced on reconnection, subject to the Optimistic Locking conflict resolution flow defined in the Design Approach section.

---

## PWA Technical Specification

The application must be installable as a **Progressive Web App (PWA)** on Android and iOS home screens. The following implementation requirements must be met.

### `manifest.json` Required Fields

```json
{
  "name": "Team Tenacious CRM",
  "short_name": "Tenacious",
  "description": "CRM for Team Tenacious — manage leads, pipeline, and team performance.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#069494",
  "background_color": "#111827",
  "icons": [
    { "src": "/public/assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/public/assets/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/public/assets/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Service Worker Caching Strategy

| Asset Type                                                   | Caching Strategy           | Notes                                                            |
| :----------------------------------------------------------- | :------------------------- | :--------------------------------------------------------------- |
| **App shell** (HTML, CSS, JS bundles)                        | **Cache First**            | Served from cache instantly; updated in background on next visit |
| **API / store data** (lead lists, dashboard)                 | **Network First**          | Fetches fresh data; falls back to cached version if offline      |
| **Static media** (profile photos, project computation files) | **Stale While Revalidate** | Show cached image immediately; fetch update silently             |
| **Auth tokens / session**                                    | **Never cached**           | Always validated live against Supabase Auth                      |

### Push Notifications (Web Push API)

- The app registers a **service worker** and requests push notification permission on first login.
- Push messages are delivered via the **Web Push API** using VAPID (Voluntary Application Server Identification) keys stored as environment variables on Netlify.
- **VAPID keys** must be generated once per deployment and stored in:
  - `VITE_VAPID_PUBLIC_KEY` — injected into the frontend bundle.
  - `VAPID_PRIVATE_KEY` — stored only on the Netlify server/function, never in the frontend.
- **iOS note**: PWA push notifications on iOS require Safari 16.4+ and the user must first install the app to their Home Screen before push permission is requestable. The app must detect this state and display a prompt: _"Add this app to your Home Screen to enable push notifications on iOS."_
- **Permission Denied Fallback**: If push permission is denied, Layers 1 (badge counter) and 2 (in-app toast) remain fully functional as defined in the Notification Delivery System section.

### `netlify.toml` Required Configuration

```toml
[[redirects]]
  from = "/*"
  to   = "/index.html"
  status = 200

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
    Cache-Control = "public, max-age=86400"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"
```

---

## Accessibility Standards (WCAG AA)

The application must meet **WCAG 2.1 Level AA** accessibility standards. These are the minimum requirements for a production-ready web app used daily by a team on mobile and desktop.

### Color Contrast Requirements

All text and interactive element color combinations must meet a minimum contrast ratio of **4.5:1** (normal text) or **3:1** (large text / icons).

| Use Case            | Foreground | Background | Ratio Target                 |
| :------------------ | :--------- | :--------- | :--------------------------- |
| Body text on canvas | `#111827`  | `#F9FAFB`  | ≥ 4.5:1 ✅                   |
| Primary button text | `#FFFFFF`  | `#069494`  | ≥ 3:1 (large/bold text only) |
| Warning badge text  | `#854D0E`  | `#FEF9C3`  | ≥ 4.5:1 ✅                   |
| Error badge text    | `#B91C1C`  | `#FEE2E2`  | ≥ 4.5:1 ✅                   |
| Sidebar nav text    | `#E5E7EB`  | `#111827`  | ≥ 4.5:1 ✅                   |

> [!WARNING]
> White text on the primary teal `#069494` measures ≈ 3.7:1 and only passes WCAG AA for **large text** (≥ 18.66px bold or ≥ 24px regular). The button standard (16px / weight 600) does not qualify as large text, so primary buttons with standard labels must use the darker hover teal `#047A7A` (≈ 5.2:1, passes AA normal text) as their **fill** wherever strict AA compliance is required, or increase the label to 19px bold. Always verify final contrast ratios using a tool like the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) after applying the design system.

### Interactive Element Requirements

- **Minimum touch target size**: `44×44px` for all tappable elements on mobile (buttons, nav tabs, card rows). This is already required in the Design Approach section and is an accessibility rule as well.
- **Focus indicators**: All interactive elements (buttons, links, inputs, dropdowns) must have a visible focus ring when navigated via keyboard. Use: `outline: 2px solid #069494; outline-offset: 2px;`
- **No focus trap (except modals)**: Keyboard focus must flow naturally through the page. The only acceptable focus trap is inside an open modal or bottom sheet, where Tab must cycle within the modal until it is dismissed.

### ARIA Labels for Icon-Only Buttons

Every button that contains only an icon (no visible text label) must include an `aria-label` attribute.

| Button                     | Required `aria-label`       |
| :------------------------- | :-------------------------- |
| `(+)` FAB center button    | `"Open quick actions menu"` |
| Profile avatar (top right) | `"Open profile menu"`       |
| Notification bell          | `"View notifications"`      |
| Call client button (`📞`)  | `"Call [client name]"`      |
| Edit lead button           | `"Edit lead"`               |
| Delete / trash button      | `"Move lead to trash"`      |
| Close modal button         | `"Close"`                   |
| Broadcast send button      | `"Send broadcast message"`  |

### Semantic HTML Requirements

- Use a single `<h1>` per page matching the page title (e.g., `<h1>My Leads</h1>`).
- Navigation landmark: The bottom nav bar must be wrapped in `<nav aria-label="Main navigation">`.
- List views: Lead card lists must use `<ul>` / `<li>` elements (not `<div>` stacks) so screen readers announce the item count.
- Form inputs: Every `<input>` and `<select>` must have an associated `<label>` (visible or `aria-label`).
- Modal dialogs: Use `role="dialog"` and `aria-modal="true"` with `aria-labelledby` pointing to the modal title.

### Reduced Motion Support

All CSS animations and transitions must respect the user's system preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This disables all micro-animations (typing effect, fade transitions, pulse skeletons) for users who have enabled "Reduce Motion" in their device accessibility settings.
