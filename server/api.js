// PCS EXPRESS - Backend API Server
// Node.js + Express + PostgreSQL
// Production-ready operational military PCS system

const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.use(cors());
app.use(express.json());

// ==================== AUTHENTICATION ====================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ==================== USERS ENDPOINTS ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, rank, branch, component, paygrade } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, rank, branch, component, paygrade, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, rank, branch, role',
      [name, email, hashedPassword, rank, branch, component, paygrade]
    );

    const token = jwt.sign(
      { id: result.rows[0].id, role: result.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, rank, branch, unit, role, component, paygrade, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PCS MOVES ENDPOINTS ====================

// Create PCS move
app.post('/api/pcs-moves', authenticateToken, async (req, res) => {
  try {
    const { departure_date, origin, destination, is_overseas, family_size, has_dependents, num_children, child_ages, bedrooms_needed } = req.body;

    const result = await pool.query(
      'INSERT INTO pcs_moves (user_id, departure_date, origin, destination, is_overseas, family_size, has_dependents, num_children, child_ages, bedrooms_needed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [req.user.id, departure_date, origin, destination, is_overseas, family_size, has_dependents, num_children, child_ages, bedrooms_needed]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user's PCS moves
app.get('/api/pcs-moves', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pcs_moves WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get PCS move by ID
app.get('/api/pcs-moves/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pcs_moves WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PCS move not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update PCS move
app.put('/api/pcs-moves/:id', authenticateToken, async (req, res) => {
  try {
    const { status, readiness_score } = req.body;

    const result = await pool.query(
      'UPDATE pcs_moves SET status = COALESCE($1, status), readiness_score = COALESCE($2, readiness_score), updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [status, readiness_score, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PCS move not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TASKS ENDPOINTS ====================

// Create task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { pcs_id, task_name, description, priority, due_date, category } = req.body;

    const result = await pool.query(
      'INSERT INTO pcs_tasks (pcs_id, task_name, description, priority, due_date, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [pcs_id, task_name, description, priority, due_date, category]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get tasks for PCS move
app.get('/api/pcs-moves/:pcsId/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.* FROM pcs_tasks t 
       JOIN pcs_moves p ON t.pcs_id = p.id 
       WHERE p.id = $1 AND p.user_id = $2 
       ORDER BY t.priority DESC, t.due_date ASC`,
      [req.params.pcsId, req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { status, completed_at } = req.body;

    const result = await pool.query(
      'UPDATE pcs_tasks SET status = COALESCE($1, status), completed_at = COALESCE($2, completed_at), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, completed_at, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FINANCIAL ENDPOINTS ====================

// Get financial data
app.get('/api/financial/:pcsId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM financial_tracking WHERE pcs_id = $1 AND user_id = $2',
      [req.params.pcsId, req.user.id]
    );

    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update financial data
app.put('/api/financial/:pcsId', authenticateToken, async (req, res) => {
  try {
    const { dla_estimate, tle_estimate, hhg_cost_estimate, mileage_distance, other_expenses } = req.body;
    const { pcsId } = req.params;

    // Calculate mileage reimbursement (standard rate: $0.58 per mile)
    const mileageRate = 0.58;
    const mileageReimbursement = mileage_distance ? mileage_distance * mileageRate : 0;

    const totalAuthorized = (dla_estimate || 0) + (tle_estimate || 0) + (hhg_cost_estimate || 0) + mileageReimbursement;

    const result = await pool.query(
      `INSERT INTO financial_tracking (user_id, pcs_id, dla_estimate, tle_estimate, hhg_cost_estimate, mileage_distance, mileage_reimbursement, mileage_rate, other_expenses, total_authorized)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
       dla_estimate = $3, tle_estimate = $4, hhg_cost_estimate = $5, mileage_distance = $6, mileage_reimbursement = $7, other_expenses = $9, total_authorized = $10, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, pcsId, dla_estimate, tle_estimate, hhg_cost_estimate, mileage_distance, mileageReimbursement, mileageRate, other_expenses || [], totalAuthorized]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== READINESS SCORE ENDPOINT ====================

// Calculate readiness score
app.post('/api/readiness-score/:pcsId', authenticateToken, async (req, res) => {
  try {
    const { pcsId } = req.params;

    // Get all tasks for this PCS
    const tasksResult = await pool.query('SELECT status FROM pcs_tasks WHERE pcs_id = $1', [pcsId]);
    const tasks = tasksResult.rows;

    if (tasks.length === 0) {
      return res.json({ score: 0 });
    }

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const score = Math.round((completedTasks / tasks.length) * 100);

    // Update PCS move readiness score
    await pool.query('UPDATE pcs_moves SET readiness_score = $1 WHERE id = $2', [score, pcsId]);

    res.json({ score, totalTasks: tasks.length, completedTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== COMMANDER DASHBOARD ====================

// Get unit dashboard (commander only)
app.get('/api/commander/dashboard/:unit', authenticateToken, authorizeRole('commander', 'admin'), async (req, res) => {
  try {
    const { unit } = req.params;

    // Get all users in unit with their PCS status
    const result = await pool.query(
      `SELECT u.id, u.name, u.rank, p.readiness_score, p.status, p.departure_date 
       FROM users u 
       LEFT JOIN pcs_moves p ON u.id = p.user_id 
       WHERE u.unit = $1 
       ORDER BY p.readiness_score ASC`,
      [unit]
    );

    const personnel = result.rows;
    const totalPersonnel = new Set(personnel.map(p => p.id)).size;
    const readyCount = personnel.filter(p => p.readiness_score >= 80).length;
    const atRiskCount = personnel.filter(p => p.readiness_score < 50 && p.readiness_score > 0).length;
    const delayedCount = personnel.filter(p => {
      const daysUntilDeparture = (new Date(p.departure_date) - new Date()) / (1000 * 60 * 60 * 24);
      return daysUntilDeparture < 7 && p.readiness_score < 80;
    }).length;

    const dashboard = {
      unit,
      total_personnel: totalPersonnel,
      ready_percentage: Math.round((readyCount / totalPersonnel) * 100),
      at_risk_percentage: Math.round((atRiskCount / totalPersonnel) * 100),
      delayed_percentage: Math.round((delayedCount / totalPersonnel) * 100),
      personnel,
    };

    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'operational', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PCS Express API running on port ${PORT}`);
});

module.exports = app;
