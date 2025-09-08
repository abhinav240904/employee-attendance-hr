// src/components/EmployeeTable.jsx
import './EmployeeTable.css'

export default function EmployeeTable({ employees, onRemove, onViewSummary }) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Status</th>
            <th style={{width:200}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 && (
            <tr><td colSpan="6" style={{textAlign:'center', color:'#9ca3af'}}>No employees yet</td></tr>
          )}
          {employees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.photo ? <img src={emp.photo} alt={emp.name} className="emp-photo"/> : <div className="emp-placeholder"/>}</td>
              <td>{emp.empCode}</td>
              <td>{emp.name}</td>
              <td>{emp.department}</td>
              <td><span className={`badge ${emp.active ? 'success':'warn'}`}>{emp.active ? 'Active' : 'Inactive'}</span></td>
              <td>
                <div className="row-actions">
                  <button className="btn" onClick={() => onViewSummary(emp)}>View Summary</button>
                  <button className="btn secondary" onClick={() => onRemove(emp.id)}>Remove</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
