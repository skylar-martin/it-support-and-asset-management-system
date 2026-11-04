import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './employee-form.css';
import './ticket-edit.css';
import TicketAttachments, { checkFiles, uploadFiles } from './TicketAttachments';

const badge = (value, type = 'status') => <span className={`demo-badge ${type}-${String(value).toLowerCase().replaceAll(' ', '-')}`}><span className="badge-dot" />{value}</span>;

export default function EmployeeDashboard({ user, activeSection = '' }) {
  const [assets, setAssets] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assetId, setAssetId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [attachmentTicket, setAttachmentTicket] = useState(null);

  async function loadData() {
    try {
      const [allAssets, allTickets] = await Promise.all([api.getAssets(), api.getTickets()]);
      setAssets(allAssets.filter(a => a.assignedUserId === user.id));
      setTickets(allTickets.filter(t => t.userId === user.id));
      setError('');
    } catch (err) { setError(`Could not load dashboard: ${err.message}`); }
  }
  useEffect(() => { loadData(); }, [user.id]);

  useEffect(() => {
    if (!editing) return;
    function handleEscape(event) {
      if (event.key === 'Escape' && !editSaving) setEditing(null);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [editing, editSaving]);

  async function submitTicket(e) {
    e.preventDefault(); setSaving(true);
    try {
      const problem = checkFiles(newFiles);
      if (problem) throw new Error(problem);
      const created = await api.createTicket({ userId: user.id, assetId: assetId ? Number(assetId) : null, title, description, priority, status: 'Open' });
      setTitle(''); setDescription(''); setAssetId(''); setPriority('Medium'); setNewFiles([]);
      await loadData();
      if (newFiles.length) {
        try { await uploadFiles(created.id, newFiles); }
        catch (uploadError) { setError(`Ticket #${created.id} was created, but some attachments failed: ${uploadError.message}. Use its Attachments button to retry.`); }
      }
    } catch (err) { setError(`Could not create ticket: ${err.message}`); }
    finally { setSaving(false); }
  }

  function startEdit(ticket) {
    setError('');
    setEditing({
      id: ticket.id,
      title: ticket.title ?? '',
      description: ticket.description ?? '',
      priority: ticket.priority ?? 'Medium',
      assetId: ticket.assetId == null ? '' : String(ticket.assetId),
      status: ticket.status,
      userId: ticket.userId,
    });
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editing) return;
    setEditSaving(true);
    setError('');
    try {
      await api.updateTicket(editing.id, {
        title: editing.title.trim(),
        description: editing.description.trim(),
        priority: editing.priority,
        assetId: editing.assetId ? Number(editing.assetId) : null,
        // Keep the existing status and owner. Employees cannot change either here.
        status: editing.status,
        userId: user.id,
      });
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(`Could not update ticket: ${err.message}`);
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteTicket(ticket) {
    if (!window.confirm(`Permanently delete ticket #${ticket.id}: "${ticket.title}"?`)) return;
    setDeleting(ticket.id);
    try { await api.deleteTicket(ticket.id); if (editing?.id === ticket.id) setEditing(null); await loadData(); }
    catch (err) { setError(`Could not delete ticket: ${err.message}`); }
    finally { setDeleting(null); }
  }

  return <div className="dashboard">
    <div className="page-heading"><h1>Employee Dashboard</h1><p>Welcome back, {user.name}.</p></div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="stats">
      <div className="stat-card"><span>Assigned Devices</span><strong>{assets.length}</strong></div>
      <div className="stat-card"><span>Open Tickets</span><strong>{tickets.filter(t => t.status === 'Open').length}</strong></div>
      <div className="stat-card"><span>Resolved Tickets</span><strong>{tickets.filter(t => t.status === 'Resolved').length}</strong></div>
    </div>
    {activeSection === 'employee-devices' && <section id="employee-devices" className="panel"><h2>My Assigned Devices</h2><div className="table-wrap"><table><thead><tr><th>Asset Tag</th><th>Device</th><th>Type</th><th>Status</th></tr></thead><tbody>
      {assets.map(a => <tr key={a.id}><td>{a.assetTag}</td><td>{a.name}</td><td>{a.type}</td><td>{badge(a.status, 'asset')}</td></tr>)}
      {!assets.length && <tr><td colSpan="4">No assigned devices.</td></tr>}
    </tbody></table></div></section>}
    {activeSection === 'employee-tickets' && <><section id="employee-tickets" className="panel employee-ticket-panel">
      <div className="employee-ticket-header"><h2>Submit Support Ticket</h2><p>Tell the IT team what you need help with.</p></div>
      <form onSubmit={submitTicket} className="ticket-form employee-ticket-form">
        <div className="employee-field"><label htmlFor="ticket-title">Issue title <span>*</span></label><input id="ticket-title" placeholder="e.g. Laptop won't connect to Wi-Fi" value={title} onChange={e => setTitle(e.target.value)} required /></div>
        <div className="employee-form-row">
          <div className="employee-field"><label htmlFor="ticket-device">Related device</label><select id="ticket-device" value={assetId} onChange={e => setAssetId(e.target.value)}><option value="">General issue / No device</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div className="employee-field"><label htmlFor="ticket-priority">Priority</label><select id="ticket-priority" value={priority} onChange={e => setPriority(e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></div>
        </div>
        <div className="employee-priority-note">Priority level {badge(priority, 'priority')}</div>
        <div className="employee-field"><label htmlFor="ticket-description">Description <span>*</span></label><textarea id="ticket-description" placeholder="Describe what happened, when it started, and any troubleshooting you've tried..." value={description} onChange={e => setDescription(e.target.value)} rows={5} required /></div>
        <div className="employee-field"><label htmlFor="new-ticket-files">Attachments (optional)</label><input id="new-ticket-files" type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt,.docx" onChange={e => setNewFiles(Array.from(e.target.files))} /><small>PNG, JPG, PDF, TXT, DOCX · 10 MB per file</small></div>
        <div className="employee-form-actions"><button className="employee-submit-button" disabled={saving} type="submit">{saving ? 'Submitting...' : 'Submit Support Ticket'}</button></div>
      </form>
    </section>
    <section className="panel"><h2>My Support Tickets</h2><div className="table-wrap"><table><thead><tr><th>Ticket #</th><th>Issue</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {tickets.map(t => <tr key={t.id}><td>#{t.id}</td><td>{t.title}</td><td>{badge(t.priority, 'priority')}</td><td>{badge(t.status)}</td><td><div className="ticket-row-actions"><button type="button" className="attachment-view-button" onClick={() => setAttachmentTicket(t)}>Attachments</button><button type="button" className="ticket-edit-button" onClick={() => startEdit(t)}>Edit</button><button type="button" className="danger-button" disabled={deleting === t.id} onClick={() => deleteTicket(t)}>{deleting === t.id ? 'Deleting...' : 'Delete'}</button></div></td></tr>)}
      {!tickets.length && <tr><td colSpan="5">No support tickets yet.</td></tr>}
    </tbody></table></div>
    </section>
    {attachmentTicket && <div className="attachment-modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setAttachmentTicket(null); }}><div className="attachment-modal" role="dialog" aria-modal="true"><div className="attachment-modal-header"><h2>Ticket #{attachmentTicket.id} Attachments</h2><button type="button" aria-label="Close" onClick={() => setAttachmentTicket(null)}>×</button></div><TicketAttachments ticketId={attachmentTicket.id} canDelete /></div></div>}
    {editing && <div className="ticket-edit-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !editSaving) setEditing(null); }}>
      <div className="ticket-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="ticket-edit-title">
        <form className="ticket-edit-form" onSubmit={saveEdit}>
      <div className="ticket-edit-heading"><div><h3 id="ticket-edit-title">Edit Ticket #{editing.id}</h3><p>Update the issue details. Ticket status is managed by IT.</p></div><button type="button" className="ticket-edit-close" aria-label="Close edit ticket" disabled={editSaving} onClick={() => setEditing(null)}>×</button></div>
      <div className="employee-field"><label htmlFor="edit-ticket-title">Issue title</label><input id="edit-ticket-title" required maxLength={200} value={editing.title} onChange={e => setEditing(v => ({...v, title:e.target.value}))} /></div>
      <div className="employee-form-row">
        <div className="employee-field"><label htmlFor="edit-ticket-device">Related device</label><select id="edit-ticket-device" value={editing.assetId} onChange={e => setEditing(v => ({...v, assetId:e.target.value}))}><option value="">General issue / No device</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div className="employee-field"><label htmlFor="edit-ticket-priority">Priority</label><select id="edit-ticket-priority" value={editing.priority} onChange={e => setEditing(v => ({...v, priority:e.target.value}))}><option>Low</option><option>Medium</option><option>High</option></select></div>
      </div>
      <div className="employee-field"><label htmlFor="edit-ticket-description">Description</label><textarea id="edit-ticket-description" required rows={5} value={editing.description} onChange={e => setEditing(v => ({...v, description:e.target.value}))} /></div>
      <TicketAttachments ticketId={editing.id} canDelete />
      <div className="ticket-edit-actions"><button type="button" className="ticket-edit-cancel" disabled={editSaving} onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="employee-submit-button" disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</button></div>
        </form>
      </div>
    </div>}
    </>}
  </div>;
}
