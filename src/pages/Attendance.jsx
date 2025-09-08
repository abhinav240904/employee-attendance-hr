import React, { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import "./Attendance.css";

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const webcamRef = useRef(null);

  // Load face-api models and employees
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setLoadingModels(false);
      console.log("✅ Face-api models loaded");
    };
    loadModels();

    fetch("http://localhost:5000/employees")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched employees:", data);
        setEmployees(data);
      });

    fetch("http://localhost:5000/attendance")
    .then((res) => res.json())
    .then((data) => {
      console.log("Fetched initial attendance:", data);

      // Sort newest first using id (fast + reliable) or fallback to date+time
      const sorted = [...data].sort((a, b) => {
        // fallback: compare combined timestamps
        const ta = new Date(`${a.date}T${a.time || "00:00:00"}`).getTime();
        const tb = new Date(`${b.date}T${b.time || "00:00:00"}`).getTime();
        return tb - ta;
      });

      // Keep only the most recent 20
      setAttendance(sorted.slice(0, 20));
    });

  }, []);

  useEffect(() => {
  if (loadingModels) return;

  const interval = setInterval(() => {
    markAttendance();   // 👈 call your same function automatically
  }, 3000); // every 3 seconds

  return () => clearInterval(interval);
}, [loadingModels]);

  /// Convert employee photos → labeled descriptors
const loadEmployeeDescriptors = async () => {
  console.log("🔄 Loading employee descriptors...");

  const labeledDescriptors = await Promise.all(
    employees.map(async (emp) => {
      if (!emp.photo) return null;

      try {
        // Create an image element from base64
        const img = new Image();
        img.src = emp.photo; // base64 string
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          console.warn(`❌ No face detected for employee ${emp.emp_id}`);
          return null;
        }

        return new faceapi.LabeledFaceDescriptors(emp.emp_id, [detection.descriptor]);
      } catch (err) {
        console.error(`❌ Error processing employee ${emp.emp_id}:`, err);
        return null;
      }
    })
  );

  return labeledDescriptors.filter((d) => d !== null);
};


// Handle attendance button click
const [lastMarked, setLastMarked] = useState(null); // 👈 add this in your component state

const markAttendance = async () => {
  if (!webcamRef.current || loadingModels) {
    console.warn("❌ Webcam not ready or models still loading");
    return;
  }

  const screenshot = webcamRef.current.getScreenshot();
  if (!screenshot) {
    console.warn("❌ No screenshot captured");
    return;
  }

  const img = await faceapi.fetchImage(screenshot);
  const detection = await faceapi
    .detectSingleFace(
      img,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    console.log("❌ No face detected.");
    return;
  }

  const descriptors = await loadEmployeeDescriptors();
  if (!descriptors || descriptors.length === 0) {
    alert("❌ No employees loaded!");
    return;
  }

  const faceMatcher = new faceapi.FaceMatcher(descriptors, 0.6);
  const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

  if (bestMatch.label === "unknown") {
    console.log("❌ Employee not recognized!");
    return;
  }

  const empId = bestMatch.label;

  // 🚫 Prevent marking same employee again immediately
  if (lastMarked === empId) {
    console.log(`⏳ Already marked ${empId}, waiting for new face...`);
    return;
  }

  // ✅ Only if not already marked → mark it
// ✅ Get IST Date-Time correctly
const now = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in ms
const istTime = new Date(now.getTime() + istOffset);

// build local date in YYYY-MM-DD
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const todayDate = `${yyyy}-${mm}-${dd}`;

// build local time in HH:MM:SS
const hh = String(now.getHours()).padStart(2, "0");
const min = String(now.getMinutes()).padStart(2, "0");
const ss = String(now.getSeconds()).padStart(2, "0");
const currentTime = `${hh}:${min}:${ss}`;

// final record
const record = {
  emp_id: empId,
  date: todayDate,    // ✅ only YYYY-MM-DD
  time: currentTime,  // ✅ only HH:MM:SS
  status: "Present",
  photo: screenshot,
};


  try {
  const res = await fetch("http://localhost:5000/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });

  const saved = await res.json();

  if (res.ok) {
    if (saved.message === "Already marked") {
      setMessage(`⚠️ Attendance already marked for Employee ${empId}`);
      setTimeout(() => setMessage(""), 2000);
      return; // stop here
    }

    setAttendance((prev) => [saved, ...prev]);
    setLastMarked(empId);

    setMessage(`✅ Attendance marked for Employee ${empId}`);
    setTimeout(() => setMessage(""), 2000);

    // cooldown
    setTimeout(() => setLastMarked(null), 5000);
  } else {
    console.error("❌ Backend error:", saved.error || saved);
    setMessage("❌ Failed to mark attendance");
    setTimeout(() => setMessage(""), 2000);
  }
} catch (err) {
  console.error("❌ Fetch error:", err);
  setMessage("❌ Failed to mark attendance");
  setTimeout(() => setMessage(""), 2000);
}
};

  return (
    <div className="attendance-page">
      <h1>Attendance</h1>

      {loadingModels ? (
        <p>Loading face recognition models...</p>
      ) : (
        <div className="camera-box">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
          />
        </div>
      )}

      <h2>Recent Attendance</h2>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Employee ID</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((log) => {
            console.log("Rendering log:", log);
            return (
              <tr key={`${log.empId}-${log.date}`}>
                <td>
                  {log.photo && (
                    <img src={log.photo} alt="snap" className="att-photo" />
                  )}
                </td>
                <td>{log.emp_id}</td>
                <td>{new Date(log.date).toLocaleDateString("en-CA")}</td>
                <td>{log.time}</td>
                <td style={{ color: log.status === "Present" ? "green" : "red" }}>
                  {log.status}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
