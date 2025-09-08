import React, { useEffect, useState } from "react";
import "./EmployeeDetailsModal.css";

function EmployeeDetailsModal({ employee, onClose }) {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    last30Present: 0,
    last30Absent: 0,
  });

  useEffect(() => {
    if (!employee) return;

    fetch(`http://localhost:5000/attendance?empId=${employee.emp_id}`)
      .then((res) => res.json())
      .then((data) => {
        // Normalize DB dates to YYYY-MM-DD
        const normalized = data.map((a) => ({
          ...a,
          date: new Date(a.date).toLocaleDateString("en-CA"),
        }));

        const fullLogs = fillAbsents(normalized, employee.join_date);

        setAttendance(fullLogs);
        calculateStats(fullLogs);
      });
  }, [employee]);

  // 👇 Helper: Fill missing days with "Absent"
  const fillAbsents = (data, joinDate) => {
  const today = new Date();
  const start = new Date(joinDate);
  const logsByDate = Object.fromEntries(data.map(a => [a.date, a]));

  const fullLogs = [];

  let d = new Date(start);
  d.setHours(0, 0, 0, 0); // normalize join date

  while (d <= today) {
    const dateStr = d.toLocaleDateString("en-CA"); // local YYYY-MM-DD
    if (logsByDate[dateStr]) {
      fullLogs.push(logsByDate[dateStr]);
    } else {
      fullLogs.push({
        id: `absent-${dateStr}`,
        date: dateStr,
        status: "Absent"
      });
    }
    d.setDate(d.getDate() + 1);
  }

  return fullLogs;
};


  // 👇 Stats calculator
  const calculateStats = (data) => {
    const total = data.length;

    const today = new Date();
    const last30 = new Date();
    last30.setDate(today.getDate() - 30);

    const recentLogs = data.filter(
      (a) => new Date(a.date) >= last30 && new Date(a.date) <= today
    );

    const presentCount = recentLogs.filter((a) => a.status === "Present").length;
    const absentCount = recentLogs.filter((a) => a.status === "Absent").length;

    setStats({
      total,
      last30Present: presentCount,
      last30Absent: absentCount,
    });
  };

  if (!employee) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>

        <h2 className="emp-name">Employee Details</h2>
        <div className="emp-info">
          <p>
            <b>Name:</b> {employee.name}
          </p>
          <p>
            <b>ID:</b> {employee.emp_id}
          </p>
          <p>
            <b>Department:</b> {employee.department}
          </p>
          <p>
            <b>Join Date:</b>{" "}
            {employee.join_date
              ? employee.join_date.split("T")[0]
              : ""}
          </p>
        </div>

        <div className="stats-box">
          <h3>Attendance Summary</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Records</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-card present">
              <span className="stat-label">Present (30d)</span>
              <span className="stat-value">{stats.last30Present}</span>
            </div>
            <div className="stat-card absent">
              <span className="stat-label">Absent (30d)</span>
              <span className="stat-value">{stats.last30Absent}</span>
            </div>
          </div>
        </div>

        <h3>Attendance Logs</h3>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length > 0 ? (
              attendance.map((a) => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td className={a.status === "Present" ? "present" : "absent"}>
                    {a.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No attendance records.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeDetailsModal;
