import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import "./Employees.css";
import EmployeeDetailsModal from "../components/EmployeeDetailsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";


export default function Employees() {
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    empId: "",
    department: "",
    joinDate: "",
    photo: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const webcamRef = useRef(null);

  // 🎵 Preload sounds using refs
  const clickSound = useRef(null);
  const successSound = useRef(null);
  const deleteSound = useRef(null);

  useEffect(() => {
    // fetch employees from backend
    fetch("http://localhost:5000/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Error:", err));

    // load sounds
    clickSound.current = new Audio("/sounds/click.mp3");
    successSound.current = new Audio("/sounds/success.mp3");
    deleteSound.current = new Audio("/sounds/delete.mp3");

    clickSound.current.load();
    successSound.current.load();
    deleteSound.current.load();
  }, []);

  // Utility: play preloaded sound immediately
  const playSound = (soundRef) => {
    if (soundRef && soundRef.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play();
    }
  };

  // handle input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // capture webcam
  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setFormData({ ...formData, photo: imageSrc });
    playSound(clickSound);
  };

  // save new employee
  const handleSubmit = async (e) => {
  e.preventDefault();

  // transform keys to match backend DB column names
  const payload = {
    name: formData.name,
    emp_id: formData.empId,       // ✅ matches DB
    department: formData.department,
    join_date: formData.joinDate, // ✅ matches DB
    photo: formData.photo,
  };

  try {
    if (editMode) {
      // UPDATE employee
      const res = await fetch(`http://localhost:5000/employees/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),   // ✅ send transformed data
      });
      const updatedEmployee = await res.json();

      setEmployees((prev) =>
        prev.map((emp) => (emp.id === editId ? updatedEmployee : emp))
      );
      playSound(successSound);
    } else {
      // ADD new employee
      const res = await fetch("http://localhost:5000/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),   // ✅ send transformed data
      });
      const newEmployee = await res.json();
      setEmployees((prev) => [...prev, newEmployee]);
      playSound(successSound);
    }

    // reset
    setFormData({ name: "", empId: "", department: "", joinDate: "", photo: "" });
    setShowModal(false);
    setEditMode(false);
    setEditId(null);
  } catch (err) {
    console.error("❌ Failed to save employee:", err);
    alert("❌ Failed to save employee. Check backend!");
  }
};


  // delete employee
  const deleteEmployee = async (id) => {
    try {
      await fetch(`http://localhost:5000/employees/${id}`, {
        method: "DELETE",
      });
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      playSound(deleteSound);
    } catch (err) {
      console.error("❌ Failed to delete employee:", err);
    }
  };

  // 🔍 Filter employees
  const filteredEmployees = employees.filter((emp) => {
  return (
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.emp_id.toLowerCase().includes(searchTerm.toLowerCase())
  );
});


  return (
    <div className="employees-page">
      {/* Header */}
      <div className="employees-header">
        <div className="header-left">
          <div className="title-row">
            <h1>Employees</h1>

            {!showSearch ? (
              <FontAwesomeIcon
                icon={faSearch}
                className="search-icon"
                onClick={() => setShowSearch(true)}
              />
            ) : (
              <div className="search-inline">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  onBlur={() => setShowSearch(false)}
                />
              </div>
            )}
          </div>
        </div>

        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add Employee
        </button>
      </div>




      {/* Table */}
      <table className="employee-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Name</th>
            <th>Employee ID</th>
            <th>Department</th>
            <th>Join Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((emp) => (
            <tr key={emp.id}>
              <td>
                {emp.photo ? (
                  <img src={emp.photo} alt="emp" className="emp-photo" />
                ) : (
                  "N/A"
                )}
              </td>
              <td
                style={{cursor: "pointer" }}
                onClick={() => setSelectedEmployee(emp)}
              >
                {emp.name}
              </td>
              <td>{emp.emp_id}</td>
              <td>{emp.department}</td>
              <td>{emp.join_date?.split("T")[0]}</td>
              <td>
                <button
                  className="action-btn edit"
                  onClick={() => {
                    setFormData({
                      name: emp.name,
                      empId: emp.emp_id,
                      department: emp.department,
                      joinDate: emp.join_date?.split("T")[0],
                      photo: emp.photo,
                    });
                    setEditMode(true);
                    setEditId(emp.id);
                    setShowModal(true);
                  }}
                >
                  Edit
                </button>

                <button
                  className="action-btn delete"
                  onClick={() => deleteEmployee(emp.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Employee</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="empId"
                placeholder="Employee ID"
                value={formData.empId}
                onChange={handleChange}
                required
                readOnly={editMode}   // 👈 This makes it non-editable when editing
                style={editMode ? { backgroundColor: "#f0f0f0", cursor: "not-allowed" } : {}}
              />

              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
                required
              />
              <input
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                required
              />

              <div className="camera-box">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={300}
                  height={200}
                />
                <button type="button" onClick={capturePhoto}>
                  📸 Capture
                </button>
              </div>

              {formData.photo && (
                <div className="preview-box">
                  <h4>Captured Photo:</h4>
                  <img src={formData.photo} alt="preview" className="emp-photo" />
                </div>
              )}

              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}
