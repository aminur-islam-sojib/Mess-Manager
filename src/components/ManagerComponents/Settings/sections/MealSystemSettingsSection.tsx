"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Loader2, Save, Soup } from "lucide-react";
import { toast } from "sonner";
import {
  updateMealDeadline,
  updateMealSettings,
} from "@/actions/server/ManagerSettings";
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
import type { ManagerSettingsMess } from "@/types/ManagerSettings";

export default function MealSystemSettingsSection({
  mess,
}: {
  mess: ManagerSettingsMess;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mealSettings, setMealSettings] = useState({
    enabled: mess.mealSettings.enabled,
    defaultMealCount: String(mess.mealSettings.defaultMealCount),
    calculationMode: mess.mealSettings.calculationMode,
  });
  const [deadline, setDeadline] = useState(mess.mealSettings.deadline);

  const runAction = (action: () => Promise<{ success: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Soup className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Meal Settings</CardTitle>
              <CardDescription>
                Configure how the mess meal tracking system should behave.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background/70 p-4">
            <div>
              <p className="font-medium text-foreground">Meal tracking enabled</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Disable this if you want to temporarily pause meal entry.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setMealSettings((current) => ({
                  ...current,
                  enabled: !current.enabled,
                }))
              }
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium"
            >
              <Badge variant={mealSettings.enabled ? "default" : "outline"}>
                {mealSettings.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <span>{mealSettings.enabled ? "Turn off" : "Turn on"}</span>
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-meal-count">Default Meal Count</Label>
              <Input
                id="default-meal-count"
                type="number"
                min="0"
                value={mealSettings.defaultMealCount}
                onChange={(event) =>
                  setMealSettings((current) => ({
                    ...current,
                    defaultMealCount: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Calculation Mode</Label>
              <Select
                value={mealSettings.calculationMode}
                onValueChange={(value) =>
                  setMealSettings((current) => ({
                    ...current,
                    calculationMode: value as "daily" | "monthly",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select calculation mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() =>
              runAction(() =>
                updateMealSettings({
                  enabled: mealSettings.enabled,
                  defaultMealCount: Number(mealSettings.defaultMealCount || 0),
                  calculationMode: mealSettings.calculationMode,
                }),
              )
            }
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Meal Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Meal Deadline</CardTitle>
              <CardDescription>
                Set the daily cut-off time using the format HH:MM AM/PM.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="meal-deadline">Deadline</Label>
            <Input
              id="meal-deadline"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              placeholder="10:00 PM"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => runAction(() => updateMealDeadline({ deadline }))}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Deadline
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
