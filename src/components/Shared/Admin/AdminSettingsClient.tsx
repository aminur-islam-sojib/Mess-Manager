"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Bell,
  FileText,
  Loader2,
  Save,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import {
  saveAdminSettingsAll,
  updateAdminSettingsSection,
} from "@/actions/server/AdminSettings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  AdminSettings,
  AdminSettingsSection,
} from "@/types/AdminSettings";
import AdminProfileSection, {
  type AdminOwnProfile,
} from "./AdminProfileSection";

type SettingsSectionId = "account" | AdminSettingsSection;

const SETTINGS_SECTION_META: Array<{
  id: AdminSettingsSection;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "security",
    title: "Security & Access",
    description: "Session, MFA, whitelist, and sensitive-action controls.",
    icon: Shield,
  },
  {
    id: "finance",
    title: "Financial Policy",
    description: "Global limits and auto-approval boundaries.",
    icon: SlidersHorizontal,
  },
  {
    id: "audit",
    title: "Audit & Compliance",
    description: "Retention, export preferences, and event coverage.",
    icon: FileText,
  },
  {
    id: "notifications",
    title: "Admin Alerts",
    description: "Threshold-based operations and risk notifications.",
    icon: Bell,
  },
  {
    id: "rollout",
    title: "Feature Rollout",
    description: "Controlled release and emergency kill switch.",
    icon: Sparkles,
  },
];

