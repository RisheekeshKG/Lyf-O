import { Link } from "react-router-dom";
import { Panel, PanelHeader } from "../../ui/Panel";
import { Icon } from "../../ui/Icon";
import { Button } from "../../ui/Button";
import { ProgressBar } from "../../ui/ProgressBar";
import { EmptyState } from "../../ui/EmptyState";
import { cn } from "../../lib/cn";
import { FOCUS_META, dayProgress } from "../profile/personalization";
import type { PersonalProfile } from "../../types";

interface FocusPanelProps {
  personal: PersonalProfile;
  onToggleGoal: (id: string) => void;
}

/** Home-page view of the profile: how much day is left, focus areas and goals. */
export function FocusPanel({ personal, onToggleGoal }: FocusPanelProps) {
  const progress = dayProgress(personal);
  const openGoals = personal.goals.filter((goal) => !goal.done);
  const isEmpty = personal.focusAreas.length === 0 && personal.goals.length === 0;

  return (
    <Panel>
      <PanelHeader
        icon="target"
        title="Your focus"
        action={
          <Link
            to="/profile"
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Edit
          </Link>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon="interests"
          title="Tell us what you're working on"
          description="Pick a few focus areas and goals to personalise your workspace."
          action={
            <Link to="/profile">
              <Button variant="primary" icon="person">
                Set up profile
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="px-space-xl py-space-lg border-b border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
                Day progress
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {progress.awake ? `${progress.hoursLeft}h left` : "Off the clock"}
              </span>
            </div>
            <ProgressBar value={progress.percent} />
          </div>

          {personal.focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-space-xs px-space-xl py-space-lg border-b border-outline-variant/20">
              {personal.focusAreas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant"
                >
                  <Icon name={FOCUS_META[area].icon} size={13} className="text-primary" />
                  {area}
                </span>
              ))}
            </div>
          )}

          {personal.goals.length > 0 && (
            <ul>
              {personal.goals.slice(0, 5).map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-center gap-space-base px-space-xl py-space-base border-b border-outline-variant/15 last:border-0"
                >
                  <button
                    onClick={() => onToggleGoal(goal.id)}
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
                  <span
                    className={cn(
                      "font-body-sm text-body-sm truncate",
                      goal.done
                        ? "text-on-surface-variant/40 line-through"
                        : "text-on-surface-variant",
                    )}
                  >
                    {goal.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {openGoals.length === 0 && personal.goals.length > 0 && (
            <p className="px-space-xl py-space-lg font-body-sm text-body-sm text-tertiary">
              Every goal is done. Time to set a new one.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
