import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { DEFAULT_SETTINGS } from "../hooks/useAppSettings";
import { PageHeader } from "../ui/PageHeader";
import { Panel, PanelHeader } from "../ui/Panel";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { Field, SelectInput, TextInput } from "../ui/Field";
import { cn } from "../lib/cn";
import { deriveStats } from "../features/home/workspaceStats";

const SECTIONS = [
  { id: "profile", label: "Workspace Profile", icon: "workspaces" },
  { id: "appearance", label: "Appearance & Theme", icon: "palette" },
  { id: "storage", label: "Storage & Sync", icon: "database" },
  { id: "integrations", label: "Integrations & API", icon: "api" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const ACCENTS = [
  { name: "Terracotta", value: "#e07a5f" },
  { name: "Amber", value: "#ffb786" },
  { name: "Sage", value: "#5edbc1" },
  { name: "Periwinkle", value: "#a5b4fc" },
];

export function SettingsPage() {
  const {
    profile,
    dataFiles,
    personal,
    reload,
    settings,
    updateSettings: update,
    resetSettings: reset,
  } = useWorkspace();
  const navigate = useNavigate();
  const [section, setSection] = useState<SectionId>("profile");

  const stats = deriveStats(dataFiles);
  const isDirty = JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        icon="settings"
        eyebrow={<Badge tone="tertiary">Saved on this device</Badge>}
        title="Settings"
        description="Manage workspace configuration, appearance and personal preferences."
        actions={
          isDirty && (
            <Button variant="outline" icon="restart_alt" onClick={reset}>
              Reset to defaults
            </Button>
          )
        }
      />

      <div className="grid gap-space-xl xl:grid-cols-[240px_1fr] items-start">
        <nav className="flex flex-col gap-space-2xs">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                "flex items-center gap-space-sm px-space-base py-space-sm rounded-lg transition-colors text-left",
                section === item.id
                  ? "bg-surface-container text-on-surface"
                  : "text-on-surface-variant hover:bg-surface-container-low",
              )}
            >
              <Icon name={item.icon} size={16} />
              <span className="font-body-sm text-body-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-space-lg">
          {section === "profile" && (
            <>
              <Panel>
                <PanelHeader icon="badge" title="Workspace Profile" />
                <div className="grid gap-space-lg p-space-xl sm:grid-cols-2">
                  <Field label="Workspace name" hint="Shown in the sidebar and title bar.">
                    <TextInput
                      value={settings.workspaceName}
                      onChange={(event) => update({ workspaceName: event.target.value })}
                    />
                  </Field>
                  <Field label="Your name" hint="Edited on your profile page.">
                    <TextInput value={personal.name} readOnly className="opacity-60" />
                  </Field>
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  icon="person"
                  title="Lifestyle Profile"
                  action={
                    <Button variant="outline" icon="edit" onClick={() => navigate("/profile")}>
                      Edit
                    </Button>
                  }
                />
                {profile ? (
                  <dl className="grid gap-space-lg p-space-xl sm:grid-cols-3">
                    {[
                      ["Age", String(profile.age)],
                      ["Gender", profile.gender],
                      ["Occupation", profile.occupation],
                      ["Education", profile.education_level],
                      ["Device", profile.device_type],
                      ["Daily usage", `${profile.daily_usage_hours} h`],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
                          {label}
                        </dt>
                        <dd className="mt-space-2xs font-body-md text-body-md text-on-surface">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="flex items-center gap-space-base p-space-lg">
                    <Icon name="info" size={18} className="text-secondary" />
                    <p className="flex-1 font-body-sm text-body-sm text-on-surface-variant/70">
                      No profile saved yet — recommendations will be untailored.
                    </p>
                    <Button variant="primary" onClick={() => navigate("/profile")}>
                      Add profile
                    </Button>
                  </div>
                )}
              </Panel>
            </>
          )}

          {section === "appearance" && (
            <Panel>
              <PanelHeader icon="palette" title="Appearance & Theme" />
              <div className="p-space-lg">
                <p className="mb-space-lg font-body-sm text-body-sm text-on-surface-variant/70">
                  Accent applies immediately across every surface in the workspace.
                </p>

                <span className="block mb-space-sm font-label-md text-label-md text-on-surface-variant">
                  Accent chroma
                </span>
                <div className="flex flex-wrap gap-space-sm mb-space-xl">
                  {ACCENTS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => update({ accent: option.value })}
                      className={cn(
                        "flex items-center gap-space-sm px-space-base py-space-sm rounded-lg border transition-colors",
                        settings.accent === option.value
                          ? "border-primary-container bg-primary-container/15"
                          : "border-outline-variant/50 hover:border-outline",
                      )}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.value }}
                      />
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {option.name}
                      </span>
                      {settings.accent === option.value && (
                        <Icon name="check" size={14} className="text-primary" />
                      )}
                    </button>
                  ))}
                </div>

                <Field label="Row density" hint="Affects list and table spacing.">
                  <SelectInput
                    options={["comfortable", "compact"]}
                    value={settings.density}
                    onChange={(event) =>
                      update({ density: event.target.value as "comfortable" | "compact" })
                    }
                  />
                </Field>
              </div>
            </Panel>
          )}

          {section === "storage" && (
            <Panel>
              <PanelHeader
                icon="database"
                title="Storage & Sync"
                action={
                  <Button variant="outline" icon="refresh" onClick={reload}>
                    Rescan
                  </Button>
                }
              />
              <div className="grid gap-space-lg p-space-xl sm:grid-cols-3">
                <Metric label="Pages" value={String(stats.pageCount)} />
                <Metric label="Tasks tracked" value={String(stats.totalTasks)} />
                <Metric label="Completed" value={String(stats.completedTasks)} />
              </div>

              <ul className="px-space-lg pb-space-lg flex flex-col gap-space-xs">
                {dataFiles.slice(0, 6).map((entry) => (
                  <li
                    key={entry.file}
                    className="flex items-center justify-between gap-space-base font-body-sm text-body-sm text-on-surface-variant/70"
                  >
                    <span className="truncate">{entry.name}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant/40 shrink-0">
                      {entry.modified ? new Date(entry.modified).toLocaleString() : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {section === "integrations" && (
            <Panel>
              <PanelHeader icon="api" title="Integrations & API" />
              <div className="flex flex-col">
                <IntegrationRow
                  icon="mail"
                  name="Gmail"
                  detail="Read your email without leaving the workspace."
                  status="Connect in Inbox"
                />
                <IntegrationRow
                  icon="auto_awesome"
                  name="AI Assistant"
                  detail="Answers questions and drafts pages for you."
                  status="Included"
                />
                <IntegrationRow
                  icon="star"
                  name="Recommendations"
                  detail="Suggests page templates that match your lifestyle."
                  status="Included"
                />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
        {label}
      </div>
      <div className="mt-space-xs font-headline-md text-headline-md text-on-surface">{value}</div>
    </div>
  );
}

function IntegrationRow({
  icon,
  name,
  detail,
  status,
}: {
  icon: string;
  name: string;
  detail: string;
  status: string;
}) {
  return (
    <div className="flex items-center gap-space-base px-space-xl py-space-lg border-b border-outline-variant/20 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
        <Icon name={icon} size={18} className="text-on-surface-variant" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline-sm text-headline-sm text-on-surface">{name}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant/60">{detail}</p>
      </div>
      <Badge>{status}</Badge>
    </div>
  );
}
