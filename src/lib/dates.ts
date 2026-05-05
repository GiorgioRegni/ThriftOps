import { differenceInCalendarDays, format, parseISO } from "date-fns";

export const todayInput = (): string => format(new Date(), "yyyy-MM-dd");
export const isoFromInput = (value: string): string => parseISO(value || todayInput()).toISOString();
export const timestampFromInput = isoFromInput;
export const inputFromTimestamp = (value?: string): string => (value ? format(parseISO(value), "yyyy-MM-dd") : todayInput());
export const dateFromISO = (value: string): Date => parseISO(value);
export const formatISODate = (value?: string): string => (value ? dateFromISO(value).toLocaleDateString() : "");
export const formatISODateTime = (value?: string): string => (value ? dateFromISO(value).toLocaleString() : "");
export const daysBetweenTimestamps = (end?: string, start?: string): number =>
  end && start ? Math.max(0, differenceInCalendarDays(dateFromISO(end), dateFromISO(start))) : 0;
