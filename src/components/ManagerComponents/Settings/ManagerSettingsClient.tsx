"use client";

import { useMemo, useState } from "react";
import { Bell, CreditCard, Shield, Skull, Soup, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ManagerSettingsData } from "@/types/ManagerSettings";
import AccountSettingsSection from "./sections/AccountSettingsSection";
import DangerZoneSettingsSection from "./sections/DangerZoneSettingsSection";
import FinanceSettingsSection from "./sections/FinanceSettingsSection";
import MealSystemSettingsSection from "./sections/MealSystemSettingsSection";
import MessManagementSettingsSection from "./sections/MessManagementSettingsSection";
import ReportsSettingsSection from "./sections/ReportsSettingsSection";

type SettingsSectionId =
  | "account"
  | "mess-management"
  | "finance"
  | "meal-system"
  | "reports"
  | "danger-zone";

type SettingsNavGroup = {
  title: string;
  items: Array<{
    id: SettingsSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }>;
};

const NAV_GROUPS: SettingsNavGroup[] = [
  {
    title: "Account",
    items: [
      {
        id: "account",
        label: "Profile & Security",
        icon: Shield,
        description: "Profile, password, and notifications",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        id: "mess-management",
        label: "Mess Management",
        icon: Users,
        description: "Mess profile, members, and invitations",
      },
      {
        id: "finance",
        label: "Finance",
        icon: CreditCard,
        description: "Deposit, expense, and budget controls",
      },
      {
        id: "meal-system",
        label: "Meal System",
        icon: Soup,
        description: "Meal tracking configuration",
      },
      {
        id: "reports",
        label: "Reports",
        icon: Bell,
        description: "Export deposits, expenses, and meals",
      },
      {
        id: "danger-zone",
        label: "Danger Zone",
        icon: Skull,
        description: "Critical mess-level actions",
      },
    ],
  },
];

export default function ManagerSettingsClient({
  data,
}: {
  data: ManagerSettingsData;
}) {
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("account");

  const activeSectionMeta = useMemo(
    () =>
      NAV_GROUPS.flatMap((group) => group.items).find(
        (item) => item.id === activeSection,
      ),
    [activeSection],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="h-fit rounded-3xl border-border/80 shadow-sm lg:sticky lg:top-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {group.title}
              </p>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === activeSection;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                        isActive
                          ? "border-primary/30 bg-primary/10 shadow-sm"
                          : "border-border bg-background hover:border-primary/20 hover:bg-accent/50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 rounded-xl p-2",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
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
            {activeSectionMeta?.label}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeSectionMeta?.description}
          </p>
        </div>

        {activeSection === "account" && (
          <AccountSettingsSection user={data.user} />
        )}
        {activeSection === "mess-management" && (
          <MessManagementSettingsSection
            mess={data.mess}
            members={data.members}
            pendingInvitations={data.pendingInvitations}
          />
        )}
        {activeSection === "finance" && (
          <FinanceSettingsSection mess={data.mess} />
        )}
        {activeSection === "meal-system" && (
          <MealSystemSettingsSection mess={data.mess} />
        )}
        {activeSection === "reports" && (
          <ReportsSettingsSection messName={data.mess.messName} />
        )}
        {activeSection === "danger-zone" && (
          <DangerZoneSettingsSection members={data.members} />
        )}
      </div>
    </div>
  );
}
