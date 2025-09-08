// src/services/api.js
import { format, parseISO } from 'date-fns'
import { countWorkingDays } from './attendanceUtils'

const LS_EMPLOYEES = 'hr_employees'
const LS_ATTENDANCE = 'hr_attendance'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// seed on first run
;(function seed() {
  const emp = load(LS_EMPLOYEES, null)
  if (!emp) {
    const employees = [
      { id: crypto.randomUUID(), empCode: 'E1001', name: 'Abhinav', department: 'Engineering', active: true, photo: '' },
      { id: crypto.randomUUID(), empCode: 'E1002', name: 'Priya', department: 'HR', active: true, photo: '' },
      { id: crypto.randomUUID(), empCode: 'E1003', name: 'Rahul', department: 'Finance', active: true, photo: '' },
    ]
    save(LS_EMPLOYEES, employees)

    const today = new Date()
    const logs = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateIso = d.toISOString().slice(0,10)
      const weekday = d.getDay()
      employees.forEach(emp => {
        const present = weekday !== 0 && weekday !== 6
        logs.push({
          id: crypto.randomUUID(),
          date: dateIso,
          empCode: emp.empCode,
          name: emp.name,
          checkIn: present ? '09:15' : null,
          checkOut: present ? '18:05' : null,
          status: present ? 'Present' : 'Absent'
        })
      })
    }
    save(LS_ATTENDANCE, logs)
  }
})()

// Employees
export function getEmployees() {
  return load(LS_EMPLOYEES, [])
}

export function addEmployee({ name, empCode, department, active, photo }) {
  const employees = getEmployees()
  if (employees.some(e => e.empCode === empCode)) {
    throw new Error('Employee ID already exists')
  }
  employees.push({ id: crypto.randomUUID(), name, empCode, department, active, photo: photo || '' })
  save(LS_EMPLOYEES, employees)
}

export function removeEmployee(id) {
  const employees = getEmployees().filter(e => e.id !== id)
  save(LS_EMPLOYEES, employees)
  const logs = getAttendance().filter(l => employees.some(e => e.empCode === l.empCode))
  save(LS_ATTENDANCE, logs)
}

// Attendance
export function getAttendance() {
  return load(LS_ATTENDANCE, [])
}

export function addAttendanceLog({ dateISO, empCode, name, checkIn, checkOut, status }) {
  const logs = getAttendance()
  logs.push({
    id: crypto.randomUUID(),
    date: dateISO,
    empCode, name, checkIn, checkOut, status
  })
  save(LS_ATTENDANCE, logs)
}

export function getAttendanceByRange(startISO, endISO, empCode = null) {
  const logs = getAttendance()
  const s = parseISO(startISO)
  const e = parseISO(endISO)
  return logs
    .filter(l => {
      const d = parseISO(l.date)
      const inRange = d >= s && d <= e
      const byEmp = empCode ? l.empCode === empCode : true
      return inRange && byEmp
    })
    .sort((a,b) => (a.date < b.date ? -1 : 1))
}

export function summarizeByRange(logs, startISO, endISO) {
  const workingDays = countWorkingDays(startISO, endISO)
  const present = logs.filter(l => l.status === 'Present').length
  const empDays = new Map()
  logs.forEach(l => {
    const key = `${l.empCode}-${l.date}`
    empDays.set(key, l.status)
  })
  const absWithinLogs = [...empDays.values()].filter(s => s === 'Absent').length
  return {
    workingDays,
    present,
    absent: absWithinLogs,
    uniqueEmpDates: empDays.size
  }
}

export function getSummaryToday() {
  const employees = getEmployees()
  const today = new Date().toISOString().slice(0,10)
  const logs = getAttendanceByRange(today, today)
  const presentToday = logs.filter(l => l.status === 'Present').length
  const absentToday = Math.max(employees.length - presentToday, 0)
  const lateEntries = logs.filter(l => l.checkIn && l.checkIn > '09:30').length
  return { totalEmployees: employees.length, presentToday, absentToday, lateEntries }
}

export function getMonthlySummaryFor(empCode) {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2,'0')
  const year = String(now.getFullYear())
  const startISO = `${year}-${month}-01`
  const endISO = `${year}-${month}-${new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()}`
  const logs = getAttendanceByRange(startISO, endISO, empCode)
  const workingDays = countWorkingDays(startISO, endISO)
  const present = logs.filter(l => l.status === 'Present').length
  const absent = Math.max(workingDays - present, 0)
  const attendancePct = workingDays > 0 ? (present / workingDays) * 100 : 0
  return {
    monthLabel: format(new Date(now.getFullYear(), now.getMonth(), 1), 'MMMM yyyy'),
    workingDays, present, absent, attendancePct
  }
}
