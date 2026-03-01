import { Copy, Check } from "lucide-react";

export const ShareLinkCard = ({
  link,
  onCopy,
  copied,
}: {
  link: string;
  onCopy: () => void;
  copied: boolean;
}) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
    <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
      <Copy className="w-5 h-5 text-primary" />
      Share Invite Link
    </h2>
    <p className="text-sm text-muted-foreground mb-4">
      Anyone with this link can join your mess. Share it via WhatsApp or SMS.
    </p>
    <div className="space-y-3">
      <div className="p-4 bg-muted rounded-xl border border-border overflow-hidden">
        <p className="text-sm text-foreground font-mono break-all">{link}</p>
      </div>
      <button
        onClick={onCopy}
        className="w-full py-3 px-4 rounded-xl font-semibold border-2 border-input hover:bg-accent active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-5 h-5 text-primary" /> Copied!
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" /> Copy Link
          </>
        )}
      </button>
    </div>
  </div>
);
