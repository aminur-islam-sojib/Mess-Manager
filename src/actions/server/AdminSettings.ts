"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

import { AuthorizationError, requireAdminRole } from "@/lib/auth.utils";
import { collections, dbConnect } from "@/lib/dbConnect";
import type {
  AdminSettings,
  AdminSettingsActionResult,
  AdminSettingsSection,
} from "@/types/AdminSettings";

type StoredAdminSettings = {
  _id?: ObjectId;
  key: "global";
  version: number;
  updatedAt: Date;
  updatedBy: ObjectId | null;
  updatedByName: string | null;
  updatedByEmail: string | null;
  security: AdminSettings["security"];
  finance: AdminSettings["finance"];
  audit: AdminSettings["audit"];
  notifications: AdminSettings["notifications"];
  rollout: AdminSettings["rollout"];
};

const SETTINGS_KEY = "global";

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function sanitizeIpList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const cleaned = value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 100);

  return [...new Set(cleaned)];
}

function buildDefaultSettings(now: Date): StoredAdminSettings {
  return {
    key: SETTINGS_KEY,
    version: 1,
    updatedAt: now,
    updatedBy: null,
    updatedByName: null,
    updatedByEmail: null,
    security: {
      adminSessionTimeoutMinutes: 60,
      requireMfaForAdmins: false,
      ipWhitelistEnabled: false,
      ipWhitelist: [],
      strictSensitiveActionConfirm: true,
    },
    finance: {
      maxSingleExpenseAmount: 100000,
      requireReceiptAbove: 10000,
      autoApproveBelow: 2000,
      pendingRequestExpiryDays: 14,
    },
    audit: {
      retentionDays: 365,
      exportFormat: "json",
      logSecurityEvents: true,
      logRoleChanges: true,
      logFinancialEvents: true,
    },
    notifications: {
      highValueExpenseThreshold: 50000,
      moderationAlertThreshold: 5,
      messArchivalAlert: true,
    },
    rollout: {
      enableBetaFeatures: false,
      rolloutPercent: 0,
      killSwitch: false,
    },
  };
}

function normalizeSettings(
  input: Partial<StoredAdminSettings> | undefined,
  now: Date,
) {
  const defaults = buildDefaultSettings(now);
  const source = input ?? defaults;

  const security: AdminSettings["security"] = {
    adminSessionTimeoutMinutes: clampNumber(
      source.security?.adminSessionTimeoutMinutes,
      15,
      240,
      defaults.security.adminSessionTimeoutMinutes,
    ),
    requireMfaForAdmins: Boolean(source.security?.requireMfaForAdmins),
    ipWhitelistEnabled: Boolean(source.security?.ipWhitelistEnabled),
    ipWhitelist: sanitizeIpList(source.security?.ipWhitelist),
    strictSensitiveActionConfirm: Boolean(
      source.security?.strictSensitiveActionConfirm,
    ),
  };

  const finance: AdminSettings["finance"] = {
    maxSingleExpenseAmount: clampNumber(
      source.finance?.maxSingleExpenseAmount,
      1000,
      2000000,
      defaults.finance.maxSingleExpenseAmount,
    ),
    requireReceiptAbove: clampNumber(
      source.finance?.requireReceiptAbove,
      0,
      2000000,
      defaults.finance.requireReceiptAbove,
    ),
    autoApproveBelow: clampNumber(
      source.finance?.autoApproveBelow,
      0,
      100000,
      defaults.finance.autoApproveBelow,
    ),
    pendingRequestExpiryDays: clampNumber(
      source.finance?.pendingRequestExpiryDays,
      1,
      60,
      defaults.finance.pendingRequestExpiryDays,
    ),
  };

  if (finance.autoApproveBelow > finance.requireReceiptAbove) {
    finance.autoApproveBelow = finance.requireReceiptAbove;
  }

  const audit: AdminSettings["audit"] = {
    retentionDays: clampNumber(
      source.audit?.retentionDays,
      30,
      3650,
      defaults.audit.retentionDays,
    ),
    exportFormat: source.audit?.exportFormat === "csv" ? "csv" : "json",
    logSecurityEvents: Boolean(source.audit?.logSecurityEvents),
    logRoleChanges: Boolean(source.audit?.logRoleChanges),
    logFinancialEvents: Boolean(source.audit?.logFinancialEvents),
  };

  const notifications: AdminSettings["notifications"] = {
    highValueExpenseThreshold: clampNumber(
      source.notifications?.highValueExpenseThreshold,
      1000,
      2000000,
      defaults.notifications.highValueExpenseThreshold,
    ),
    moderationAlertThreshold: clampNumber(
      source.notifications?.moderationAlertThreshold,
      1,
      100,
      defaults.notifications.moderationAlertThreshold,
    ),
    messArchivalAlert: Boolean(source.notifications?.messArchivalAlert),
  };

  const rollout: AdminSettings["rollout"] = {
    enableBetaFeatures: Boolean(source.rollout?.enableBetaFeatures),
    rolloutPercent: clampNumber(
      source.rollout?.rolloutPercent,
      0,
      100,
      defaults.rollout.rolloutPercent,
    ),
    killSwitch: Boolean(source.rollout?.killSwitch),
  };

  if (!rollout.enableBetaFeatures) {
    rollout.rolloutPercent = 0;
  }

  return {
    key: SETTINGS_KEY,
    version: clampNumber(source.version, 1, 1000000, defaults.version),
    updatedAt:
      source.updatedAt instanceof Date ? source.updatedAt : defaults.updatedAt,
    updatedBy:
      source.updatedBy instanceof ObjectId
        ? source.updatedBy
        : defaults.updatedBy,
    updatedByName: source.updatedByName ?? defaults.updatedByName,
    updatedByEmail: source.updatedByEmail ?? defaults.updatedByEmail,
    security,
    finance,
    audit,
    notifications,
    rollout,
  } satisfies StoredAdminSettings;
}

