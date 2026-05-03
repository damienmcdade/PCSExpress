/**
 * PCS Express - DoD Operational System
 * Database Schema (SQLite for MVP)
 */

-- Users (Service Members)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  rank TEXT,
  name TEXT,
  branch TEXT,
  mos TEXT,
  dependents INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PCS Orders
CREATE TABLE pcs_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  from_base TEXT,
  to_base TEXT,
  effective_date DATE,
  move_type TEXT, -- CONUS, OCONUS
  orders_file_url TEXT,
  status TEXT, -- pending, uploaded, verified
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- PCS Tasks (Dynamic Checklist)
CREATE TABLE pcs_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  order_id TEXT,
  task_name TEXT,
  task_type TEXT, -- orders, hhg, travel, reimbursement, medical
  deadline DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_date DATETIME,
  priority TEXT, -- high, medium, low
  rank_required TEXT,
  dependents_required INTEGER,
  is_oconus BOOLEAN,
  dependencies TEXT, -- JSON array of task_ids
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES pcs_orders(id)
);

-- Risk Assessments
CREATE TABLE risk_assessments (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  order_id TEXT,
  readiness_percentage INTEGER,
  at_risk BOOLEAN,
  risks TEXT, -- JSON array
  score_date DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES pcs_orders(id)
);

-- Financial Data
CREATE TABLE financial_data (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  order_id TEXT,
  rank TEXT,
  dependents INTEGER,
  dla_estimate DECIMAL,
  tle_estimate DECIMAL,
  hhg_allowance DECIMAL,
  expenses DECIMAL DEFAULT 0,
  reimbursement_status TEXT, -- pending, submitted, approved, paid
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES pcs_orders(id)
);

-- Documents
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  order_id TEXT,
  document_type TEXT, -- orders, receipt, invoice
  file_url TEXT,
  extracted_data TEXT, -- JSON
  uploaded_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES pcs_orders(id)
);

-- HHG Tracking (Mock Integration)
CREATE TABLE hhg_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  order_id TEXT,
  status TEXT, -- scheduled, picked_up, in_transit, delivered
  pickup_date DATE,
  delivery_date DATE,
  current_location TEXT,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES pcs_orders(id)
);

-- OCONUS Bases Reference
CREATE TABLE oconus_bases (
  id TEXT PRIMARY KEY,
  base_name TEXT UNIQUE,
  country TEXT,
  region TEXT,
  status TEXT, -- available, unavailable
  dod_diem DECIMAL,
  tle_days INTEGER,
  hhg_allowance DECIMAL,
  notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pcs_orders_user ON pcs_orders(user_id);
CREATE INDEX idx_pcs_tasks_user ON pcs_tasks(user_id);
CREATE INDEX idx_pcs_tasks_deadline ON pcs_tasks(deadline);
CREATE INDEX idx_risk_assessments_user ON risk_assessments(user_id);
CREATE INDEX idx_financial_user ON financial_data(user_id);
