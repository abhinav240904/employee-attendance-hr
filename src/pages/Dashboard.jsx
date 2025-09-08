import React, { useEffect, useState, useRef } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from "recharts";

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [filter, setFilter] = useState("today");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const tableRef = useRef(null);

useEffect(() => {
  Promise.all([
    fetch("http://localhost:5000/employees").then((res) => res.json()),
    fetch("http://localhost:5000/attendance").then((res) => res.json()),
  ])
    .then(([empData, attData]) => {
      console.log("got employees:", empData.length, "attendance:", attData.length);
      setEmployees(empData || []);

      // normalize attendance rows (make sure date is YYYY-MM-DD)
      const normalized = (attData || []).map((a) => ({
        ...a,
        empId: a.emp_id ?? a.empId, // prefer emp_id but accept empId
        // If a.date exists, normalize to 'en-CA' (YYYY-MM-DD). If not, keep null.
        date: a.date ? new Date(a.date).toLocaleDateString("en-CA") : null,
        status: a.status ?? "Present",
        id: a.id ?? `att-${a.emp_id ?? a.empId}-${a.date ?? Math.random()}`,
      }));

      // safer fillAbsents with fallbacks
      const fillAbsentsSafe = (data, joinDateStr, empId) => {
        const today = new Date();
        // parse join date, fallback to earliest attendance date for this emp or 7 days ago
        let start = joinDateStr ? new Date(joinDateStr) : null;
        if (!start || isNaN(start.getTime())) {
          if (data && data.length > 0) {
            const timestamps = data
              .map((d) => Date.parse(d.date))
              .filter((t) => !isNaN(t));
            const minTs = timestamps.length ? Math.min(...timestamps) : null;
            start = minTs ? new Date(minTs) : null;
          }
          if (!start) {
            start = new Date();
            start.setDate(start.getDate() - 7); // last 7 days fallback
          }
        }

        start.setHours(0, 0, 0, 0);
        const logsByDate = Object.fromEntries((data || []).map((a) => [a.date, a]));

        const full = [];
        for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toLocaleDateString("en-CA");
          if (logsByDate[dateStr]) {
            full.push(logsByDate[dateStr]);
          } else {
            full.push({
              id: `absent-${empId}-${dateStr}`,
              empId,
              date: dateStr,
              status: "Absent",
            });
          }
        }
        return full;
      };

      // expand logs for every employee
      let fullLogs = [];
      empData.forEach((emp) => {
        const empLogs = normalized.filter((a) => String(a.empId) === String(emp.emp_id));
        const expanded = fillAbsentsSafe(empLogs, emp.join_date, emp.emp_id);
        fullLogs = fullLogs.concat(expanded);
      });

      // remove any rows without a valid date (defensive)
      fullLogs = fullLogs.filter((r) => r && r.date);

      // sort newest first — use Date.parse for robust parsing of 'YYYY-MM-DD'
      fullLogs.sort((a, b) => {
        const ta = Date.parse(a.date);
        const tb = Date.parse(b.date);
        return (tb || 0) - (ta || 0);
      });

      console.log("fullLogs prepared:", fullLogs.length, fullLogs.slice(0, 5));
      setAttendance(fullLogs);
    })
    .catch((err) => {
      console.error("Error loading dashboard data:", err);
    });
}, []);


  // --- Fill missing days with "Absent" ---
  const fillAbsents = (data, joinDate, empId) => {
    const today = new Date();
    const start = new Date(joinDate);
    const logsByDate = Object.fromEntries(data.map((a) => [a.date, a]));

    const fullLogs = [];
    let d = new Date(start);
    d.setHours(0, 0, 0, 0);

    while (d <= today) {
      const dateStr = d.toLocaleDateString("en-CA");
      if (logsByDate[dateStr]) {
        fullLogs.push(logsByDate[dateStr]);
      } else {
        fullLogs.push({
          id: `absent-${empId}-${dateStr}`,
          empId,
          date: dateStr,
          status: "Absent",
        });
      }
      d.setDate(d.getDate() + 1);
    }

    return fullLogs;
  };

  const today = new Date().toLocaleDateString("en-CA");

  // --- Stats ---
  const totalEmployees = employees.length;
  const presentTodaySet = new Set(
    attendance
      .filter((a) => a.date === today && a.status === "Present")
      .map((a) => a.empId)
  );
  const presentToday = presentTodaySet.size;
  const absentToday = totalEmployees - presentToday;

  // Monthly %
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthLogs = attendance.filter((a) => a.date.startsWith(currentMonth));
  const monthlyPresent = monthLogs.filter((a) => a.status === "Present").length;
  const monthlyPercent =
    monthLogs.length > 0
      ? Math.round((monthlyPresent / monthLogs.length) * 100)
      : 0;

  // --- Last 5 days for weekly bar graph ---
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString("en-CA")); // YYYY-MM-DD
    }
    return days;
  };

  const last7Days = getLast7Days();

  const weeklyData = last7Days.map((day) => {
    const dayLogs = attendance.filter((a) => a.date === day);
    const presentCount = dayLogs.filter((a) => a.status === "Present").length;
    const absentCount = dayLogs.filter((a) => a.status === "Absent").length;

    return {
      day: new Date(day).toLocaleDateString("en-US", { weekday: "short" }), // Mon, Tue
      Present: presentCount,
      Absent: absentCount,
    };
  });


  // --- Filter Logs ---