function toPublicSettings(doc: StoredAdminSettings): AdminSettings {
  return {
    version: doc.version,
    updatedAt: doc.updatedAt.toISOString(),
    updatedBy: doc.updatedBy
      ? {
          id: doc.updatedBy.toString(),
          name: doc.updatedByName ?? null,
          email: doc.updatedByEmail ?? null,
        }
      : null,
    security: doc.security,
    finance: doc.finance,
    audit: doc.audit,
    notifications: doc.notifications,
    rollout: doc.rollout,
  };
}

function getDiff(before: StoredAdminSettings, after: StoredAdminSettings) {
  const sectionDiff: Record<string, { before: unknown; after: unknown }> = {};

  const keys: Array<AdminSettingsSection> = [
    "security",
    "finance",
    "audit",
    "notifications",
    "rollout",
  ];

  for (const key of keys) {
    const beforeRaw = JSON.stringify(before[key]);
    const afterRaw = JSON.stringify(after[key]);

    if (beforeRaw !== afterRaw) {
      sectionDiff[key] = {
        before: before[key],
        after: after[key],
      };
    }
  }

  return sectionDiff;
}

async function getOrCreateStoredSettings() {
  const now = new Date();
  const collection = dbConnect(collections.ADMIN_SETTINGS);

  const existing = await collection.findOne({ key: SETTINGS_KEY });
  if (existing) {
    return normalizeSettings(existing as Partial<StoredAdminSettings>, now);
  }

  const defaults = buildDefaultSettings(now);
  await collection.updateOne(
    { key: SETTINGS_KEY },
    {
      $setOnInsert: defaults,
    },
    { upsert: true },
  );

  return defaults;
}

export const getAdminSettings =
  async (): Promise<AdminSettingsActionResult> => {
    try {
      await requireAdminRole();

      const settings = await getOrCreateStoredSettings();

      return {
        success: true,
        message: "Admin settings loaded",
        settings: toPublicSettings(settings),
      };
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return {
          success: false,
          message: error.message,
        };
      }

      console.error("❌ Admin settings load error:", error);
      return {
        success: false,
        message: "Failed to load admin settings",
      };
    }
  };

