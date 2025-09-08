// src/services/attendanceUtils.js
import { eachDayOfInterval, isWeekend, parseISO } from 'date-fns'

// Working days = Mon–Fri
export function countWorkingDays(startISO, endISO) {
  const start = parseISO(startISO)
  const end = parseISO(endISO)
  const days = eachDayOfInterval({ start, end })
  return days.filter(d => !isWeekend(d)).length
}
