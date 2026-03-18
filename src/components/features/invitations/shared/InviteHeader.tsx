import { Check } from "lucide-react";

export const InviteHeader = ({ showSuccess }: { showSuccess: boolean }) => {
  if (!showSuccess) return null;

  return (
    <div className="mb-6 bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <Check className="w-5 h-5 text-primary shrink-0" />
      <p className="text-sm text-foreground">
        Invitation sent successfully! The member will receive an email shortly.
      </p>
    </div>
  );
};
