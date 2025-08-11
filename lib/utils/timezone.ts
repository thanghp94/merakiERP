/**
 * Timezone utility functions for consistent time handling across APIs
 */

export interface TimezoneConversionOptions {
  timezone?: string;
  date: string;
  time: string;
}

/**
 * Convert local time to UTC for database storage
 * @param options - Conversion options
 * @returns ISO string in UTC
 */
export function convertToUTC({ timezone = 'Asia/Ho_Chi_Minh', date, time }: TimezoneConversionOptions): string {
  // Create date in user's timezone and convert to UTC
  const localTimeString = new Date(`${date}T${time}:00`).toLocaleString('sv-SE', { timeZone: timezone });
  return new Date(localTimeString).toISOString();
}

/**
 * Convert UTC time to local timezone for display
 * @param utcTime - UTC time string
 * @param timezone - Target timezone (default: Asia/Ho_Chi_Minh)
 * @returns Formatted local time string
 */
export function convertFromUTC(utcTime: string, timezone: string = 'Asia/Ho_Chi_Minh'): string {
  return new Date(utcTime).toLocaleString('vi-VN', { timeZone: timezone });
}

/**
 * Get timezone offset for a specific timezone
 * @param timezone - Timezone identifier
 * @returns Offset in hours
 */
export function getTimezoneOffset(timezone: string = 'Asia/Ho_Chi_Minh'): number {
  const now = new Date();
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const local = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
  return (local.getTime() - utc.getTime()) / (1000 * 60 * 60);
}

/**
 * Validate timezone string
 * @param timezone - Timezone to validate
 * @returns boolean indicating if timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract timezone from request body with fallback
 * @param requestBody - Request body object
 * @returns Valid timezone string
 */
export function extractTimezone(requestBody: any): string {
  const { timezone = 'Asia/Ho_Chi_Minh' } = requestBody;
  return isValidTimezone(timezone) ? timezone : 'Asia/Ho_Chi_Minh';
}
