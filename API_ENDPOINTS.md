/**
 * PCS EXPRESS DoD API Endpoints
 * RESTful API for operational system
 */

// ============= AUTHENTICATION =============
POST /api/auth/login
  Request: { email, password }
  Response: { token, user, role }

GET /api/auth/user
  Response: { user, role, permissions }

POST /api/auth/logout
  Response: { status: 'ok' }

// ============= PCS ORDERS =============
POST /api/orders
  Request: { from_base, to_base, effective_date, move_type, orders_file }
  Response: { order_id, status, tasks_generated }

GET /api/orders/:orderId
  Response: { order, tasks, risks, financial }

PUT /api/orders/:orderId/status
  Request: { status }
  Response: { order }

GET /api/orders/user/:userId
  Response: [orders]

// ============= DYNAMIC CHECKLIST =============
GET /api/tasks/user/:userId
  Response: [tasks with completion status]

GET /api/tasks/:taskId
  Response: { task, dependencies_status, deadline_status }

PUT /api/tasks/:taskId/complete
  Request: { completed_date, notes }
  Response: { task, updated_checklist, new_risks }

POST /api/tasks/generate
  Request: { user_id, rank, dependents, move_type }
  Response: [generated_tasks]

// ============= RISK SCORING =============
GET /api/risk-assessment/:userId
  Response: { readiness_percentage, at_risk, risks, recommendations }

POST /api/risk-assessment/calculate
  Request: { user_id, order_id }
  Response: { readiness_percentage, risk_flags }

// ============= COMMAND DASHBOARD =============
GET /api/dashboard/command
  Query: { branch, base, status_filter }
  Response: {
    total_active_pcs: number,
    at_risk_personnel: [users],
    readiness_by_branch: {},
    bottlenecks: [tasks],
    upcoming_deadlines: [tasks]
  }

GET /api/dashboard/command/personnel
  Response: [{
    user_id,
    name,
    rank,
    order,
    readiness_percentage,
    at_risk,
    risks,
    deadline
  }]

// ============= FINANCIAL MODULE =============
GET /api/financial/:userId
  Response: {
    rank,
    dependents,
    dla_estimate,
    tle_estimate,
    hhg_allowance,
    total_estimate,
    expenses,
    reimbursement_status
  }

POST /api/financial/estimate
  Request: { rank, dependents, from_base, to_base, move_type }
  Response: { dla, tle, hhg, total }

POST /api/financial/submit-reimbursement
  Request: { user_id, receipts, total }
  Response: { reimbursement_id, status }

// ============= DOCUMENT UPLOAD & PARSING =============
POST /api/documents/upload
  Request: { user_id, order_id, document_type, file }
  Response: { document_id, extracted_data }

GET /api/documents/:userId
  Response: [documents with extracted data]

POST /api/documents/parse
  Request: { document_id, file_type }
  Response: { extracted_fields }

// ============= HHG TRACKING (MOCK) =============
GET /api/hhg/:userId
  Response: {
    status,
    pickup_date,
    delivery_date,
    current_location,
    tracking_history
  }

POST /api/hhg/schedule
  Request: { user_id, order_id, preferred_dates }
  Response: { hhg_id, scheduled_date, tracking_number }

// ============= OCONUS BASES =============
GET /api/bases/oconus
  Query: { country, status }
  Response: [bases with financial data]

GET /api/bases/oconus/:baseId
  Response: { base, diem_rates, allowances, requirements }

POST /api/bases/oconus/sync
  Response: { updated_count, status }

// ============= NOTIFICATIONS =============
GET /api/notifications/:userId
  Response: [notifications]

POST /api/notifications/send
  Request: { user_id, message, type }
  Response: { notification_id }

// ============= ADMIN/COMMANDER =============
POST /api/admin/users
  Request: { email, rank, name, branch }
  Response: { user_id }

PUT /api/admin/users/:userId/role
  Request: { role }
  Response: { user }

GET /api/admin/system-status
  Response: { database_health, api_status, integrations }

// ============= MOCK INTEGRATIONS =============
POST /api/integrations/hhg/ingest
  Request: { order_id, tracking_data }
  Response: { status }

POST /api/integrations/orders/ingest
  Request: { user_id, orders_data }
  Response: { order_id, tasks_generated }

// ============= ANALYTICS =============
GET /api/analytics/pcs-completion-rate
  Response: { completion_rate, trend }

GET /api/analytics/readiness-scores
  Response: [users with scores]

GET /api/analytics/financial-summary
  Response: { total_authorized, total_claimed, pending }
