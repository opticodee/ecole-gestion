/**
 * Server-side wrapper around `constants.client.ts`.
 *
 * Re-exports every client-safe constant typed against the Prisma `TimeSlot`
 * enum so Server Components and Server Actions keep their strong typing.
 * Client Components MUST import from `@/lib/constants.client` instead —
 * this file pulls in `@prisma/client`, which cannot resolve in a browser bundle.
 */
import type { TimeSlot } from '@prisma/client';
import {
  ABSENCE_ALERT_THRESHOLD,
  ALLOWED_DAYS_OF_WEEK,
  LATE_TO_ABSENT_MINUTES,
  MAX_HALF_DAYS_PER_WEEK,
  TIME_SLOT_DAY_OF_WEEK as TIME_SLOT_DAY_OF_WEEK_CLIENT,
  TIME_SLOT_LABELS as TIME_SLOT_LABELS_CLIENT,
  TIME_SLOTS as TIME_SLOTS_CLIENT,
  getTimeSlotsForDay as getTimeSlotsForDayClient,
  isAllowedCourseDay,
} from './constants.client';

export const TIME_SLOTS = TIME_SLOTS_CLIENT as readonly TimeSlot[];

export const TIME_SLOT_LABELS = TIME_SLOT_LABELS_CLIENT as Record<TimeSlot, string>;

export const TIME_SLOT_DAY_OF_WEEK = TIME_SLOT_DAY_OF_WEEK_CLIENT as Record<
  TimeSlot,
  number
>;

export function getTimeSlotsForDay(date: Date): TimeSlot[] {
  return getTimeSlotsForDayClient(date) as TimeSlot[];
}

export {
  ABSENCE_ALERT_THRESHOLD,
  ALLOWED_DAYS_OF_WEEK,
  LATE_TO_ABSENT_MINUTES,
  MAX_HALF_DAYS_PER_WEEK,
  isAllowedCourseDay,
};
