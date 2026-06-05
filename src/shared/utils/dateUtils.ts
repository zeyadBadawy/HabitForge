/**
 * CONCEPT: Pure utility functions — no side effects, no imports from RN.
 * Date logic is notoriously subtle (timezones, leap years, week boundaries).
 * Centralising it here means tests catch bugs once, everywhere.
 *
 * WHY NO date-fns: Keeps the bundle small; the operations needed here
 * are simple enough to implement correctly without a library.
 *
 * GOTCHA — timezone traps:
 *   new Date("2026-05-24") parses as midnight UTC, not local midnight.
 *   new Date("2026-05-24T00:00:00") parses as local midnight.
 *   We always use local midnight for "what day is it?" comparisons.
 *   ISO strings stored in the DB include timezone offset (toISOString()
 *   returns UTC), so we strip the time portion with .split("T")[0] when
 *   we only care about the calendar date.
 */

/** Returns today's date as "YYYY-MM-DD" in local time. */
export const getTodayDateString = (): string => {
  return getLocalDateString(new Date())
}

/**
 * Returns a date string offset from today.
 * @param offsetDays negative = past, positive = future
 * @example getDateString(-1) → "2026-05-23"
 */
export const getDateString = (offsetDays: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return getLocalDateString(d)
}

/**
 * Formats any Date object as "YYYY-MM-DD" using LOCAL time zone.
 * GOTCHA: toISOString() always returns UTC; getFullYear/getMonth/getDate
 * return local time, which is what we want for calendar comparisons.
 */
export const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0") // months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Returns the ISO week number (1–53) for a given date.
 * ISO week: week containing the first Thursday of the year is week 1.
 * Used for weekly and custom-frequency streak calculations.
 */
export const getISOWeekNumber = (date: Date): number => {
  // Clone to avoid mutating the input
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday: current date + 4 - current day of week
  // (Sunday = 0, so we adjust to Monday-based ISO weeks)
  const dayOfWeek = d.getUTCDay() || 7 // make Sunday = 7 instead of 0
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek)
  // January 1 of that year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Week number = ceil of days since Jan 1 / 7
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * Returns a "YYYY-WNN" week key for a date, e.g. "2026-W21".
 * Used as a dictionary key when grouping completions by week.
 */
export const getWeekKey = (date: Date): string => {
  const year = date.getFullYear()
  const week = String(getISOWeekNumber(date)).padStart(2, "0")
  return `${year}-W${week}`
}

/**
 * Returns the start of the ISO week (Monday) for a given date.
 * Useful for grouping completions into calendar weeks.
 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date)
  const dayOfWeek = d.getDay() || 7 // Sunday → 7
  d.setDate(d.getDate() - (dayOfWeek - 1)) // back to Monday
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Returns the number of calendar days between two date strings.
 * Always returns a positive number regardless of order.
 * @param a "YYYY-MM-DD"
 * @param b "YYYY-MM-DD"
 */
export const daysBetween = (a: string, b: string): number => {
  const msPerDay = 1000 * 60 * 60 * 24
  // Parse as UTC midnight to avoid DST issues in the diff
  const dateA = new Date(`${a}T00:00:00Z`)
  const dateB = new Date(`${b}T00:00:00Z`)
  return Math.round(Math.abs(dateA.getTime() - dateB.getTime()) / msPerDay)
}

/**
 * Checks if two date strings represent the same calendar day.
 * Strips the time portion before comparing.
 */
export const isSameDay = (isoStringA: string, isoStringB: string): boolean => {
  return isoStringA.split("T")[0] === isoStringB.split("T")[0]
}

/**
 * Checks if a date string is today (in local time).
 */
export const isToday = (isoString: string): boolean => {
  return isoString.split("T")[0] === getTodayDateString()
}

/**
 * Formats a date string for display.
 * @example formatDate("2026-05-24") → "May 24, 2026"
 */
export const formatDate = (dateString: string): string => {
  // Parse as local midnight to avoid off-by-one-day from UTC parsing
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

/**
 * Formats a date string as a short label for heatmap column headers.
 * @example formatDateShort("2026-05-24") → "May"
 */
export const formatDateShort = (dateString: string): string => {
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("en-US", { month: "short" })
}
