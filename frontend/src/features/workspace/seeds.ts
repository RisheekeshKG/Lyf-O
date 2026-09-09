/** Initial content for the fixed workspace pages, mirroring the Stitch design. */

export const WORK_TASKS_FILE = "work_tasks.json";
export const ROADMAP_FILE = "product_roadmap.json";
export const WEEKLY_NOTES_FILE = "weekly_notes.json";

/** These have dedicated routes, so the sidebar must not list them again under Private. */
export const MANAGED_FILES = new Set([WORK_TASKS_FILE, ROADMAP_FILE, WEEKLY_NOTES_FILE]);

export const seedWorkTasks = () => ({
  name: "Work Tasks",
  type: "board",
  columns: [
    {
      name: "Backlog",
      tasks: [
        { title: "Mobile viewport split ergonomics", description: "Implement state reconciliation via CRDTs for collaborative editing." },
        { title: "Offline sync conflict resolution", description: "Queue mutations locally and replay on reconnect." },
        { title: "Telemetry & error monitoring setup", description: "Wire structured logging into the local datastore." },
      ],
    },
    {
      name: "In Progress",
      tasks: [
        { title: "Design system token audit", description: "Validate semantic naming conventions against Figma variables." },
        { title: "Execution strategy & roadmap review", description: "Align quarterly deliverables with platform migration deadlines." },
      ],
    },
    {
      name: "In Review",
      tasks: [
        { title: "User onboarding interview synthesis", description: "Separate onboarding friction points into primary themes." },
      ],
    },
    {
      name: "Done",
      tasks: [
        { title: "Refactor navigation & window shell", description: "Integrated macOS window frame, traffic lights and collapsible sidebar." },
        { title: "Workspace theme variable architecture", description: "Warm minimalist palette wired through design tokens." },
      ],
    },
  ],
});

export const seedRoadmap = () => ({
  name: "Product Roadmap",
  type: "table",
  columns: [
    { name: "Milestone", type: "text" },
    { name: "Owner", type: "text" },
    { name: "Status", type: "options", options: ["Planned", "In Progress", "Shipped", "Blocked"] },
    { name: "Target Date", type: "date" },
  ],
  values: [
    ["Design system modernization", "Sarah Lin", "In Progress", ""],
    ["Local-first datastore architecture", "Devon Vance", "In Progress", ""],
    ["lyf-O intelligence & context copilot", "Alex Morgan", "Planned", ""],
    ["Multi-seat realtime collaboration", "Sarah Lin", "Planned", ""],
  ],
});

export const seedWeeklyNotes = () => ({
  name: "Weekly Notes",
  type: "document",
  content: `# Weekly Notes & Sprint Retrospective

## Executive Summary

Over the past week, the squad closed a set of planned tickets, with two regressions
tracked to production. The prioritised focus was reducing cold-start latency and
finalising the deferred token contract across all high-velocity surfaces.

## Key Accomplishments

- **Finished comms pipeline** — reduced mean-to-render from 11.4ms to 5.4ms.
- **Refactor navigation & window shell** — integrated native window chrome.
- **Design system token audit** — semantic naming aligned with design variables.

## Blockers & Risks

- Multi-seat conflict resolution still needs a deterministic merge strategy.
- Local datastore migration path is undocumented for existing installs.

## Decisions Log

| Decision | Owner | Status |
| --- | --- | --- |
| Adopt CRDT for collaborative edits | Devon Vance | Accepted |
| Warm minimalist palette as default theme | Sarah Lin | Accepted |
| Defer mobile shell to next quarter | Alex Morgan | Accepted |

## Next Week

Ship a synthetic test-plan covering cold-start latency across simulated
concurrent sessions.
`,
  lastEdited: new Date().toISOString(),
});
