import { NavLink } from 'react-router-dom'
import './Sidebar.css'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="logo">HR Panel</h2>
      <nav>
        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>🏠 Dashboard</NavLink>
        <NavLink to="/employees" className={({isActive}) => isActive ? 'active' : ''}>👥 Employees</NavLink>
        <NavLink to="/attendance" className={({isActive}) => isActive ? 'active' : ''}>📅 Attendance</NavLink>
      </nav>
    </aside>
  )
}