const getFilteredLogs = () => {
  let logs = [...attendance];
  const now = new Date();

  if (filter === "today") {
    logs = logs.filter((a) => a.date === today);
  } else if (filter === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    logs = logs.filter((a) => new Date(a.date) >= weekAgo);
  } else if (filter === "month") {
  const monthAgo = new Date();
  monthAgo.setDate(now.getDate() - 30); // <-- ensure 30 days
  logs = logs.filter((a) => new Date(a.date) >= monthAgo);
} else if (filter === "3months") {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    logs = logs.filter((a) => new Date(a.date) >= threeMonthsAgo);
  }

  if (statusFilter === "present") {
    logs = logs.filter((a) => a.status === "Present");
  } else if (statusFilter === "absent") {
    logs = logs.filter((a) => a.status === "Absent");
  }

  // ✅ Employee filter
  if (selectedEmp) {
    logs = logs.filter((a) => a.empId === selectedEmp);
  }

  return logs;
};


  const filteredLogs = getFilteredLogs();

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>

      {/* Stat + Meter Section */}
<div className="stats-section">
  {/* Left: Stat boxes */}
  <div className="stats-boxes">
    <div 
      className="stat-card total" 
      onClick={() => navigate("/employees")} // ✅ navigate to Employees page
      style={{ cursor: "pointer" }}        // 👈 show pointer on hover
    >
      <h3>Total Employees</h3>
      <p className="stat-number">{totalEmployees}</p>
    </div>
    <div
      className="stat-card present"
      style={{ cursor: "pointer" }}
      onClick={() => {
        setFilter("today");
        setStatusFilter("present");
        setSelectedEmp("");
        // Scroll to table
        tableRef.current?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <h3>Present Today</h3>
      <p className="stat-number">{presentToday}</p>
    </div>

    <div
      className="stat-card absent"
      style={{ cursor: "pointer" }}
      onClick={() => {
        setFilter("today");
        setStatusFilter("absent");
        setSelectedEmp("");
        tableRef.current?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <h3>Absent Today</h3>
      <p className="stat-number">{absentToday >= 0 ? absentToday : 0}</p>
    </div>

    <div
      className="stat-card monthly"
      style={{ cursor: "pointer" }}
      onClick={() => {
        setFilter("month");       // last 30 days
        setStatusFilter("all");   // include all statuses
        setSelectedEmp("");       // reset employee filter
        tableRef.current?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <h3>Last 30 days Attendance %</h3>
      <p className="stat-number">{monthlyPercent}%</p>
    </div>
  </div>
</div>
{attendance.length > 0 && (
  <div className="graphs-row">
    {/* Left: Weekly Bar Chart */}
    <div className="weekly-bar-chart">
      <h2>Last 7 Days Attendance</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={weeklyData}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <XAxis dataKey="day" axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
          />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="Present" fill="#8e8d89" radius={[4, 4, 0, 0]} barSize={16}>
            <LabelList dataKey="Present" position="top" />
          </Bar>
          <Bar dataKey="Absent" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={16}>
            <LabelList dataKey="Absent" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Right: Radial Attendance Meter */}
    <div className="attendance-meter">
      <RadialBarChart
        width={350}
        height={403}
        innerRadius="70%"
        outerRadius="100%"
        data={[{ name: "Attendance", value: monthlyPercent, fill: "#8e8d89" }]}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar minAngle={15} background clockWise dataKey="value" />
      </RadialBarChart>
      <p className="attendance-meter-value">Total attendance {monthlyPercent}%</p>
    </div>
  </div>
)}

      {/* Filters */}
      <div className="filter">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="3months">Last 3 Months</option>
        </select>

        <select
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.emp_id} value={emp.emp_id}>
              {emp.name} ({emp.emp_id})
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
      </div>

      {/* Attendance Logs */}
      <h2>Attendance Logs</h2>
      <div ref={tableRef}>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => {
            const emp = employees.find((e) => e.emp_id === log.empId);
            return (
              <tr key={log.id}>
                <td>
                  {emp?.photo ? (
                    <img
                      src={emp.photo}
                      alt="emp"
                      className="emp-photo-small"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>{log.empId}</td>
                <td>{emp ? emp.name : "-"}</td>
                <td>{emp ? emp.department : "-"}</td>
                <td>{log.date}</td>
                <td
                  className={
                    log.status === "Present" ? "status-present" : "status-absent"
                  }
                >
                  {log.status}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