const NAV_GROUPS: Array<{
  title: string;
  items: Array<{
    id: SettingsSectionId;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}> = [
  {
    title: "Account",
    items: [
      {
        id: "account",
        title: "Profile Settings",
        description: "Manage your own profile photo and contact details.",
        icon: UserRound,
      },
    ],
  },
  {
    title: "Governance",
    items: SETTINGS_SECTION_META,
  },
];

function ToggleButtonGroup({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={value ? "default" : "outline"}
          onClick={() => onChange(true)}
        >
          Enabled
        </Button>
        <Button
          type="button"
          size="sm"
          variant={!value ? "secondary" : "outline"}
          onClick={() => onChange(false)}
        >
          Disabled
        </Button>
      </div>
    </div>
  );
}

function sectionDirty(
  base: AdminSettings,
  draft: AdminSettings,
  section: AdminSettingsSection,
) {
  return JSON.stringify(base[section]) !== JSON.stringify(draft[section]);
}

export default function AdminSettingsClient({
  initialSettings,
  profile,
  profileError,
}: {
  initialSettings: AdminSettings;
  profile: AdminOwnProfile | null;
  profileError: string | null;
}) {
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("account");
  const [baseSettings, setBaseSettings] = useState(initialSettings);
  const [draftSettings, setDraftSettings] = useState(initialSettings);
  const [changeReason, setChangeReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const dirtyMap = useMemo(() => {
    return SETTINGS_SECTION_META.reduce(
      (acc, section) => {
        acc[section.id] = sectionDirty(baseSettings, draftSettings, section.id);
        return acc;
      },
      {} as Record<AdminSettingsSection, boolean>,
    );
  }, [baseSettings, draftSettings]);

  const hasDirty = useMemo(
    () => Object.values(dirtyMap).some(Boolean),
    [dirtyMap],
  );

  const activeSectionMeta = useMemo(
    () =>
      NAV_GROUPS.flatMap((group) => group.items).find(
        (item) => item.id === activeSection,
      ),
    [activeSection],
  );

  useEffect(() => {
    if (!hasDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasDirty]);

  const persistSection = (section: AdminSettingsSection) => {
    startTransition(async () => {
      const result = await updateAdminSettingsSection({
        section,
        payload: draftSettings[section],
        expectedVersion: baseSettings.version,
        reason: changeReason,
      });

      if (!result.success || !result.settings) {
        toast.error(result.message);
        return;
      }

      setBaseSettings(result.settings);
      setDraftSettings(result.settings);
      setChangeReason("");
      toast.success(result.message);
    });
  };

  const persistAll = () => {
    startTransition(async () => {
      const result = await saveAdminSettingsAll({
        settings: draftSettings,
        expectedVersion: baseSettings.version,
        reason: changeReason,
      });

      if (!result.success || !result.settings) {
        toast.error(result.message);
        return;
      }

      setBaseSettings(result.settings);
      setDraftSettings(result.settings);
      setChangeReason("");
      toast.success(result.message);
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 ">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Admin Governance
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          Platform Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure global policy controls with section-level save and a safety
          net global save bar.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Version {baseSettings.version}</Badge>
          <Badge variant="outline">
            Updated {new Date(baseSettings.updatedAt).toLocaleString()}
          </Badge>
          {baseSettings.updatedBy?.name ? (
            <Badge variant="outline">By {baseSettings.updatedBy.name}</Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit rounded-2xl border-border shadow-sm lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Sections</CardTitle>
            <CardDescription>
              Saved state is shown per section for fast navigation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {group.title}
                </p>
                <div className="space-y-2">
                  {group.items.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    const isDirty =
                      section.id === "account" ? false : dirtyMap[section.id];

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          "w-full rounded-xl border p-3 text-left transition-all",
                          isActive
                            ? "border-primary/40 bg-primary/10"
                            : "border-border bg-background hover:border-primary/20",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <p className="font-medium text-foreground">
                              {section.title}
                            </p>
                          </div>
                          <Badge
                            variant={
                              section.id === "account"
                                ? "outline"
                                : isDirty
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {section.id === "account"
                              ? "Profile"
                              : isDirty
                                ? "Unsaved"
                                : "Saved"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {section.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-background/70 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Active Panel
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {activeSectionMeta?.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeSectionMeta?.description}
            </p>
          </div>

          {activeSection === "account" &&
            (profile ? (
              <AdminProfileSection profile={profile} />
            ) : (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {profileError || "Failed to load admin profile"}
              </div>
            ))}

          {activeSection === "security" && (
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader>
                <CardTitle>Security & Access Controls</CardTitle>
                <CardDescription>
                  Harden admin sign-in and protect sensitive moderation actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">
                      Admin session timeout (minutes)
                    </Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      min={15}
                      max={240}
                      value={draftSettings.security.adminSessionTimeoutMinutes}
                      onChange={(event) =>
                        setDraftSettings((current) => ({
                          ...current,
                          security: {
                            ...current.security,
                            adminSessionTimeoutMinutes: Number(
                              event.target.value || 0,
                            ),
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <ToggleButtonGroup
                  label="Require MFA for admins"
                  value={draftSettings.security.requireMfaForAdmins}
                  onChange={(next) =>
                    setDraftSettings((current) => ({
                      ...current,
                      security: {
                        ...current.security,
                        requireMfaForAdmins: next,
                      },
                    }))
                  }
                />

                <ToggleButtonGroup
                  label="IP whitelist enforcement"
                  value={draftSettings.security.ipWhitelistEnabled}
                  onChange={(next) =>
                    setDraftSettings((current) => ({
                      ...current,
                      security: {
                        ...current.security,
                        ipWhitelistEnabled: next,
                      },
                    }))
                  }
                />

                <div className="space-y-2">
                  <Label htmlFor="ip-whitelist">
                    IP whitelist entries (one CIDR/IP per line)
                  </Label>
                  <Textarea
                    id="ip-whitelist"
                    value={draftSettings.security.ipWhitelist.join("\n")}
                    onChange={(event) =>
                      setDraftSettings((current) => ({
                        ...current,
                        security: {
                          ...current.security,
                          ipWhitelist: event.target.value
                            .split(/\n|,/)
                            .map((entry) => entry.trim())
                            .filter(Boolean),
                        },
                      }))
                    }
                    placeholder="192.168.1.0/24"
                  />
                </div>

                <ToggleButtonGroup
                  label="Strict confirm for sensitive actions"
                  value={draftSettings.security.strictSensitiveActionConfirm}
                  onChange={(next) =>
                    setDraftSettings((current) => ({
                      ...current,
                      security: {
                        ...current.security,
                        strictSensitiveActionConfirm: next,
                      },
                    }))
                  }
                />

                <SectionActions
                  isPending={isPending}
                  isDirty={dirtyMap.security}
                  onSave={() => persistSection("security")}
                  onReset={() =>
                    setDraftSettings((current) => ({
                      ...current,
                      security: baseSettings.security,
                    }))
                  }
                />
              </CardContent>
            </Card>
          )}

          {activeSection === "finance" && (
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader>
                <CardTitle>Financial Policy</CardTitle>
                <CardDescription>
                  Set platform-wide defaults for expense and request behavior.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldNumber
                    label="Max single expense amount"
                    value={draftSettings.finance.maxSingleExpenseAmount}
                    onChange={(value) =>
                      setDraftSettings((current) => ({
                        ...current,
                        finance: {
                          ...current.finance,
                          maxSingleExpenseAmount: value,
                        },
                      }))
                    }
                  />
                  <FieldNumber
                    label="Receipt required above"
                    value={draftSettings.finance.requireReceiptAbove}
                    onChange={(value) =>
                      setDraftSettings((current) => ({
                        ...current,
                        finance: {
                          ...current.finance,
                          requireReceiptAbove: value,
                        },
                      }))
                    }
                  />
                  <FieldNumber
                    label="Auto-approve below"
                    value={draftSettings.finance.autoApproveBelow}
                    onChange={(value) =>
                      setDraftSettings((current) => ({
                        ...current,
                        finance: {
                          ...current.finance,
                          autoApproveBelow: value,
                        },
                      }))
                    }
                  />
                  <FieldNumber
                    label="Pending request expiry (days)"
                    value={draftSettings.finance.pendingRequestExpiryDays}
                    onChange={(value) =>
                      setDraftSettings((current) => ({
                        ...current,
                        finance: {
                          ...current.finance,
                          pendingRequestExpiryDays: value,
                        },
                      }))
                    }
                  />
                </div>

                <SectionActions
                  isPending={isPending}
                  isDirty={dirtyMap.finance}
                  onSave={() => persistSection("finance")}
                  onReset={() =>
                    setDraftSettings((current) => ({
                      ...current,
                      finance: baseSettings.finance,
                    }))
                  }
                />
              </CardContent>
            </Card>
          )}

          {activeSection === "audit" && (
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader>
                <CardTitle>Audit & Compliance</CardTitle>
                <CardDescription>
                  Control data retention and audit export behavior.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldNumber
                  label="Retention days"
                  value={draftSettings.audit.retentionDays}
                  onChange={(value) =>
                    setDraftSettings((current) => ({
                      ...current,
                      audit: { ...current.audit, retentionDays: value },
                    }))
                  }
                />

                <div className="space-y-2">
                  <Label>Export format</Label>
                  <Select
                    value={draftSettings.audit.exportFormat}
                    onValueChange={(value: "json" | "csv") =>
                      setDraftSettings((current) => ({
                        ...current,
                        audit: { ...current.audit, exportFormat: value },
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ToggleButtonGroup
                  label="Log security events"
                  value={draftSettings.audit.logSecurityEvents}
                  onChange={(next) =>
                    setDraftSettings((current) => ({
                      ...current,
                      audit: { ...current.audit, logSecurityEvents: next },
                    }))
                  }
                />
                <ToggleButtonGroup
                  label="Log role changes"
                  value={draftSettings.audit.logRoleChanges}
                  onChange={(next) =>
                    setDraftSettings((current) => ({
                      ...current,
                      audit: { ...current.audit, logRoleChanges: next },
                    }))
                  }
                />
                <ToggleButtonGroup
                  label="Log financial events"
                  value={draftSettings.audit.logFinancialEvents}
                  onChange={(next) =>
                    setDraftSettings((current) => ({
                      ...current,
                      audit: { ...current.audit, logFinancialEvents: next },
                    }))
                  }
                />

                <SectionActions
                  isPending={isPending}
                  isDirty={dirtyMap.audit}
                  onSave={() => persistSection("audit")}
                  onReset={() =>
                    setDraftSettings((current) => ({
                      ...current,
                      audit: baseSettings.audit,
                    }))
                  }
                />
              </CardContent>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader>
                <CardTitle>Admin Alerts</CardTitle>
                <CardDescription>
                  Tune threshold alerts so admin response stays proactive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldNumber
                  label="High value expense threshold"
                  value={draftSettings.notifications.highValueExpenseThreshold}
                  onChange={(value) =>
                    setDraftSettings((current) => ({
                      ...current,
                      notifications: {
                        ...current.notifications,
                        highValueExpenseThreshold: value,
                      },
                    }))
                  }
                />
                <FieldNumber
                  label="Moderation activity alert threshold"
                  value={draftSettings.notifications.moderationAlertThreshold}
                  onChange={(value) =>
                    setDraftSettings((current) => ({
                      ...current,
                      notifications: {
                        ...current.notifications,
                        moderationAlertThreshold: value,
                      },
                    }))
                  }
                />
                <ToggleButtonGroup
                  label="Notify when mess is archived"
                  value={draftSettings.notifications.messArchivalAlert}
                  onChange={(next) =>
                    setDraftSettings((current) => ({
                      ...current,
                      notifications: {
                        ...current.notifications,
                        messArchivalAlert: next,
                      },
                    }))
                  }
                />

                <SectionActions
                  isPending={isPending}
                  isDirty={dirtyMap.notifications}
                  onSave={() => persistSection("notifications")}
                  onReset={() =>
                    setDraftSettings((current) => ({
                      ...current,
                      notifications: baseSettings.notifications,
                    }))
                  }
                />
              </CardContent>
            </Card>
          )}

          {activeSection === "rollout" && (
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader>
                <CardTitle>Feature Rollout Controls</CardTitle>
                <CardDescription>
                  Manage controlled feature exposure and emergency stop
                  behavior.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleButtonGroup
                  label="Enable beta features"
                  value={draftSettings.rollout.enableBetaFeatures}
                  onChange={(next) =>
                    setDraftSettings((current) => ({
                      ...current,
                      rollout: {
                        ...current.rollout,
                        enableBetaFeatures: next,
                      },
                    }))
                  }
                />
                <FieldNumber
                  label="Rollout percentage"
                  value={draftSettings.rollout.rolloutPercent}
                  onChange={(value) =>
                    setDraftSettings((current) => ({
                      ...current,
                      rollout: {
                        ...current.rollout,
                        rolloutPercent: value,
                      },
                    }))
                  }
                />
                <ToggleButtonGroup
                  label="Emergency kill switch"
                  value={draftSettings.rollout.killSwitch}
                  onChange={(next) =>
                    setDraftSettings((current) => ({
                      ...current,
                      rollout: {
                        ...current.rollout,
                        killSwitch: next,
                      },
                    }))
                  }
                />

                <SectionActions
                  isPending={isPending}
                  isDirty={dirtyMap.rollout}
                  onSave={() => persistSection("rollout")}
                  onReset={() =>
                    setDraftSettings((current) => ({
                      ...current,
                      rollout: baseSettings.rollout,
                    }))
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {hasDirty && (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[min(920px,calc(100%-2rem))] rounded-2xl border border-primary/30 bg-background/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Unsaved changes across{" "}
                {Object.values(dirtyMap).filter(Boolean).length} section(s)
              </p>
              <p className="text-xs text-muted-foreground">
                Save now to apply platform policy updates with audit history.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <Input
                value={changeReason}
                onChange={(event) => setChangeReason(event.target.value)}
                placeholder="Optional reason for audit trail"
                className="sm:w-72"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraftSettings(baseSettings)}
                disabled={isPending}
              >
                Discard All
              </Button>
              <Button type="button" onClick={persistAll} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
      />
    </div>
  );
}

function SectionActions({
  isPending,
  isDirty,
  onSave,
  onReset,
}: {
  isPending: boolean;
  isDirty: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
      <Button type="button" onClick={onSave} disabled={!isDirty || isPending}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Section
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        disabled={!isDirty || isPending}
      >
        Revert Section
      </Button>
    </div>
  );
}
