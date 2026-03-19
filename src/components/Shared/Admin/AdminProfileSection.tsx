"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";

import { updateAdminOwnProfile } from "@/actions/server/AdminProfile";
import ProfileImageEditor from "@/components/Shared/settings/ProfileImageEditor";
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

export type AdminOwnProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string | null;
};

export default function AdminProfileSection({
  profile,
}: {
  profile: AdminOwnProfile;
}) {
  const [isPending, startTransition] = useTransition();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone,
    image: profile.image ?? "",
  });

  const onSave = () => {
    startTransition(async () => {
      const result = await updateAdminOwnProfile(form);
      if (result.success) {
        toast.success(result.message);
        return;
      }
      toast.error(result.message);
    });
  };

  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Admin Profile</CardTitle>
            <CardDescription>
              Manage your own identity and profile photo.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-border bg-muted/10 p-4">
          <ProfileImageEditor
            idPrefix="admin"
            image={form.image}
            fallbackInitial={form.name.charAt(0) || "A"}
            disabled={isPending}
            onUploadingChange={setIsImageUploading}
            onImageChange={(value) =>
              setForm((current) => ({
                ...current,
                image: value,
              }))
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Name</Label>
            <Input
              id="admin-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-phone">Phone</Label>
            <Input
              id="admin-phone"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input id="admin-email" value={profile.email} disabled />
        </div>

        <Button
          onClick={onSave}
          disabled={isPending || isImageUploading}
          className="gap-2"
        >
          {isPending || isImageUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Profile
        </Button>
      </CardContent>
    </Card>
  );
}
