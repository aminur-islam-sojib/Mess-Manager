"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Soup } from "lucide-react";
import { toast } from "sonner";
import { updateMealPreferences } from "@/actions/server/UserSettings";
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
import type { UserMealPreferences, UserMessInfo } from "@/types/UserSettings";

export default function MealPreferencesSection({
  mess,
  preferences,
}: {
  mess: UserMessInfo;
  preferences: UserMealPreferences;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mealPreferences, setMealPreferences] = useState(preferences);

  const savePreferences = () => {
    startTransition(async () => {
      const result = await updateMealPreferences(mealPreferences);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Soup className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Meal Preferences</CardTitle>
            <CardDescription>
              Set personal defaults that help you keep meal entry consistent.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-border bg-background/70 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium text-foreground">Meal tracking status</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your current mess tracking system is{" "}
                {mess.mealTrackingEnabled ? "active" : "paused"}.
              </p>
            </div>
            <Badge variant={mess.mealTrackingEnabled ? "default" : "outline"}>
              {mess.mealTrackingEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default-meal-count">Default Meal Count</Label>
            <Input
              id="default-meal-count"
              type="number"
              min="0"
              value={String(mealPreferences.defaultMealCount)}
              onChange={(event) =>
                setMealPreferences((current) => ({
                  ...current,
                  defaultMealCount: Number(event.target.value || 0),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Mess default: {mess.messDefaultMealCount}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Meal Reminder Notifications</Label>
            <button
              type="button"
              onClick={() =>
                setMealPreferences((current) => ({
                  ...current,
                  reminderEnabled: !current.reminderEnabled,
                }))
              }
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-left"
            >
              <div>
                <p className="font-medium text-foreground">
                  Reminder notifications
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Toggle personal reminders for meal entry activity.
                </p>
              </div>
              <Badge variant={mealPreferences.reminderEnabled ? "default" : "outline"}>
                {mealPreferences.reminderEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </button>
          </div>
        </div>

        <Button
          onClick={savePreferences}
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Meal Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
