/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Modal from "./modal";
import { Button } from "./button";
import { Plus } from "lucide-react";
import { InvitePage } from "@/components/features/invitations";
import { MessDataResponse } from "@/types/MealManagement";

const InviteMemberModal = ({
  messData,
  session,
}: {
  messData: MessDataResponse;
  session: any;
}) => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("Contact form submitted!");
    setIsContactOpen(false);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsContactOpen(true)}
        className="flex flex-col w-full items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
      >
        <Plus className="w-6 h-6 text-primary" />
        <span className="text-sm font-medium text-foreground">
          Invite Member
        </span>
      </button>

      {/* Contact Form Modal */}
      <Modal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        title="Invite Member"
        size="xl"
      >
        <div>
          <div className=" p-3">
            {messData && session && (
              <InvitePage messData={messData} session={session} />
            )}
          </div>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={() => setIsContactOpen(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button type="submit" variant="default">
                Send Message
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default InviteMemberModal;
