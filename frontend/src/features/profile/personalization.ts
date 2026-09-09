import type { FocusArea, PersonalProfile } from "../../types";

export const FOCUS_AREAS: { id: FocusArea; icon: string; blurb: string }[] = [
  { id: "Fitness", icon: "fitness_center", blurb: "Movement and training" },
  { id: "Study", icon: "school", blurb: "Courses and revision" },
  { id: "Work", icon: "work", blurb: "Projects and deadlines" },
  { id: "Mindfulness", icon: "self_improvement", blurb: "Focus and reflection" },
  { id: "Finance", icon: "savings", blurb: "Budget and spending" },
  { id: "Creative", icon: "palette", blurb: "Making and writing" },
  { id: "Social", icon: "groups", blurb: "People and plans" },
  { id: "Sleep", icon: "bedtime", blurb: "Rest and recovery" },
];

export const FOCUS_META = Object.fromEntries(
  FOCUS_AREAS.map((area) => [area.id, area]),
) as Record<FocusArea, (typeof FOCUS_AREAS)[number]>;

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export interface DayProgress {
  percent: number;
  hoursLeft: number;
  awake: boolean;
}

/** How far through their waking day the person is, from wake/sleep times. */
export function dayProgress(personal: PersonalProfile, now = new Date()): DayProgress {
  const wake = minutesOf(personal.wakeTime);
  let sleep = minutesOf(personal.sleepTime);
  if (sleep <= wake) sleep += 24 * 60; // past midnight

  const current = now.getHours() * 60 + now.getMinutes();
  const adjusted = current < wake ? current + 24 * 60 : current;

  const span = sleep - wake;
  const elapsed = adjusted - wake;

  if (elapsed < 0 || elapsed > span) {
    return { percent: elapsed < 0 ? 0 : 100, hoursLeft: 0, awake: false };
  }

  return {
    percent: Math.round((elapsed / span) * 100),
    hoursLeft: Math.max(0, Math.round(((span - elapsed) / 60) * 10) / 10),
    awake: true,
  };
}

/** Assistant starters written from the person's own focus areas and goals. */
export function suggestedPrompts(personal: PersonalProfile) {
  const prompts: { icon: string; title: string; detail: string; prompt: string }[] = [];

  for (const area of personal.focusAreas.slice(0, 3)) {
    const meta = FOCUS_META[area];
    prompts.push({
      icon: meta.icon,
      title: `Plan my ${area.toLowerCase()}`,
      detail: `${meta.blurb} — build me a page for it.`,
      prompt: `Create a ${area.toLowerCase()} tracker page for me, with sensible columns and a few starter rows.`,
    });
  }

  const openGoal = personal.goals.find((goal) => !goal.done);
  if (openGoal) {
    prompts.push({
      icon: "flag",
      title: "Break down a goal",
      detail: `"${openGoal.label}" into weekly steps.`,
      prompt: `Break my goal "${openGoal.label}" into a weekly checklist I can actually follow.`,
    });
  }

  return prompts;
}

/** Templates matching a focus area float to the top of the Recommend page. */
export function focusScore(templateName: string, focusAreas: FocusArea[]): number {
  const haystack = templateName.toLowerCase();
  const KEYWORDS: Record<FocusArea, string[]> = {
    Fitness: ["workout", "fitness", "exercise", "gym", "run", "health"],
    Study: ["study", "course", "revision", "exam", "class", "learn", "reading"],
    Work: ["work", "task", "project", "sprint", "meeting", "roadmap"],
    Mindfulness: ["journal", "reflect", "mood", "gratitude", "meditat", "mindful"],
    Finance: ["budget", "expense", "finance", "spend", "saving", "money"],
    Creative: ["idea", "writing", "design", "creative", "sketch", "content"],
    Social: ["social", "friends", "family", "event", "contact", "birthday"],
    Sleep: ["sleep", "rest", "night", "routine", "habit"],
  };

  return focusAreas.reduce(
    (score, area) =>
      score + (KEYWORDS[area].some((word) => haystack.includes(word)) ? 1 : 0),
    0,
  );
}
