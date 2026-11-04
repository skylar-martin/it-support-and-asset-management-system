import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './ticket-attachments.css';

const MAX = 10 * 1024 * 1024;
const allowed = ['png', 'jpg', 'jpeg', 'pdf', 'txt', 'docx'];
export function checkFiles(files) {
  for (const f of files) {
    if (f.size > MAX || !f.size) return `${f.name}: files must be between 1 byte and 10 MB.`;
    if (!allowed.includes(f.name.split('.').pop().toLowerCase())) return `${f.name}: unsupported file type.`;
  }
  return '';
}
export async function uploadFiles(ticketId, files) {
  for (const file of files) await api.uploadAttachment(ticketId, file);
}
export default function TicketAttachments({ ticketId, canDelete = false }) {
  const [items, setItems] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = async () => { setItems(await api.getAttachments(ticketId)); };
  useEffect(() => { setItems([]); setError(''); refresh().catch(e => setError(e.message)); }, [ticketId]);
  const add = async () => {
    const problem = checkFiles(files); if (problem) { setError(problem); return; }
    setBusy(true); setError('');
    try { await uploadFiles(ticketId, files); setFiles([]); await refresh(); }
    catch(e) { setError(`Upload failed: ${e.message}`); await refresh().catch(() => {}); }
    finally { setBusy(false); }
  };
  const remove = async item => {
    if (!window.confirm(`Remove ${item.originalFileName}?`)) return;
    setBusy(true); setError('');
    try { await api.deleteAttachment(ticketId, item.id); await refresh(); }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  };
  return <div className="ticket-attachments">
    <h3>Attachments</h3>
    {error && <p className="attachment-error" role="alert">{error}</p>}
    {items.length ? <ul>{items.map(item => <li key={item.id}>
      <span>{item.originalFileName} <small>({(item.sizeBytes / 1024).toFixed(1)} KB)</small></span>
      <div className="attachment-actions"><button type="button" onClick={() => api.downloadAttachment(ticketId, item).catch(e => setError(e.message))}>Download</button>
      {canDelete && <button type="button" disabled={busy} onClick={() => remove(item)}>Remove</button>}</div>
    </li>)}</ul> : <p className="attachment-muted">No attachments yet.</p>}
    {canDelete && <div className="attachment-upload"><input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt,.docx" onChange={e => setFiles(Array.from(e.target.files))} />
      <button type="button" disabled={busy || !files.length} onClick={add}>{busy ? 'Uploading...' : 'Upload files'}</button></div>}
    {canDelete && <small className="attachment-muted">PNG, JPG, PDF, TXT, DOCX · 10 MB maximum per file</small>}
  </div>;
}
