import React, { useEffect, useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error(err));

    fetch("http://localhost:5000/attendance")
      .then((res) => res.json())
      .then((data) => setAttendance(data))
      .catch((err) => console.error(err));
  }, []);

  // Today’s date
  const today = new Date().toISOString().split("T")[0];

  // Stats
  const totalEmployees = employees.length;
  const presentToday = attendance.filter((a) => a.date === today && a.status === "Present").length;
  const absentToday = totalEmployees - presentToday;

  // Monthly attendance %
  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-08"
  const monthLogs = attendance.filter((a) => a.date.startsWith(currentMonth));
  const monthlyPresent = monthLogs.filter((a) => a.status === "Present").length;
  const monthlyPercent = monthLogs.length > 0
    ? Math.round((monthlyPresent / monthLogs.length) * 100)
    : 0;

  // Recent logs (last 5)
  const recentLogs = [...attendance].reverse().slice(0, 5);

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card">
          <h3>Total Employees</h3>
          <p>{totalEmployees}</p>
        </div>
        <div className="card">
          <h3>Present Today</h3>
          <p>{presentToday}</p>
        </div>
        <div className="card">
          <h3>Absent Today</h3>
          <p>{absentToday}</p>
        </div>
        <div className="card">
          <h3>Monthly Attendance %</h3>
          <p>{monthlyPercent}%</p>
        </div>
      </div>

      {/* Recent Attendance Logs */}
      <h2>Recent Attendance</h2>
      <table className="recent-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Employee ID</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {recentLogs.map((log) => (
            <tr key={log.id}>
              <td>
                {log.photo && <img src={log.photo} alt="snap" className="log-photo" />}
              </td>
              <td>{log.empId}</td>
              <td>{log.date}</td>
              <td>{log.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
