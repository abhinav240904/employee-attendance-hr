import React, { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import "./Attendance.css";

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const webcamRef = useRef(null);

  // Fetch attendance logs
  useEffect(() => {
    fetch("http://localhost:5000/attendance")
      .then((res) => res.json())
      .then((data) => setAttendance(data))
      .catch((err) => console.error("Error:", err));
  }, []);

  // Capture photo and mark attendance
  const markAttendance = async () => {
    if (!webcamRef.current) return;
    const photo = webcamRef.current.getScreenshot();

    const record = {
      empId: "24", // 👈 right now hardcoded, later we match actual employee
      date: new Date().toISOString().split("T")[0],
      status: "Present",
      photo
    };

    try {
      const res = await fetch("http://localhost:5000/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      const saved = await res.json();
      setAttendance((prev) => [...prev, saved]);
      alert("✅ Attendance marked!");
    } catch (err) {
      console.error("Error marking attendance:", err);
      alert("❌ Failed to mark attendance");
    }
  };

  // Filter logs by date range
  const filteredLogs = attendance.filter((log) => {
    if (!dateRange.start || !dateRange.end) return true;
    return log.date >= dateRange.start && log.date <= dateRange.end;
  });

  return (
    <div className="attendance-page">
      <h1>Attendance</h1>

      {/* Camera Section */}
      <div className="camera-box">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={320}
          height={240}
        />
        <button className="mark-btn" onClick={markAttendance}>
          📸 Mark Attendance
        </button>
      </div>

      {/* Date Filter */}
      <div className="filter-box">
        <label>From: </label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) =>
            setDateRange({ ...dateRange, start: e.target.value })
          }
        />
        <label>To: </label>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) =>
            setDateRange({ ...dateRange, end: e.target.value })
          }
        />
      </div>

      {/* Logs Table */}
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Employee ID</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.id}>
              <td>
                {log.photo && (
                  <img src={log.photo} alt="snap" className="att-photo" />
                )}
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
