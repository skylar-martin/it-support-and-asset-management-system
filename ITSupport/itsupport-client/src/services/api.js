const API = '/api';
async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}
export const api = {
  getUsers: () => request('/users'),
  getAssets: () => request('/assets'),
  getTickets: () => request('/tickets'),
  createTicket: data => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id, data) => request(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTicket: id => request(`/tickets/${id}`, { method: 'DELETE' }),
  getAttachments: id => request(`/tickets/${id}/attachments`),
  deleteAttachment: (id, attachmentId) => request(`/tickets/${id}/attachments/${attachmentId}`, { method: 'DELETE' }),
  uploadAttachment: async (id, file) => {
    const form = new FormData(); form.append('file', file);
    const response = await fetch(`/api/tickets/${id}/attachments`, { method: 'POST', body: form });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  downloadAttachment: async (id, attachment) => {
    const response = await fetch(`/api/tickets/${id}/attachments/${attachment.id}/download`);
    if (!response.ok) throw new Error(await response.text());
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = attachment.originalFileName;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  },
};

export const assetApi = {
  create: data => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: id => request(`/assets/${id}`, { method: 'DELETE' }),
};
