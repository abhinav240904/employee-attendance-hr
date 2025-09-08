const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");

console.log("🚀 Starting server.js ...");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // for photos in base64

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) {
    console.error("MySQL connection error:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL");
});

/* ---------------- API ENDPOINTS ---------------- */

// Get all employees
app.get("/employees", (req, res) => {
  db.query("SELECT * FROM employees", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Add new employee
app.post("/employees", (req, res) => {
  console.log("📥 New employee payload:", req.body);

  const { empId, emp_id, name, department, joinDate, join_date, photo } = req.body;

  const empIdVal = emp_id ?? empId;
  const joinDateVal = join_date ?? joinDate;

  console.log("➡ Final values for insert:", { empIdVal, name, department, joinDateVal });

  const sql = `
    INSERT INTO employees (emp_id, name, department, join_date, photo)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [empIdVal, name, department, joinDateVal, photo], (err, result) => {
    if (err) {
      console.error("❌ Insert error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: result.insertId, emp_id: empIdVal, name, department, join_date: joinDateVal, photo });
  });
});

// Get all attendance records
app.get("/attendance", (req, res) => {
  const sql = `
    SELECT 
      id,
      emp_id,
      DATE(date) AS date,   -- ensures only YYYY-MM-DD
      TIME(time) AS time,   -- ensures only HH:mm:ss
      status,
      photo
    FROM attendance
    ORDER BY date DESC, time DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});


// Mark attendance
app.post("/attendance", (req, res) => {
  console.log("📥 Incoming attendance POST:", req.body);

  const { emp_id, date, status, photo } = req.body;

  if (!emp_id || !date) {
    return res.status(400).json({ error: "Missing emp_id or date" });
  }

  // Get today's date only (YYYY-MM-DD)
  //const today = new Date(date).toISOString().split("T")[0];
  const today = date;

  const checkQuery = `
    SELECT * FROM attendance 
    WHERE emp_id = ? AND DATE(date) = ?
  `;

  db.query(checkQuery, [emp_id, today], (err, results) => {
    if (err) {
      console.error("❌ DB check error:", err);
      return res.status(500).json({ error: "DB check failed" });
    }

    if (results.length > 0) {
    return res.status(200).json({ message: "Already marked" });
    }

    // Insert if not already present
    const insertQuery = `
      INSERT INTO attendance (emp_id, date, time, status, photo)
      VALUES (?, ?, CURTIME(), ?, ?)
    `;
    db.query(insertQuery, [emp_id, today, status, photo], (err, result) => {
    if (err) {
        console.error("❌ Insert error:", err);
        return res.status(500).json({ error: "Failed to insert attendance" });
    }

    // Query back the saved record (so date+time match DB exactly)
    const fetchQuery = `
        SELECT id, emp_id, date, time, status, photo
        FROM attendance
        WHERE id = ?
    `;

    db.query(fetchQuery, [result.insertId], (err, rows) => {
        if (err) {
        console.error("❌ Fetch error:", err);
        return res.status(500).json({ error: "Failed to fetch saved record" });
        }

        res.json(rows[0]); // send correct values (date & time separated)
    });
    });
  });
});

app.delete("/employees/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM employees WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.put("/employees/:id", (req, res) => {
  const { id } = req.params;
  const { name, emp_id, department, join_date, photo } = req.body;

  console.log("📥 PUT /employees/:id called");
  console.log("➡ Params:", req.params);
  console.log("➡ Body:", req.body);

  // Ensure join_date is YYYY-MM-DD (avoid timezone shift)
  //const formattedDate = join_date ? join_date.split("T")[0] : null;
  const formattedDate = join_date;

  const sql =
    "UPDATE employees SET name=?, department=?, join_date=?, photo=? WHERE emp_id=?";
  db.query(sql, [name, department, formattedDate, photo, emp_id], (err, result) => {
    if (err) {
      console.error("❌ MySQL Update Error:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("✅ Update result:", result);
    res.json({ id, name, emp_id, department, join_date: formattedDate, photo });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
