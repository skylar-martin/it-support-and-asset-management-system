import { useEffect, useState } from 'react';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { api } from './services/api';
import './App.css';
import './dashboard-upgrade.css';
import './navigation.css';
import './sage-cream-theme.css';

export default function App() {
  const [page, setPage] = useState('employee');
  const [activeSection, setActiveSection] = useState('employee-devices');

  function switchPage(nextPage) {
    setPage(nextPage);
    setActiveSection(nextPage === 'employee' ? 'employee-devices' : 'admin-tickets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToSection(sectionId) {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    api.getUsers().then(data => {
      setUsers(data);
      const first = data.find(u => u.role === 'Employee');
      if (first) setSelectedUserId(String(first.id));
    }).catch(err => setError(`Unable to load employees: ${err.message}`));
  }, []);
  const employees = users.filter(u => u.role === 'Employee');
  const selectedUser = employees.find(u => String(u.id) === selectedUserId);
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon">IT</div><div><strong>IT Support</strong><small>Asset Management</small></div></div>
        <nav className="dashboard-navigation" aria-label="Dashboard navigation">
          <button type="button" className={`dashboard-nav-parent ${page === 'employee' ? 'is-active' : ''}`} onClick={() => switchPage('employee')} aria-current={page === 'employee' ? 'page' : undefined}>
            <span className="nav-parent-icon" aria-hidden="true">▦</span><span>Employee Dashboard</span><span className="nav-chevron" aria-hidden="true">{page === 'employee' ? '⌄' : '›'}</span>
          </button>
          {page === 'employee' && <div className="dashboard-nav-children">
            <button type="button" className={`dashboard-nav-child ${activeSection === 'employee-devices' ? 'is-active' : ''}`} onClick={() => goToSection('employee-devices')}>Assigned Devices</button>
            <button type="button" className={`dashboard-nav-child ${activeSection === 'employee-tickets' ? 'is-active' : ''}`} onClick={() => goToSection('employee-tickets')}>Support Tickets</button>
          </div>}
          <button type="button" className={`dashboard-nav-parent ${page === 'admin' ? 'is-active' : ''}`} onClick={() => switchPage('admin')} aria-current={page === 'admin' ? 'page' : undefined}>
            <span className="nav-parent-icon" aria-hidden="true">⚙</span><span>IT Admin Dashboard</span><span className="nav-chevron" aria-hidden="true">{page === 'admin' ? '⌄' : '›'}</span>
          </button>
          {page === 'admin' && <div className="dashboard-nav-children">
            <button type="button" className={`dashboard-nav-child ${activeSection === 'admin-tickets' ? 'is-active' : ''}`} onClick={() => goToSection('admin-tickets')}>Support Management</button>
            <button type="button" className={`dashboard-nav-child ${activeSection === 'admin-inventory' ? 'is-active' : ''}`} onClick={() => goToSection('admin-inventory')}>Device Inventory</button>
          </div>}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar"><span>IT Support &amp; Asset Management System</span>
          {page === 'employee' && <select aria-label="Select employee" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
            {employees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>}
        </header>
        {error && <div className="dashboard error">{error}</div>}
        {page === 'employee' && selectedUser && <EmployeeDashboard user={selectedUser} activeSection={activeSection} />}
        {page === 'employee' && !selectedUser && !error && <div className="dashboard">Loading employees...</div>}
        {page === 'admin' && <AdminDashboard activeSection={activeSection} />}
      </main>
    </div>
  );
}
