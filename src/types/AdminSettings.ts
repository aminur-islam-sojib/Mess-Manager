export type AdminSettingsSection =
  | "security"
  | "finance"
  | "audit"
  | "notifications"
  | "rollout";

export interface AdminSecuritySettings {
  adminSessionTimeoutMinutes: number;
  requireMfaForAdmins: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  strictSensitiveActionConfirm: boolean;
}

export interface AdminFinanceSettings {
  maxSingleExpenseAmount: number;
  requireReceiptAbove: number;
  autoApproveBelow: number;
  pendingRequestExpiryDays: number;
}

export interface AdminAuditSettings {
  retentionDays: number;
  exportFormat: "json" | "csv";
  logSecurityEvents: boolean;
  logRoleChanges: boolean;
  logFinancialEvents: boolean;
}

export interface AdminNotificationSettings {
  highValueExpenseThreshold: number;
  moderationAlertThreshold: number;
  messArchivalAlert: boolean;
}

export interface AdminRolloutSettings {
  enableBetaFeatures: boolean;
  rolloutPercent: number;
  killSwitch: boolean;
}

export interface AdminSettings {
  version: number;
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  security: AdminSecuritySettings;
  finance: AdminFinanceSettings;
  audit: AdminAuditSettings;
  notifications: AdminNotificationSettings;
  rollout: AdminRolloutSettings;
}

export interface AdminSettingsActionResult {
  success: boolean;
  message: string;
  settings?: AdminSettings;
}
