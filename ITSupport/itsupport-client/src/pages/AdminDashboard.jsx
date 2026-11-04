import './ticket-filters.css';
import { useEffect, useState } from 'react';
import { api, assetApi } from '../services/api';
import TicketAttachments from './TicketAttachments';

const emptyAsset = { name: '', assetTag: '', type: 'Laptop', status: 'Active', assignedUserId: '' };
const badge = (value, type = 'status') => <span className={`demo-badge ${type}-${String(value).toLowerCase().replaceAll(' ', '-')}`}><span className="badge-dot" />{value}</span>;

export default function AdminDashboard({ activeSection = 'admin-tickets' }) {
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [ticketQuery, setTicketQuery] = useState('');
  const [ticketStatus, setTicketStatus] = useState('All');
  const [ticketPriority, setTicketPriority] = useState('All');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyAsset);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [attachmentTicket, setAttachmentTicket] = useState(null);

  async function loadData() {
    try {
      const [u, a, t] = await Promise.all([api.getUsers(), api.getAssets(), api.getTickets()]);
      setUsers(u); setAssets(a); setTickets(t); setError('');
    } catch (err) { setError(`Could not load admin dashboard: ${err.message}`); }
  }
  useEffect(() => { loadData(); }, []);

  async function changeStatus(ticket, status) {
    setBusyId(ticket.id);
    try {
      await api.updateTicket(ticket.id, { title: ticket.title, description: ticket.description, priority: ticket.priority, status, userId: ticket.userId, assetId: ticket.assetId });
      await loadData();
    } catch (err) { setError(`Could not update ticket: ${err.message}`); }
    finally { setBusyId(null); }
  }

  function openCreate() { setEditing('new'); setForm({ ...emptyAsset }); setError(''); }
  function openEdit(asset) {
    setEditing(asset.id);
    setForm({ name: asset.name, assetTag: asset.assetTag, type: asset.type, status: asset.status, assignedUserId: asset.assignedUserId == null ? '' : String(asset.assignedUserId) });
    setError('');
  }
  async function saveAsset(e) {
    e.preventDefault(); setSaving(true);
    const data = { ...form, name: form.name.trim(), assetTag: form.assetTag.trim(), assignedUserId: form.assignedUserId === '' ? null : Number(form.assignedUserId) };
    try {
      if (editing === 'new') await assetApi.create(data);
      else await assetApi.update(editing, data);
      setEditing(null); await loadData();
    } catch (err) { setError(`Could not save asset: ${err.message}`); }
    finally { setSaving(false); }
  }
  async function deleteAsset(asset) {
    if (!window.confirm(`Permanently delete asset ${asset.assetTag} (${asset.name})? Related tickets may lose their device reference.`)) return;
    setBusyId(`asset-${asset.id}`);
    try { await assetApi.remove(asset.id); await loadData(); }
    catch (err) { setError(`Could not delete asset: ${err.message}`); }
    finally { setBusyId(null); }
  }

  const employeeName = id => users.find(u => u.id === id)?.name ?? 'Unassigned';
  const filteredTickets = tickets.filter(t => {
    const text = [t.id, t.title, t.description, t.userName, t.assetName].join(' ').toLowerCase();
    return text.includes(ticketQuery.trim().toLowerCase())
      && (ticketStatus === 'All' || t.status === ticketStatus)
      && (ticketPriority === 'All' || t.priority === ticketPriority);
  });
  const filteredAssets = assets.filter(a => [a.name, a.assetTag, a.type, a.status, a.assignedUserName || employeeName(a.assignedUserId)].some(s => String(s).toLowerCase().includes(query.toLowerCase())));

  return <div className="dashboard">
    <div className="page-heading"><h1>IT Admin Dashboard</h1><p>Manage support requests and company equipment.</p></div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="stats">
      <div className="stat-card"><span>Total Employees</span><strong>{users.filter(u => u.role === 'Employee').length}</strong></div>
      <div className="stat-card"><span>Total Devices</span><strong>{assets.length}</strong></div>
      <div className="stat-card"><span>Open Tickets</span><strong>{tickets.filter(t => t.status === 'Open').length}</strong></div>
      <div className="stat-card"><span>In Progress</span><strong>{tickets.filter(t => t.status === 'In Progress').length}</strong></div>
    </div>
    {activeSection === 'admin-tickets' && <section id="admin-tickets" className="panel"><h2>Support Ticket Management</h2><div className="ticket-filter-bar">
      <label>Search tickets<input type="search" placeholder="Issue, employee, device, ticket #..." value={ticketQuery} onChange={e => setTicketQuery(e.target.value)} /></label>
      <label>Status<select value={ticketStatus} onChange={e => setTicketStatus(e.target.value)}>{['All','Open','In Progress','Resolved'].map(x => <option key={x} value={x}>{x === 'All' ? 'All statuses' : x}</option>)}</select></label>
      <label>Priority<select value={ticketPriority} onChange={e => setTicketPriority(e.target.value)}>{['All','Low','Medium','High'].map(x => <option key={x} value={x}>{x === 'All' ? 'All priorities' : x}</option>)}</select></label>
      <button type="button" className="edit-button" onClick={() => { setTicketQuery(''); setTicketStatus('All'); setTicketPriority('All'); }}>Clear filters</button>
      <span className="ticket-filter-count">{filteredTickets.length} of {tickets.length} tickets</span>
    </div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Employee</th><th>Issue</th><th>Priority</th><th>Status</th><th>Files</th></tr></thead><tbody>
      {filteredTickets.map(t => <tr key={t.id}><td>#{t.id}</td><td>{t.userName || employeeName(t.userId)}</td><td>{t.title}</td><td>{badge(t.priority, 'priority')}</td><td><div className="status-editor">{badge(t.status)}<select aria-label={`Status for ticket ${t.id}`} disabled={busyId === t.id} value={t.status} onChange={e => changeStatus(t, e.target.value)}><option>Open</option><option>In Progress</option><option>Resolved</option></select></div></td><td><button type="button" className="attachment-view-button" onClick={() => setAttachmentTicket(t)}>Attachments</button></td></tr>)}
      {!filteredTickets.length && <tr><td colSpan="6">No tickets match the current filters.</td></tr>}
    </tbody></table></div></section>}
    {activeSection === 'admin-inventory' && <section id="admin-inventory" className="panel">
      <div className="inventory-heading"><h2>Device Inventory</h2><div className="inventory-tools"><input type="search" aria-label="Search inventory" placeholder="Search devices, tags, employees..." value={query} onChange={e => setQuery(e.target.value)} /><button type="button" className="primary-action" onClick={openCreate}>+ Add Device</button></div></div>
      <div className="table-wrap"><table><thead><tr><th>Asset Tag</th><th>Device</th><th>Type</th><th>Assigned Employee</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filteredAssets.map(a => <tr key={a.id}><td>{a.assetTag}</td><td>{a.name}</td><td>{a.type}</td><td>{a.assignedUserName || employeeName(a.assignedUserId)}</td><td>{badge(a.status, 'asset')}</td><td><div className="asset-actions"><button type="button" className="edit-button" onClick={() => openEdit(a)}>Edit</button><button type="button" className="danger-button" disabled={busyId === `asset-${a.id}`} onClick={() => deleteAsset(a)}>{busyId === `asset-${a.id}` ? 'Deleting...' : 'Delete'}</button></div></td></tr>)}
        {!filteredAssets.length && <tr><td colSpan="6">No matching devices.</td></tr>}
      </tbody></table></div>
    </section>}
    {attachmentTicket && <div className="attachment-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setAttachmentTicket(null); }}><div className="attachment-modal" role="dialog" aria-modal="true"><div className="attachment-modal-header"><h2>Ticket #{attachmentTicket.id} Attachments</h2><button type="button" aria-label="Close" onClick={() => setAttachmentTicket(null)}>×</button></div><TicketAttachments ticketId={attachmentTicket.id} /></div></div>}
    {editing !== null && <div className="asset-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !saving) setEditing(null); }}>
      <div className="asset-modal" role="dialog" aria-modal="true" aria-labelledby="asset-form-title">
        <h2 id="asset-form-title">{editing === 'new' ? 'Add Device' : 'Edit Device'}</h2>
        <form onSubmit={saveAsset} className="asset-form">
          <label>Device Name<input required maxLength="150" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dell Latitude 7440" /></label>
          <label>Asset Tag<input required maxLength="50" value={form.assetTag} onChange={e => setForm({ ...form, assetTag: e.target.value })} placeholder="LT-1006" /></label>
          <label>Device Type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{['Laptop','Desktop','Monitor','Printer','Tablet','Phone','Other'].map(t => <option key={t}>{t}</option>)}</select></label>
          <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Repair</option><option>Retired</option></select></label>
          <label>Assigned Employee<select value={form.assignedUserId} onChange={e => setForm({ ...form, assignedUserId: e.target.value })}><option value="">Unassigned</option>{users.filter(u => u.role === 'Employee').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
          <div className="asset-modal-actions"><button type="button" className="edit-button" disabled={saving} onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="primary-action" disabled={saving}>{saving ? 'Saving...' : editing === 'new' ? 'Add Device' : 'Save Changes'}</button></div>
        </form>
      </div>
    </div>}
  </div>;
}
