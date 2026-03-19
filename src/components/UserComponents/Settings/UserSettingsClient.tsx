"use client";

import { useMemo, useState } from "react";
import { CreditCard, Shield, Soup, TriangleAlert, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UserSettingsData } from "@/types/UserSettings";
import AccountSettingsSection from "./sections/AccountSettingsSection";
import DangerZoneSettingsSection from "./sections/DangerZoneSettingsSection";
import FinanceSettingsSection from "./sections/FinanceSettingsSection";
import MealPreferencesSection from "./sections/MealPreferencesSection";
import MyMessSettingsSection from "./sections/MyMessSettingsSection";

type SettingsSectionId =
  | "account"
  | "my-mess"
  | "finance"
  | "meal-preferences"
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
        description: "Profile, password, and notification preferences",
      },
    ],
  },
  {
    title: "Participation",
    items: [
      {
        id: "my-mess",
        label: "My Mess",
        icon: Users,
        description: "Mess information and current members",
      },
      {
        id: "finance",
        label: "Finance",
        icon: CreditCard,
        description: "Deposits and deposit requests",
      },
      {
        id: "meal-preferences",
        label: "Meal Preferences",
        icon: Soup,
        description: "Personal meal defaults and reminders",
      },
      {
        id: "danger-zone",
        label: "Danger Zone",
        icon: TriangleAlert,
        description: "Leave the mess or delete your account",
      },
    ],
  },
];

export default function UserSettingsClient({
  data,
}: {
  data: UserSettingsData;
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
        <CardHeader className="space-y-4 pb-4">
          <div className="rounded-2xl border border-border bg-background/70 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-sm font-semibold text-primary">
                  MM
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Mess Name
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {data.mess.messName}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                User
              </span>
            </div>
          </div>
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
        {activeSection === "my-mess" && (
          <MyMessSettingsSection mess={data.mess} members={data.members} />
        )}
        {activeSection === "finance" && (
          <FinanceSettingsSection
            mess={data.mess}
            deposits={data.deposits}
            depositRequests={data.depositRequests}
          />
        )}
        {activeSection === "meal-preferences" && (
          <MealPreferencesSection
            mess={data.mess}
            preferences={data.user.mealPreferences}
          />
        )}
        {activeSection === "danger-zone" && (
          <DangerZoneSettingsSection messName={data.mess.messName} />
        )}
      </div>
    </div>
  );
}
