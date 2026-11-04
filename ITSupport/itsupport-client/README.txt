IT SUPPORT DASHBOARD UPGRADE

Copy the CONTENTS of this package into your existing itsupport-client folder, preserving the src folder structure.
Overwrite: src/App.jsx, src/pages/EmployeeDashboard.jsx, src/pages/AdminDashboard.jsx, src/services/api.js, vite.config.js.
Add: src/dashboard-upgrade.css.
Keep: your existing src/App.css, src/index.css, package.json, node_modules, main.jsx.

Restart Vite (Ctrl+C then npm run dev) and keep your ASP.NET Core API running.
The existing API must support POST /api/assets, PUT /api/assets/{id}, DELETE /api/assets/{id}, DELETE /api/tickets/{id}.
The provided earlier ITSupport.API backend supports those endpoints.

Priority: Low green, Medium yellow, High red.
Ticket status: Open blue, In Progress yellow, Resolved green.
Device status: Active green, Repair yellow, Retired red.

IMPORTANT: This is a demo without authentication/authorization. The employee ticket delete control is not permission-enforced on the server. Do not deploy publicly.
Deleting tickets is permanent. Deleting an asset may clear its link from related tickets depending on database foreign-key behavior.
