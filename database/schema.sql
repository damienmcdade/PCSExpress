-- PCS EXPRESS DATABASE SCHEMA
-- PostgreSQL DDL for operational military PCS system

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  rank VARCHAR(10) NOT NULL CHECK (rank IN ('E-1','E-2','E-3','E-4','E-5','E-6','E-7','E-8','E-9','W-1','W-2','O-1','O-2','O-3','O-4','O-5','O-6','O-7','O-8','O-9','O-10')),
  branch VARCHAR(50) NOT NULL CHECK (branch IN ('Army','Navy','Marine Corps','Air Force','Space Force','Coast Guard')),
  unit VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','commander')),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  component VARCHAR(50) CHECK (component IN ('Active Duty','Reserve','National Guard','AGR','FTNG')),
  paygrade VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_branch ON users(branch);
CREATE INDEX idx_users_role ON users(role);

-- PCS Moves Table
CREATE TABLE pcs_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  departure_date DATE NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  is_overseas BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  family_size INTEGER,
  has_dependents BOOLEAN DEFAULT FALSE,
  num_children INTEGER DEFAULT 0,
  child_ages INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  bedrooms_needed INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_pcs_user ON pcs_moves(user_id);
CREATE INDEX idx_pcs_status ON pcs_moves(status);
CREATE INDEX idx_pcs_departure ON pcs_moves(departure_date);

-- Tasks Table
CREATE TABLE pcs_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pcs_id UUID NOT NULL REFERENCES pcs_moves(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  due_date DATE,
  completed_at TIMESTAMP,
  category VARCHAR(50) CHECK (category IN ('orders','housing','finance','medical','schools','family','household')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_pcs ON pcs_tasks(pcs_id);
CREATE INDEX idx_tasks_status ON pcs_tasks(status);
CREATE INDEX idx_tasks_priority ON pcs_tasks(priority);
CREATE INDEX idx_tasks_due_date ON pcs_tasks(due_date);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pcs_id UUID REFERENCES pcs_moves(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(1024) NOT NULL,
  file_type VARCHAR(50),
  doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('orders','receipt','hhg_authorization','travel_authorization','medical_records','school_records','other')),
  file_size INTEGER,
  extracted_data JSONB,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id)
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_pcs ON documents(pcs_id);
CREATE INDEX idx_documents_type ON documents(doc_type);

-- Financial Table
CREATE TABLE financial_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  pcs_id UUID REFERENCES pcs_moves(id) ON DELETE CASCADE,
  dla_estimate DECIMAL(10,2),
  dla_approved DECIMAL(10,2),
  tle_estimate DECIMAL(10,2),
  tle_approved DECIMAL(10,2),
  mileage_rate DECIMAL(10,4),
  mileage_distance DECIMAL(10,2),
  mileage_reimbursement DECIMAL(10,2),
  hhg_cost_estimate DECIMAL(10,2),
  hhg_cost_actual DECIMAL(10,2),
  other_expenses JSONB DEFAULT '[]'::JSONB,
  total_authorized DECIMAL(10,2),
  total_spent DECIMAL(10,2),
  reimbursement_status VARCHAR(20) NOT NULL DEFAULT 'not_submitted' CHECK (reimbursement_status IN ('not_submitted','pending','approved','paid','disputed')),
  submitted_date TIMESTAMP,
  approved_date TIMESTAMP,
  paid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_financial_user ON financial_tracking(user_id);
CREATE INDEX idx_financial_pcs ON financial_tracking(pcs_id);
CREATE INDEX idx_financial_status ON financial_tracking(reimbursement_status);

-- Commander Dashboard Snapshot Table
CREATE TABLE commander_dashboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commander_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit VARCHAR(255) NOT NULL,
  snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_personnel INTEGER,
  ready_percentage INTEGER,
  at_risk_percentage INTEGER,
  delayed_percentage INTEGER,
  avg_readiness_score INTEGER,
  pending_approvals INTEGER,
  data JSONB
);

CREATE INDEX idx_dashboard_commander ON commander_dashboard(commander_id);
CREATE INDEX idx_dashboard_unit ON commander_dashboard(unit);

-- Audit Log Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Sessions Table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
