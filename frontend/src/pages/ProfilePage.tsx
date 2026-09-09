import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { PageHeader } from "../ui/PageHeader";
import { Panel, PanelHeader } from "../ui/Panel";
import { Button, IconButton } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";
import { Field, SelectInput, TextInput } from "../ui/Field";
import { cn } from "../lib/cn";
import { FOCUS_AREAS, dayProgress } from "../features/profile/personalization";
import { ProgressBar } from "../ui/ProgressBar";
import type { FocusArea, Goal, PersonalProfile, UserProfile } from "../types";

const OCCUPATIONS = [
  "Engineer", "Doctor", "Teacher", "Artist", "Student", "Lawyer", "Chef", "Nurse",
  "Officer", "Developer", "Manager", "Researcher", "Professor", "Consultant",
  "Designer", "Analyst",
];
const GENDERS = ["Male", "Female", "Other"];
const EDUCATION = ["High School", "Bachelor", "Master", "PhD"];
const DEVICES = ["Mobile", "Desktop", "Tablet", "Laptop"];

const EMPTY_LIFESTYLE: UserProfile = {
  age: 0,
  gender: "Male",
  occupation: "Student",
  education_level: "Bachelor",
  device_type: "Mobile",
  daily_usage_hours: 0,
};

export function ProfilePage() {
  const { profile, personal, saveProfile, savePersonal } = useWorkspace();

  const [lifestyle, setLifestyle] = useState<UserProfile>({ ...EMPTY_LIFESTYLE, ...profile });
  const [draft, setDraft] = useState<PersonalProfile>(personal);
  const [newGoal, setNewGoal] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(personal), [personal]);
  useEffect(() => {
    if (profile) setLifestyle({ ...EMPTY_LIFESTYLE, ...profile });
  }, [profile]);

  const dirty = useMemo(
    () =>
      JSON.stringify(draft) !== JSON.stringify(personal) ||
      JSON.stringify(lifestyle) !== JSON.stringify({ ...EMPTY_LIFESTYLE, ...profile }),
    [draft, personal, lifestyle, profile],
  );

  const progress = dayProgress(draft);
  const openGoals = draft.goals.filter((goal) => !goal.done).length;

  const save = () => {
    saveProfile(lifestyle);
    savePersonal(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const setLife = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setLifestyle((current) => ({ ...current, [key]: value }));

  const toggleFocus = (area: FocusArea) =>
    setDraft((current) => ({
      ...current,
      focusAreas: current.focusAreas.includes(area)
        ? current.focusAreas.filter((entry) => entry !== area)
        : [...current.focusAreas, area],
    }));

  const addGoal = () => {
    const label = newGoal.trim();
    if (!label) return;
    const goal: Goal = { id: `goal-${Date.now()}`, label, done: false };
    setDraft((current) => ({ ...current, goals: [...current.goals, goal] }));
    setNewGoal("");
  };

  const patchGoal = (id: string, patch: Partial<Goal>) =>
    setDraft((current) => ({
      ...current,
      goals: current.goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)),
    }));

  const removeGoal = (id: string) =>
    setDraft((current) => ({ ...current, goals: current.goals.filter((g) => g.id !== id) }));

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        eyebrow={
          <>
            <Badge tone="primary">Your profile</Badge>
            {saved && (
              <span className="flex items-center gap-space-2xs font-label-sm text-label-sm text-tertiary">
                <Icon name="check" size={14} />
                Saved
              </span>
            )}
          </>
        }
        title={draft.name.trim() || "Set up your profile"}
        description="Tells lyf-O how to tailor your home page, suggestions and assistant."
        actions={
          <Button variant="primary" icon="save" onClick={save} disabled={!dirty}>
            {dirty ? "Save changes" : "All saved"}
          </Button>
        }
      />

      <div className="grid gap-space-xl xl:grid-cols-[1fr_320px] items-start">
        <div className="flex flex-col gap-space-xl">
          <Panel>
            <PanelHeader icon="person" title="About you" />
            <div className="grid gap-space-xl p-space-xl sm:grid-cols-2">
              <Field label="Your name" hint="Used to greet you on the home page.">
                <TextInput
                  value={draft.name}
                  placeholder="Risheekesh"
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </Field>
              <Field label="Occupation">
                <SelectInput
                  options={OCCUPATIONS}
                  value={lifestyle.occupation}
                  onChange={(event) => setLife("occupation", event.target.value)}
                />
              </Field>
              <Field label="Age">
                <TextInput
                  type="number"
                  min={13}
                  max={120}
                  value={lifestyle.age || ""}
                  onChange={(event) => setLife("age", Number(event.target.value) || 0)}
                />
              </Field>
              <Field label="Gender">
                <SelectInput
                  options={GENDERS}
                  value={lifestyle.gender}
                  onChange={(event) => setLife("gender", event.target.value)}
                />
              </Field>
              <Field label="Education level">
                <SelectInput
                  options={EDUCATION}
                  value={lifestyle.education_level}
                  onChange={(event) => setLife("education_level", event.target.value)}
                />
              </Field>
              <Field label="Main device">
                <SelectInput
                  options={DEVICES}
                  value={lifestyle.device_type}
                  onChange={(event) => setLife("device_type", event.target.value)}
                />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              icon="schedule"
              title="Your day"
              action={
                progress.awake && (
                  <span className="font-label-sm text-label-sm text-on-surface-variant/60">
                    {progress.hoursLeft}h left today
                  </span>
                )
              }
            />
            <div className="p-space-xl">
              <div className="grid gap-space-xl sm:grid-cols-3">
                <Field label="Wake up">
                  <TextInput
                    type="time"
                    value={draft.wakeTime}
                    onChange={(event) => setDraft({ ...draft, wakeTime: event.target.value })}
                  />
                </Field>
                <Field label="Wind down">
                  <TextInput
                    type="time"
                    value={draft.sleepTime}
                    onChange={(event) => setDraft({ ...draft, sleepTime: event.target.value })}
                  />
                </Field>
                <Field label="Screen time / day" hint="Hours on your main device.">
                  <TextInput
                    type="number"
                    step="0.5"
                    min={0}
                    max={24}
                    value={lifestyle.daily_usage_hours || ""}
                    onChange={(event) =>
                      setLife("daily_usage_hours", Number(event.target.value) || 0)
                    }
                  />
                </Field>
              </div>

              <div className="mt-space-xl">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
                    Day progress
                  </span>
                  <span className="font-mono-badge text-mono-badge text-on-surface-variant">
                    {progress.percent}%
                  </span>
                </div>
                <ProgressBar value={progress.percent} />
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              icon="interests"
              title="What you're focusing on"
              count={`${draft.focusAreas.length} selected`}
            />
            <div className="p-space-xl">
              <p className="mb-space-lg font-body-sm text-body-sm text-on-surface-variant/70">
                Shapes your assistant suggestions and which templates get recommended first.
              </p>
              <div className="grid gap-space-sm sm:grid-cols-2 lg:grid-cols-4">
                {FOCUS_AREAS.map((area) => {
                  const active = draft.focusAreas.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      onClick={() => toggleFocus(area.id)}
                      className={cn(
                        "flex flex-col items-start gap-space-xs px-space-base py-space-base rounded-xl border text-left transition-colors",
                        active
                          ? "border-primary-container bg-primary-container/15"
                          : "border-outline-variant/40 hover:border-outline",
                      )}
                    >
                      <Icon
                        name={area.icon}
                        size={18}
                        className={active ? "text-primary" : "text-on-surface-variant/50"}
                      />
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        {area.id}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant/50">
                        {area.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              icon="flag"
              title="Goals"
              count={`${openGoals} open`}
            />

            {draft.goals.length > 0 && (
              <ul>
                {draft.goals.map((goal) => (
                  <li
                    key={goal.id}
                    className="group flex items-center gap-space-base px-space-xl py-space-lg border-b border-outline-variant/15"
                  >
                    <button
                      onClick={() => patchGoal(goal.id, { done: !goal.done })}
                      aria-label={goal.done ? "Mark as not done" : "Mark as done"}
                      className={cn(
                        "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                        goal.done
                          ? "bg-tertiary-container border-tertiary-container text-on-tertiary-container"
                          : "border-outline-variant hover:border-outline text-transparent",
                      )}
                    >
                      <Icon name="check" size={12} />
                    </button>

                    <input
                      value={goal.label}
                      onChange={(event) => patchGoal(goal.id, { label: event.target.value })}
                      className={cn(
                        "flex-1 bg-transparent outline-none font-body-md text-body-md",
                        goal.done
                          ? "text-on-surface-variant/40 line-through"
                          : "text-on-surface",
                      )}
                    />

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton
                        icon="delete"
                        size={14}
                        label="Remove goal"
                        onClick={() => removeGoal(goal.id)}
                        className="hover:text-error"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-space-base p-space-xl">
              <TextInput
                value={newGoal}
                placeholder="Add a goal — read 20 pages a day…"
                onChange={(event) => setNewGoal(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addGoal()}
              />
              <Button variant="secondary" icon="add" onClick={addGoal} disabled={!newGoal.trim()}>
                Add
              </Button>
            </div>
          </Panel>
        </div>

        <Panel className="sticky top-space-3xl">
          <PanelHeader icon="visibility" title="How this is used" />
          <div className="flex flex-col items-center gap-space-base px-space-xl py-space-xl border-b border-outline-variant/20">
            <Avatar name={draft.name.trim() || "You"} size={64} />
            <div className="text-center">
              <p className="font-headline-md text-headline-md text-on-surface">
                {draft.name.trim() || "You"}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant/60">
                {lifestyle.occupation}
                {lifestyle.age ? ` · ${lifestyle.age}` : ""}
              </p>
            </div>
            {draft.focusAreas.length > 0 && (
              <div className="flex flex-wrap justify-center gap-space-xs">
                {draft.focusAreas.map((area) => (
                  <Badge key={area} tone="primary">
                    {area}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <ul className="flex flex-col">
            <UsageRow icon="home" text="Greets you by name and shows how much of your day is left." />
            <UsageRow icon="auto_awesome" text="Assistant starters are written from your focus areas and goals." />
            <UsageRow icon="star" text="Recommended templates matching your focus areas are ranked first." />
            <UsageRow
              icon="lock"
              text="Only age, gender, occupation, education, device and screen time reach the recommendation model. Everything else stays on this device."
            />
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function UsageRow({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex gap-space-base px-space-xl py-space-lg border-b border-outline-variant/15 last:border-0">
      <Icon name={icon} size={16} className="text-on-surface-variant/40 shrink-0 mt-space-2xs" />
      <span className="font-body-sm text-body-sm text-on-surface-variant/70">{text}</span>
    </li>
  );
}
