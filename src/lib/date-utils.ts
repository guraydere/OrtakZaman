import {
    format,
    parseISO,
    addDays,
    startOfWeek,
    eachDayOfInterval,
    isValid,
} from "date-fns";
import { tr } from "date-fns/locale";

/**
 * Slot format: "d{dayIndex}_h{hour}"
 * Example: "d0_h18" = First day, 18:00
 */

/**
 * Create a slot ID from day index and hour
 */
export function createSlotId(dayIndex: number, hour: number): string {
    return `d${dayIndex}_h${hour}`;
}

/**
 * Parse a slot ID to get day index and hour
 */
export function parseSlotId(slotId: string): { dayIndex: number; hour: number } | null {
    const match = slotId.match(/^d(\d+)_h(\d+)$/);
    if (!match) return null;
    return {
        dayIndex: parseInt(match[1], 10),
        hour: parseInt(match[2], 10),
    };
}

/**
 * Generate all possible slots for given dates and hour range
 */
export function generateAllSlots(
    dates: string[],
    startHour: number,
    endHour: number
): string[] {
    const slots: string[] = [];
    for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
        for (let hour = startHour; hour < endHour; hour++) {
            slots.push(createSlotId(dayIndex, hour));
        }
    }
    return slots;
}

/**
 * Get dates for a week starting from a given date
 */
export function getWeekDates(startDate: Date): string[] {
    const start = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
    const end = addDays(start, 6);
    return eachDayOfInterval({ start, end }).map((date) =>
        format(date, "yyyy-MM-dd")
    );
}

/**
 * Format date for display in Turkish
 */
export function formatDateTR(dateStr: string): string {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, "d MMMM yyyy, EEEE", { locale: tr });
}

/**
 * Format short day name in Turkish
 */
export function formatDayShortTR(dateStr: string): string {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, "EEE", { locale: tr });
}

/**
 * Format day and date for grid header
 */
export function formatDayHeaderTR(dateStr: string): { day: string; date: string } {
    const date = parseISO(dateStr);
    if (!isValid(date)) return { day: dateStr, date: "" };
    return {
        day: format(date, "EEEE", { locale: tr }), // "Pazartesi"
        date: format(date, "d MMM", { locale: tr }), // "20 Oca"
    };
}

/**
 * Format hour for display
 */
export function formatHour(hour: number): string {
    return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * Calculate expiration timestamp (7 days from now)
 */
export function calculateExpiresAt(): number {
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
}

/**
 * Check if meeting is expired
 */
export function isMeetingExpired(expiresAt: number): boolean {
    return Date.now() > expiresAt;
}
