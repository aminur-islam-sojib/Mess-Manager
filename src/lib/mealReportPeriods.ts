import {
  MealReportPeriodPreset,
  MealReportRange,
} from "@/types/MealManagementTypes";

const pad = (value: number) => String(value).padStart(2, "0");

export const toDateKeyUTC = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  return `${year}-${month}-${day}`;
};

const fromDateKeyUTC = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const addDaysToDateKey = (dateKey: string, days: number) => {
  const date = fromDateKeyUTC(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKeyUTC(date);
};

export const getMealReportRange = (
  period: MealReportPeriodPreset,
  from?: string,
  to?: string,
  now: Date = new Date(),
): MealReportRange => {
  const todayKey = toDateKeyUTC(now);
  const current = fromDateKeyUTC(todayKey);

  if (period === "custom") {
    const fromKey = from ?? addDaysToDateKey(todayKey, -6);
    const toKey = to ?? todayKey;
    return {
      period,
      from: fromKey,
      to: toKey,
      label: `${fromKey} to ${toKey}`,
    };
  }

  if (period === "today") {
    return {
      period,
      from: todayKey,
      to: todayKey,
      label: "Today",
    };
  }

  if (period === "thisWeek") {
    const day = current.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const fromDate = new Date(current);
    fromDate.setUTCDate(fromDate.getUTCDate() + mondayOffset);
    const fromKey = toDateKeyUTC(fromDate);
    return {
      period,
      from: fromKey,
      to: todayKey,
      label: "This Week",
    };
  }

  if (period === "last30Days") {
    const fromKey = addDaysToDateKey(todayKey, -29);
    return {
      period,
      from: fromKey,
      to: todayKey,
      label: "Last 30 Days",
    };
  }

  const monthStart = new Date(
    Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1),
  );
  const fromKey = toDateKeyUTC(monthStart);
  return {
    period: "thisMonth",
    from: fromKey,
    to: todayKey,
    label: "This Month",
  };
};

export const enumerateDateKeys = (from: string, to: string) => {
  const days: string[] = [];
  let cursor = from;

  while (cursor <= to) {
    days.push(cursor);
    cursor = addDaysToDateKey(cursor, 1);
  }

  return days;
};
