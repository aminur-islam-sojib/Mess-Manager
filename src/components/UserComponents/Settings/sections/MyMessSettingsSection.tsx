"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserMessInfo, UserMessMember } from "@/types/UserSettings";
import { Building2, MapPin, ShieldCheck, Users } from "lucide-react";

export default function MyMessSettingsSection({
  mess,
  members,
}: {
  mess: UserMessInfo;
  members: UserMessMember[];
}) {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Mess Information</CardTitle>
              <CardDescription>
                Review the mess details connected to your active membership.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoBlock label="Mess Name" value={mess.messName || "Not set"} />
            <InfoBlock
              label="Joined Date"
              value={new Date(mess.joinedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            />
            <InfoBlock
              label="Total Members"
              value={String(mess.totalMembers)}
            />
            <InfoBlock
              label="Meal Tracking"
              value={mess.mealTrackingEnabled ? "Enabled" : "Disabled"}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4 rounded-2xl border border-border bg-background/70 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Address
              </div>
              <p className="text-sm text-muted-foreground">
                {mess.messAddress || "No mess address has been added yet."}
              </p>

              <div className="pt-2">
                <p className="text-sm font-medium text-foreground">Description</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mess.description || "No mess description has been added yet."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <div className="flex items-start gap-3">
                <Avatar size="lg">
                  <AvatarImage src={mess.managerImage ?? ""} />
                  <AvatarFallback>
                    {mess.managerName.charAt(0) || "M"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{mess.managerName}</p>
                    <Badge>Manager</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mess.managerEmail}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Deposit minimum: ৳{mess.minimumDeposit.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mess default meal count: {mess.messDefaultMealCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                See everyone currently active in your mess. Managers are
                highlighted.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.map((member) => {
            const isManager = member.role === "manager";

            return (
              <div
                key={member.id}
                className={`flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${
                  isManager
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-background/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarImage src={member.image ?? ""} />
                    <AvatarFallback>{member.name.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{member.name}</p>
                      <Badge variant={isManager ? "default" : "outline"}>
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isManager && <ShieldCheck className="h-4 w-4 text-primary" />}
                  Joined{" "}
                  {new Date(member.joinDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
