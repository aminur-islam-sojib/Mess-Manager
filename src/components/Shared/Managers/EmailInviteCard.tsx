import { Mail, Send, Loader2, X } from "lucide-react";

interface EmailInviteCardProps {
  email: string;
  setEmail: (val: string) => void;
  error: string;
  isInviting: boolean;
  onInvite: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  invitedEmails: string[];
  onRemoveEmail: (email: string) => void;
}

export const EmailInviteCard = ({
  email,
  setEmail,
  error,
  isInviting,
  onInvite,
  onKeyPress,
  invitedEmails,
  onRemoveEmail,
}: EmailInviteCardProps) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
    <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
      <Mail className="w-5 h-5 text-primary" />
      Send Email Invitation
    </h2>

    <div className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Member Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="member@example.com"
            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-background text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
              error ? "border-destructive" : "border-input focus:border-primary"
            }`}
            disabled={isInviting}
          />
        </div>
        {error && (
          <p className="mt-2 text-xs text-destructive flex items-center gap-1">
            <span>⚠️</span>
            {error}
          </p>
        )}
      </div>

      <button
        onClick={onInvite}
        disabled={isInviting || !email.trim()}
        className="w-full py-3 px-4 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isInviting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Sending...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" /> Send Invitation
          </>
        )}
      </button>
    </div>

    {invitedEmails.length > 0 && (
      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Invited ({invitedEmails.length})
        </h3>
        <div className="space-y-2">
          {invitedEmails.map((email, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
            >
              <span className="text-sm text-foreground">{email}</span>
              <button
                onClick={() => onRemoveEmail(email)}
                className="p-1 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