export const updateAdminSettingsSection = async (params: {
  section: AdminSettingsSection;
  payload: AdminSettings[AdminSettingsSection];
  expectedVersion: number;
  reason?: string;
}): Promise<AdminSettingsActionResult> => {
  try {
    const session = await requireAdminRole();

    if (
      !["security", "finance", "audit", "notifications", "rollout"].includes(
        params.section,
      )
    ) {
      return {
        success: false,
        message: "Invalid settings section",
      };
    }

    const current = await getOrCreateStoredSettings();

    if (params.expectedVersion !== current.version) {
      return {
        success: false,
        message:
          "Settings were updated by another admin. Refresh and try again.",
      };
    }

    let actorId: ObjectId | null = null;
    try {
      actorId = session.user.id ? new ObjectId(session.user.id) : null;
    } catch {
      actorId = null;
    }

    const next = normalizeSettings(
      {
        ...current,
        [params.section]: params.payload,
      },
      new Date(),
    );

    next.version = current.version + 1;
    next.updatedAt = new Date();
    next.updatedBy = actorId;
    next.updatedByName = session.user.name ?? null;
    next.updatedByEmail = session.user.email ?? null;

    const collection = dbConnect(collections.ADMIN_SETTINGS);
    const auditCollection = dbConnect(collections.AUDIT_LOGS);

    const updateResult = await collection.updateOne(
      {
        key: SETTINGS_KEY,
        version: current.version,
      },
      {
        $set: next,
      },
      { upsert: true },
    );

    if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
      return {
        success: false,
        message:
          "Update conflict detected. Please refresh and apply changes again.",
      };
    }

    await auditCollection.insertOne({
      action: "admin.settings.update.section",
      section: params.section,
      actorUserId: actorId,
      actorName: session.user.name ?? null,
      actorEmail: session.user.email ?? null,
      reason: (params.reason || "").trim() || null,
      before: current[params.section],
      after: next[params.section],
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/admin/settings");

    return {
      success: true,
      message: `${params.section[0].toUpperCase()}${params.section.slice(1)} settings saved`,
      settings: toPublicSettings(next),
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("❌ Admin settings section update error:", error);
    return {
      success: false,
      message: "Failed to save settings section",
    };
  }
};

export const saveAdminSettingsAll = async (params: {
  settings: AdminSettings;
  expectedVersion: number;
  reason?: string;
}): Promise<AdminSettingsActionResult> => {
  try {
    const session = await requireAdminRole();
    const current = await getOrCreateStoredSettings();

    if (params.expectedVersion !== current.version) {
      return {
        success: false,
        message:
          "Settings were updated by another admin. Refresh and try again.",
      };
    }

    let actorId: ObjectId | null = null;
    try {
      actorId = session.user.id ? new ObjectId(session.user.id) : null;
    } catch {
      actorId = null;
    }

    const normalized = normalizeSettings(
      {
        ...current,
        security: params.settings.security,
        finance: params.settings.finance,
        audit: params.settings.audit,
        notifications: params.settings.notifications,
        rollout: params.settings.rollout,
      },
      new Date(),
    );

    normalized.version = current.version + 1;
    normalized.updatedAt = new Date();
    normalized.updatedBy = actorId;
    normalized.updatedByName = session.user.name ?? null;
    normalized.updatedByEmail = session.user.email ?? null;

    const collection = dbConnect(collections.ADMIN_SETTINGS);
    const auditCollection = dbConnect(collections.AUDIT_LOGS);

    const updateResult = await collection.updateOne(
      {
        key: SETTINGS_KEY,
        version: current.version,
      },
      {
        $set: normalized,
      },
      { upsert: true },
    );

    if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
      return {
        success: false,
        message:
          "Update conflict detected. Please refresh and apply changes again.",
      };
    }

    const diff = getDiff(current, normalized);

    await auditCollection.insertOne({
      action: "admin.settings.update.bulk",
      actorUserId: actorId,
      actorName: session.user.name ?? null,
      actorEmail: session.user.email ?? null,
      reason: (params.reason || "").trim() || null,
      beforeVersion: current.version,
      afterVersion: normalized.version,
      changes: diff,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/admin/settings");

    return {
      success: true,
      message: "All settings saved",
      settings: toPublicSettings(normalized),
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("❌ Admin settings bulk save error:", error);
    return {
      success: false,
      message: "Failed to save all admin settings",
    };
  }
};
