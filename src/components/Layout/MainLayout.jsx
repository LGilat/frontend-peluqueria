import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      <button className="mobile-menu-btn" onClick={toggleSidebar}>
        ☰
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>Peluquería</h1>
        </div>

        <nav className="nav-menu">
          <ul>
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/calendar" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Calendario
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Clientes
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/reservations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Reservas
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/services" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Servicios
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Productos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/stock" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Stock
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/staff" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Atendentes
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/payroll" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Nóminas
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Finanzas
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/ledger" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Contabilidad
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/notices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Comunicados
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%' }}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
