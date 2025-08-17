import React, { useEffect, useState } from "react";
import "./Employees.css";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    empId: "",
    department: "",
    joinDate: "",
    photo: ""
  });

  // Fetch employees on load
  useEffect(() => {
    fetch("http://localhost:5000/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Error:", err));
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo" && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Submit new employee
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const newEmployee = await res.json(); // get saved record from backend
      setEmployees((prev) => [...prev, newEmployee]); // update UI
      setShowModal(false); // close modal
      // reset form
      setFormData({ name: "", empId: "", department: "", joinDate: "", photo: "" });
    } catch (error) {
      console.error("Failed to add employee:", error);
      alert("Failed to add employee. Check if json-server is running!");
    }
  };

  return (
    <div className="employees-page">
      <h1>Employees</h1>
      <button className="add-btn" onClick={() => setShowModal(true)}>
        + Add Employee
      </button>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Name</th>
            <th>Employee ID</th>
            <th>Department</th>
            <th>Join Date</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>
                {emp.photo && (
                  <img src={emp.photo} alt="profile" className="emp-photo" />
                )}
              </td>
              <td>{emp.name}</td>
              <td>{emp.empId}</td>
              <td>{emp.department}</td>
              <td>{emp.joinDate}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleChange}
              />
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
    </div>
  );
}
