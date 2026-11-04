-- =====================================================================
-- IT Support & Management System
-- Target: SQL Server (T-SQL) - works with Visual Studio SQL tools / LocalDB
-- Tables: departments, employees, asset_categories, assets,
--         asset_assignments, ticket_categories, tickets,
--         ticket_comments, ticket_assets
-- =====================================================================
 
-- ---------------------------------------------------------------------
-- DATABASE (run this block while connected to master)
-- If you are already connected to a database you want to use,
-- delete this block and the USE line below.
-- ---------------------------------------------------------------------
IF DB_ID('it_support') IS NOT NULL
BEGIN
    ALTER DATABASE it_support SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE it_support;
END
GO
 
CREATE DATABASE it_support;
GO
 
USE it_support;
GO
 
-- ---------------------------------------------------------------------
-- DEPARTMENTS
-- ---------------------------------------------------------------------
CREATE TABLE departments (
    department_id   INT IDENTITY(1,1) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    location        VARCHAR(100) NULL,
    created_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO
 
-- ---------------------------------------------------------------------
-- EMPLOYEES  (includes both regular staff and IT technicians)
-- ---------------------------------------------------------------------
CREATE TABLE employees (
    employee_id     INT IDENTITY(1,1) PRIMARY KEY,
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(25)  NULL,
    job_title       VARCHAR(100) NULL,
    department_id   INT NULL,
    manager_id      INT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'employee',
    hire_date       DATE NULL,
    is_active       BIT NOT NULL DEFAULT 1,
    created_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 
    CONSTRAINT chk_emp_role CHECK (role IN ('employee','technician','admin')),
    CONSTRAINT fk_emp_department FOREIGN KEY (department_id)
        REFERENCES departments(department_id) ON DELETE SET NULL,
    -- SQL Server does not allow SET NULL / CASCADE on a self-referencing key,
    -- so reassign or clear manager_id before deleting a manager.
    CONSTRAINT fk_emp_manager FOREIGN KEY (manager_id)
        REFERENCES employees(employee_id)
);
GO
CREATE INDEX idx_emp_department ON employees(department_id);
CREATE INDEX idx_emp_role ON employees(role);
GO
 
-- ---------------------------------------------------------------------
-- ASSET CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE asset_categories (
    category_id     INT IDENTITY(1,1) PRIMARY KEY,
    name            VARCHAR(80) NOT NULL UNIQUE,   -- Laptop, Monitor, Server...
    description     VARCHAR(255) NULL
);
GO
 
-- ---------------------------------------------------------------------
-- ASSETS
-- ---------------------------------------------------------------------
CREATE TABLE assets (
    asset_id        INT IDENTITY(1,1) PRIMARY KEY,
    asset_tag       VARCHAR(50)  NOT NULL UNIQUE,  -- e.g. LT-00123
    category_id     INT NOT NULL,
    name            VARCHAR(120) NOT NULL,
    manufacturer    VARCHAR(80)  NULL,
    model           VARCHAR(80)  NULL,
    serial_number   VARCHAR(100) NULL,
    purchase_date   DATE NULL,
    purchase_cost   DECIMAL(10,2) NULL,
    warranty_expiry DATE NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'in_stock',
    location        VARCHAR(100) NULL,
    notes           NVARCHAR(MAX) NULL,
    created_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 
    CONSTRAINT chk_asset_status CHECK (status IN ('in_stock','assigned','in_repair','retired','lost')),
    CONSTRAINT fk_asset_category FOREIGN KEY (category_id)
        REFERENCES asset_categories(category_id)
);
GO
-- Unique serial numbers, but allow many assets with no serial number
CREATE UNIQUE INDEX uq_asset_serial ON assets(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX idx_asset_status ON assets(status);
CREATE INDEX idx_asset_category ON assets(category_id);
GO
 
-- ---------------------------------------------------------------------
-- ASSET ASSIGNMENTS  (history of who held which asset)
-- A NULL returned_date means the asset is currently assigned.
-- ---------------------------------------------------------------------
CREATE TABLE asset_assignments (
    assignment_id   INT IDENTITY(1,1) PRIMARY KEY,
    asset_id        INT NOT NULL,
    employee_id     INT NOT NULL,
    assigned_date   DATE NOT NULL,
    returned_date   DATE NULL,
    assigned_by     INT NULL,
    notes           VARCHAR(255) NULL,
 
    CONSTRAINT fk_assign_asset FOREIGN KEY (asset_id)
        REFERENCES assets(asset_id) ON DELETE CASCADE,
    CONSTRAINT fk_assign_employee FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id),
    CONSTRAINT fk_assign_by FOREIGN KEY (assigned_by)
        REFERENCES employees(employee_id) ON DELETE SET NULL,
    CONSTRAINT chk_assign_dates CHECK (returned_date IS NULL OR returned_date >= assigned_date)
);
GO
CREATE INDEX idx_assign_asset ON asset_assignments(asset_id);
CREATE INDEX idx_assign_employee ON asset_assignments(employee_id);
GO
 
-- ---------------------------------------------------------------------
-- TICKET CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE ticket_categories (
    category_id     INT IDENTITY(1,1) PRIMARY KEY,
    name            VARCHAR(80) NOT NULL UNIQUE,   -- Hardware, Software, Network...
    description     VARCHAR(255) NULL
);
GO
 
-- ---------------------------------------------------------------------
-- TICKETS
-- ---------------------------------------------------------------------
CREATE TABLE tickets (
    ticket_id        INT IDENTITY(1,1) PRIMARY KEY,
    title            VARCHAR(200) NOT NULL,
    description      NVARCHAR(MAX) NOT NULL,
    category_id      INT NOT NULL,
    priority         VARCHAR(10) NOT NULL DEFAULT 'medium',
    status           VARCHAR(15) NOT NULL DEFAULT 'open',
    requester_id     INT NOT NULL,                 -- employee who submitted
    assigned_to      INT NULL,                     -- technician handling it
    created_at       DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at       DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    due_date         DATETIME2 NULL,
    resolved_at      DATETIME2 NULL,
    closed_at        DATETIME2 NULL,
    resolution_notes NVARCHAR(MAX) NULL,
 
    CONSTRAINT chk_ticket_priority CHECK (priority IN ('low','medium','high','critical')),
    CONSTRAINT chk_ticket_status CHECK (status IN ('open','in_progress','on_hold','resolved','closed')),
    CONSTRAINT fk_ticket_category FOREIGN KEY (category_id)
        REFERENCES ticket_categories(category_id),
    CONSTRAINT fk_ticket_requester FOREIGN KEY (requester_id)
        REFERENCES employees(employee_id),
    CONSTRAINT fk_ticket_assignee FOREIGN KEY (assigned_to)
        REFERENCES employees(employee_id) ON DELETE SET NULL
);
GO
CREATE INDEX idx_ticket_status ON tickets(status);
CREATE INDEX idx_ticket_priority ON tickets(priority);
CREATE INDEX idx_ticket_requester ON tickets(requester_id);
CREATE INDEX idx_ticket_assignee ON tickets(assigned_to);
GO
 
-- ---------------------------------------------------------------------
-- TICKET COMMENTS  (conversation / work log on a ticket)
-- ---------------------------------------------------------------------
CREATE TABLE ticket_comments (
    comment_id      INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id       INT NOT NULL,
    author_id       INT NOT NULL,
    body            NVARCHAR(MAX) NOT NULL,
    is_internal     BIT NOT NULL DEFAULT 0,        -- internal tech notes
    created_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 
    CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_author FOREIGN KEY (author_id)
        REFERENCES employees(employee_id)
);
GO
CREATE INDEX idx_comment_ticket ON ticket_comments(ticket_id);
GO
 
-- ---------------------------------------------------------------------
-- TICKET <-> ASSET  (many-to-many: which assets a ticket concerns)
-- ---------------------------------------------------------------------
CREATE TABLE ticket_assets (
    ticket_id       INT NOT NULL,
    asset_id        INT NOT NULL,
    PRIMARY KEY (ticket_id, asset_id),
    CONSTRAINT fk_ta_ticket FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    CONSTRAINT fk_ta_asset FOREIGN KEY (asset_id)
        REFERENCES assets(asset_id) ON DELETE CASCADE
);
GO
 
-- =====================================================================
-- TRIGGERS  (keep updated_at current; SQL Server has no ON UPDATE clause)
-- =====================================================================
CREATE TRIGGER trg_employees_updated ON employees AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE e SET updated_at = SYSDATETIME()
    FROM employees e JOIN inserted i ON e.employee_id = i.employee_id;
END
GO
 
CREATE TRIGGER trg_assets_updated ON assets AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE a SET updated_at = SYSDATETIME()
    FROM assets a JOIN inserted i ON a.asset_id = i.asset_id;
END
GO
 
CREATE TRIGGER trg_tickets_updated ON tickets AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t SET updated_at = SYSDATETIME()
    FROM tickets t JOIN inserted i ON t.ticket_id = i.ticket_id;
END
GO
 
-- =====================================================================
-- VIEWS
-- =====================================================================
 
-- Current holder of each assigned asset
CREATE VIEW v_current_asset_holders AS
SELECT a.asset_id, a.asset_tag, a.name AS asset_name, c.name AS category,
       e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
       aa.assigned_date
FROM assets a
JOIN asset_categories c   ON c.category_id = a.category_id
JOIN asset_assignments aa ON aa.asset_id = a.asset_id AND aa.returned_date IS NULL
JOIN employees e          ON e.employee_id = aa.employee_id;
GO
 
-- Open ticket queue with requester and technician names
CREATE VIEW v_open_tickets AS
SELECT t.ticket_id, t.title, t.priority, t.status, tc.name AS category,
       CONCAT(r.first_name, ' ', r.last_name) AS requester,
       CONCAT(tech.first_name, ' ', tech.last_name) AS technician,
       t.created_at, t.due_date
FROM tickets t
JOIN ticket_categories tc ON tc.category_id = t.category_id
JOIN employees r          ON r.employee_id = t.requester_id
LEFT JOIN employees tech  ON tech.employee_id = t.assigned_to
WHERE t.status IN ('open','in_progress','on_hold');
GO
 
-- =====================================================================
-- SAMPLE DATA
-- =====================================================================
INSERT INTO departments (name, location) VALUES
('IT', 'Building A'), ('HR', 'Building B'), ('Finance', 'Building B'), ('Sales', 'Building C');
 
INSERT INTO employees (first_name, last_name, email, job_title, department_id, role, hire_date) VALUES
('Dana',  'Reyes',   'dana.reyes@example.com',   'IT Manager',         1, 'admin',      '2019-03-11'),
('Marcus','Lee',     'marcus.lee@example.com',   'Support Technician', 1, 'technician', '2021-06-01'),
('Priya', 'Shah',    'priya.shah@example.com',   'HR Specialist',      2, 'employee',   '2022-01-17'),
('Tom',   'Nguyen',  'tom.nguyen@example.com',   'Accountant',         3, 'employee',   '2020-09-08'),
('Elena', 'Garcia',  'elena.garcia@example.com', 'Sales Rep',          4, 'employee',   '2023-02-20');
 
UPDATE employees SET manager_id = 1 WHERE employee_id = 2;
 
INSERT INTO asset_categories (name, description) VALUES
('Laptop','Portable computers'), ('Desktop','Desktop workstations'),
('Monitor','Displays'), ('Server','Rack/virtual servers'), ('Phone','Mobile devices');
 
INSERT INTO assets (asset_tag, category_id, name, manufacturer, model, serial_number,
                    purchase_date, purchase_cost, warranty_expiry, status, location) VALUES
('LT-0001', 1, 'Dell Latitude 5440', 'Dell',  'Latitude 5440', 'SN-DL-001', '2023-01-15', 1150.00, '2026-01-15', 'assigned', 'Building B'),
('LT-0002', 1, 'MacBook Pro 14',     'Apple', 'MBP14 M3',      'SN-AP-002', '2023-05-02', 1999.00, '2026-05-02', 'assigned', 'Building C'),
('MN-0001', 3, 'Dell 27" Monitor',   'Dell',  'U2723QE',       'SN-DM-003', '2022-11-10',  620.00, '2025-11-10', 'in_stock', 'IT Storage'),
('SV-0001', 4, 'Primary File Server','HPE',   'ProLiant DL380','SN-HP-004', '2021-04-20', 7800.00, '2026-04-20', 'assigned', 'Server Room');
 
INSERT INTO asset_assignments (asset_id, employee_id, assigned_date, assigned_by) VALUES
(1, 3, '2023-01-20', 2), (2, 5, '2023-05-05', 2), (4, 1, '2021-05-01', 1);
 
INSERT INTO ticket_categories (name, description) VALUES
('Hardware','Physical device issues'), ('Software','Application and OS issues'),
('Network','Connectivity problems'), ('Access','Accounts and permissions');
 
INSERT INTO tickets (title, description, category_id, priority, status, requester_id, assigned_to, due_date) VALUES
('Laptop will not boot', 'Screen stays black after power on.', 1, 'high', 'in_progress', 3, 2, DATEADD(DAY, 2, SYSDATETIME())),
('Cannot access shared drive', 'Permission denied on Finance share.', 4, 'medium', 'open', 4, NULL, NULL),
('VPN keeps disconnecting', 'Drops every 10 minutes when remote.', 3, 'medium', 'open', 5, 2, DATEADD(DAY, 3, SYSDATETIME()));
 
INSERT INTO ticket_assets (ticket_id, asset_id) VALUES (1, 1), (3, 2);
 
INSERT INTO ticket_comments (ticket_id, author_id, body, is_internal) VALUES
(1, 2, 'Picked up the laptop; testing the power adapter and battery.', 0),
(1, 2, 'Possible motherboard fault. Check warranty status.', 1);
GO