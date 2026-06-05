/**
 * Tests for dateUtils.ts
 * Run: npm test -- dateUtils
 */

import {
  getTodayDateString,
  getDateString,
  getLocalDateString,
  getISOWeekNumber,
  getWeekKey,
  daysBetween,
  isSameDay,
  isToday,
  formatDate,
} from "./dateUtils"

describe("getLocalDateString", () => {
  it("formats a known date correctly", () => {
    const date = new Date(2026, 4, 24) // May 24 2026 local time
    expect(getLocalDateString(date)).toBe("2026-05-24")
  })

  it("pads single-digit months and days", () => {
    const date = new Date(2026, 0, 5) // Jan 5 2026
    expect(getLocalDateString(date)).toBe("2026-01-05")
  })
})

describe("getTodayDateString", () => {
  it("returns a string matching YYYY-MM-DD format", () => {
    const result = getTodayDateString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe("getDateString", () => {
  it("returns today when offset is 0", () => {
    expect(getDateString(0)).toBe(getTodayDateString())
  })

  it("returns yesterday when offset is -1", () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(getDateString(-1)).toBe(getLocalDateString(yesterday))
  })

  it("returns tomorrow when offset is +1", () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(getDateString(1)).toBe(getLocalDateString(tomorrow))
  })
})

describe("getISOWeekNumber", () => {
  it("returns correct week for a known date — Jan 1 2026 is in week 1", () => {
    // 2026-01-01 is a Thursday → week 1
    expect(getISOWeekNumber(new Date(2026, 0, 1))).toBe(1)
  })

  it("returns correct week for Dec 31 2025 (which is in week 1 of 2026)", () => {
    // 2025-12-31 is a Wednesday, part of the same week as 2026-01-01
    // ISO week 1 of 2026 starts Mon 2025-12-29
    expect(getISOWeekNumber(new Date(2025, 11, 31))).toBe(1)
  })

  it("returns week 21 for 2026-05-24", () => {
    // Verified independently: 2026-05-24 is a Sunday → week 21
    expect(getISOWeekNumber(new Date(2026, 4, 24))).toBe(21)
  })

  it("produces different week numbers for dates 8 days apart", () => {
    const week1 = getISOWeekNumber(new Date(2026, 4, 18)) // Mon May 18
    const week2 = getISOWeekNumber(new Date(2026, 4, 25)) // Mon May 25
    expect(week2).toBe(week1 + 1)
  })
})

describe("getWeekKey", () => {
  it("returns YYYY-WNN format", () => {
    const result = getWeekKey(new Date(2026, 4, 24))
    expect(result).toMatch(/^\d{4}-W\d{2}$/)
  })

  it("returns same key for two dates in the same week", () => {
    const monday = getWeekKey(new Date(2026, 4, 18)) // Mon May 18
    const friday = getWeekKey(new Date(2026, 4, 22)) // Fri May 22
    expect(monday).toBe(friday)
  })

  it("returns different keys for dates in different weeks", () => {
    const week1 = getWeekKey(new Date(2026, 4, 18))
    const week2 = getWeekKey(new Date(2026, 4, 25))
    expect(week1).not.toBe(week2)
  })
})

describe("daysBetween", () => {
  it("returns 0 for the same date", () => {
    expect(daysBetween("2026-05-24", "2026-05-24")).toBe(0)
  })

  it("returns 1 for consecutive days", () => {
    expect(daysBetween("2026-05-24", "2026-05-25")).toBe(1)
  })

  it("is symmetric — order does not matter", () => {
    expect(daysBetween("2026-05-20", "2026-05-24")).toBe(
      daysBetween("2026-05-24", "2026-05-20")
    )
  })

  it("returns correct count across month boundary", () => {
    expect(daysBetween("2026-05-31", "2026-06-01")).toBe(1)
  })

  it("returns correct count across year boundary", () => {
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1)
  })
})

describe("isSameDay", () => {
  it("returns true for same date, different times", () => {
    expect(isSameDay("2026-05-24T08:00:00Z", "2026-05-24T22:00:00Z")).toBe(true)
  })

  it("returns false for different dates", () => {
    expect(isSameDay("2026-05-24", "2026-05-25")).toBe(false)
  })

  it("handles plain date strings without time", () => {
    expect(isSameDay("2026-05-24", "2026-05-24")).toBe(true)
  })
})

describe("isToday", () => {
  it("returns true for a string starting with today's date", () => {
    const todayIso = new Date().toISOString()
    expect(isToday(todayIso)).toBe(true)
  })

  it("returns false for yesterday", () => {
    expect(isToday(getDateString(-1))).toBe(false)
  })

  it("returns false for tomorrow", () => {
    expect(isToday(getDateString(1))).toBe(false)
  })
})

describe("formatDate", () => {
  it("formats a date string in a human-readable way", () => {
    const result = formatDate("2026-05-24")
    // Exact string depends on locale, but should include the year and day
    expect(result).toContain("2026")
    expect(result).toContain("24")
  })
})
