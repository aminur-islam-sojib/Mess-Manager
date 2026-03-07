"use client";

import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  User,
  MoreVertical,
  ExternalLink,
  UserCircle,
  Settings,
} from "lucide-react";

// Assuming you are using shadcn/ui components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const UserList = ({ data, messName }) => {
  const users = data || [];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-foreground italic">
            {messName}
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Manage your organization members and access levels.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-xs font-bold px-4 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20">
            {users.length} Active Members
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/70">
                <th className="px-6 py-5">Member Details</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Balance</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users.map((user) => (
                <tr
                  key={user.userId}
                  className="hover:bg-muted/20 transition-all duration-200 group"
                >
                  {/* User Profile Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold border border-primary/10 shadow-sm transition-transform group-hover:scale-105">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-foreground tracking-tight">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Mail size={12} className="text-primary/60" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        user.role === "manager"
                          ? "bg-amber-500/5 text-amber-600 border-amber-500/20"
                          : "bg-blue-500/5 text-blue-600 border-blue-500/20"
                      }`}
                    >
                      {user.role === "manager" ? (
                        <ShieldCheck size={13} strokeWidth={2.5} />
                      ) : (
                        <User size={13} strokeWidth={2.5} />
                      )}
                      {user.role.toUpperCase()}
                    </div>
                  </td>

                  {/* Status Indicator */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/80">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      {user.status || "ACTIVE"}
                    </div>
                  </td>

                  {/* Status Indicator */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/80">
                      Something...
                    </div>
                  </td>

                  {/* Actions Dropdown */}
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl hover:bg-background border border-transparent hover:border-border transition-all"
                        >
                          <MoreVertical
                            size={18}
                            className="text-muted-foreground"
                          />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 rounded-xl p-2 shadow-xl border-border/60"
                      >
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                          Member Actions
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="my-1" />

                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/profile/${user.userId}`}
                            className="flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground"
                          >
                            <UserCircle size={16} />
                            <span className="font-semibold text-sm">
                              View Full Profile
                            </span>
                            <ExternalLink
                              size={12}
                              className="ml-auto opacity-50"
                            />
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer text-muted-foreground">
                          <Settings size={16} />
                          <span className="font-semibold text-sm">
                            Manage Permissions
                          </span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem className="flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserList;
