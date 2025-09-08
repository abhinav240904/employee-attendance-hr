import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouseUser, faUsers, faCamera } from "@fortawesome/free-solid-svg-icons"; 
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="logo">HR Panel</h2>
      <nav>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          <FontAwesomeIcon icon={faHouseUser} /> Dashboard
        </NavLink>
        <NavLink to="/employees" className={({ isActive }) => (isActive ? "active" : "")}>
          <FontAwesomeIcon icon={faUsers} /> Employees
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => (isActive ? "active" : "")}>
          <FontAwesomeIcon icon={faCamera} /> Attendance
        </NavLink>
      </nav>
    </aside>
  );
}
