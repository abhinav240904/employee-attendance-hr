// src/components/AttendanceTable.jsx
import './AttendanceTable.css'
import { format } from 'date-fns'

export default function AttendanceTable({ logs }) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr><th>Date</th><th>Emp ID</th><th>Name</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr>
        </thead>
        <tbody>
          {logs.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', color:'#9ca3af'}}>No records</td></tr>}
          {logs.map(l => (
            <tr key={l.id}>
              <td>{format(new Date(l.date), 'dd MMM yyyy')}</td>
              <td>{l.empCode}</td>
              <td>{l.name}</td>
              <td>{l.checkIn || '-'}</td>
              <td>{l.checkOut || '-'}</td>
              <td><span className={`badge ${l.status === 'Present' ? 'success' : 'warn'}`}>{l.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
