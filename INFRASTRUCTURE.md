# PCS EXPRESS - PRODUCTION INFRASTRUCTURE

## Architecture Overview

### Microservices Stack
```
Frontend (React)    ← API (Node.js/Express)    ← Database (PostgreSQL)
  (Port 3000)          (Port 3001)                 (Port 5432)
                          ↓
                      Redis Cache
                      (Port 6379)
```

## Database Schema

### Users Table
- **id**: UUID (Primary Key)
- **name, email, rank, branch**: Service member profile
- **role**: user | admin | commander (role-based access control)
- **unit, component, paygrade**: Military details

### PCS Moves Table
- **id**: UUID (Primary Key)
- **user_id**: Foreign Key → Users
- **departure_date, origin, destination**: Move timeline
- **is_overseas**: Boolean flag for OCONUS moves
- **readiness_score**: 0-100% (auto-calculated from tasks)
- **status**: pending | in_progress | completed
- **family_size, has_dependents, num_children, child_ages**: Family info

### PCS Tasks Table
- **id**: UUID (Primary Key)
- **pcs_id**: Foreign Key → PCS Moves
- **task_name, description, priority**: Task details
- **status**: pending | in_progress | completed
- **due_date, completed_at**: Scheduling
- **category**: orders | housing | finance | medical | schools | family | household

### Financial Tracking Table
- **id**: UUID (Primary Key)
- **user_id**: Foreign Key → Users (UNIQUE)
- **dla_estimate, tle_estimate**: Dislocation and Temporary Lodging Allowance
- **hhg_cost_estimate, hhg_cost_actual**: Household Goods estimates
- **mileage_distance, mileage_reimbursement**: Auto-calculated at $0.58/mile
- **total_authorized, total_spent**: Financial aggregates
- **reimbursement_status**: not_submitted | pending | approved | paid | disputed

### Documents Table
- **id**: UUID (Primary Key)
- **user_id, pcs_id**: Foreign Keys
- **file_url**: S3 storage link
- **doc_type**: orders | receipt | hhg_authorization | travel_authorization | medical_records | school_records | other
- **extracted_data**: JSONB for parsed document data

### Commander Dashboard Table
- **unit**: Unit identifier
- **snapshot_date**: Timestamp of snapshot
- **total_personnel, ready_percentage, at_risk_percentage, delayed_percentage**: Unit metrics
- **avg_readiness_score**: Average readiness across unit

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create new user account
- `POST /api/auth/login` — Authenticate and receive JWT token

### User Profile
- `GET /api/users/profile` — Get authenticated user's profile

### PCS Moves
- `POST /api/pcs-moves` — Create new PCS move
- `GET /api/pcs-moves` — Get all user's PCS moves
- `GET /api/pcs-moves/:id` — Get specific PCS move
- `PUT /api/pcs-moves/:id` — Update PCS move (status, readiness)

### Tasks
- `POST /api/tasks` — Create task
- `GET /api/pcs-moves/:pcsId/tasks` — Get all tasks for PCS move
- `PUT /api/tasks/:id` — Update task status

### Financial
- `GET /api/financial/:pcsId` — Get financial data
- `PUT /api/financial/:pcsId` — Update financial estimates/tracking

### Readiness
- `POST /api/readiness-score/:pcsId` — Calculate readiness score (auto-triggered on task updates)

### Commander Dashboard
- `GET /api/commander/dashboard/:unit` — Get unit-level metrics (commander/admin only)

### Health
- `GET /api/health` — API status check

## Deployment

### Local Development
```bash
docker-compose -f docker-compose.yml up -d
```
- Frontend: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Production Deployment
```bash
# Set environment variables
export DATABASE_URL=postgresql://user:pass@prod-db:5432/pcs_express
export JWT_SECRET=your-production-secret
export NODE_ENV=production

# Deploy with compose
docker-compose -f docker-compose.yml.prod up -d
```

### Railway Deployment
```bash
# Environment variables in Railway dashboard:
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production

# Frontend auto-deploys from GitHub
# API auto-deploys from server/ directory
```

## Security Features

✅ **Authentication**: JWT tokens with expiration
✅ **Role-Based Access**: user | admin | commander
✅ **Audit Logging**: All operations tracked
✅ **Environment Isolation**: Separate dev/prod configs
✅ **CORS**: Configured for approved origins
✅ **Password Hashing**: bcrypt with salt rounds
✅ **SQL Injection Prevention**: Parameterized queries
✅ **Session Management**: Token-based, no cookies

## Scalability

- **Database**: PostgreSQL with connection pooling (max 20)
- **Caching**: Redis for sessions and frequently accessed data
- **Load Balancing**: Ready for horizontal scaling with API replicas
- **CDN**: Static frontend assets can be served via CDN

## Monitoring & Compliance

- Health checks on all services
- Audit logs for DoD compliance
- Error logging and monitoring ready
- Performance metrics collection ready

## Next Steps

1. Set up S3 bucket for document storage
2. Configure email notifications via SMTP
3. Implement document parsing (OCR for orders)
4. Add multi-factor authentication for commanders
5. Set up monitoring and alerting
6. Configure automated backups for PostgreSQL
