# Innovation Scribe - Record Management System

A unified frontend-backend system for managing government records and correspondence.

## System Architecture

This system consists of:
- **Frontend**: React + TypeScript application (`innovation-dispatch/`)
- **Backend**: Laravel 12 API (`backend/`)
- **Database**: SQLite (development) / MySQL/PostgreSQL (production)

## Demo Accounts

The system now uses **unified credentials** that work with both frontend and backend:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Minister | `minister@ministry.gov` | `minister123` | Full system access, final approval authority |
| Record Office (Admin) | `admin@ministry.gov` | `admin123` | Administrative access, record management |
| Department User | `dit@ministry.gov` | `dept123` | Department-specific access, letter creation |

## Setup Instructions

### Prerequisites
- PHP 8.2+
- Node.js 18+
- Composer
- npm/yarn

### Backend Setup
```bash
cd backend

# Install PHP dependencies
composer install

# Create environment file (if not exists)
cp .env.example .env

# Generate application key
php artisan key:generate

# Set up database
php artisan migrate:fresh --seed

# Start backend server
php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend Setup
```bash
cd innovation-dispatch

# Install Node.js dependencies
npm install

# Start frontend development server
npm run dev
```

### Quick Start (Windows)
```powershell
# Run the development startup script
.\start-dev.ps1
```

This script will:
1. Set up the database if needed
2. Start the Laravel backend on http://localhost:8000
3. Start the React frontend on http://localhost:5173
4. Display the demo account credentials

## How It Works

### Authentication Flow
1. **Frontend** sends login request to `/api/auth/login`
2. **Backend** validates credentials against database
3. **Backend** returns JWT token in HTTP-only cookie
4. **Frontend** stores user data in localStorage
5. **Frontend** includes credentials in subsequent API requests

### Data Flow
- **Frontend** makes API calls to backend endpoints
- **Backend** processes requests using JWT authentication
- **Database** stores all user data, letters, and department information
- **Real-time** updates through API responses

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user info

### Protected Routes (require JWT)
- `GET /api/departments` - List departments
- `GET /api/letters/inbox` - Get inbox letters
- `GET /api/letters/sent` - Get sent letters
- `POST /api/letters` - Create new letter (department users)
- `PATCH /api/letters/{id}/admin-review` - Admin review (record office)
- `PATCH /api/letters/{id}/minister-decision` - Minister decision
- `PATCH /api/letters/{id}/forward` - Forward letter (record office)

## Security Features

- **JWT Authentication** with HTTP-only cookies
- **Role-based Access Control** (minister, record_office, department)
- **Password Hashing** using Laravel's Hash facade
- **CORS Protection** configured for development
- **Input Validation** on all API endpoints

## Development Notes

- **CORS** is configured to allow `localhost:5173` (frontend) to communicate with `localhost:8000` (backend)
- **Database seeding** creates demo users with the credentials listed above
- **JWT tokens** are stored in HTTP-only cookies for security
- **Role mapping** converts backend roles to frontend roles automatically

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend is running on port 8000 and frontend on 5173
2. **Database Errors**: Run `php artisan migrate:fresh --seed` in backend directory
3. **Authentication Failures**: Check that demo accounts exist in database
4. **Port Conflicts**: Verify ports 8000 and 5173 are available

### Reset System
```bash
# Backend
cd backend
php artisan migrate:fresh --seed

# Frontend
cd innovation-dispatch
npm run dev
```

## Production Deployment

For production:
1. Update CORS configuration in `backend/config/cors.php`
2. Set proper environment variables
3. Use production database (MySQL/PostgreSQL)
4. Configure proper JWT secrets
5. Set up HTTPS
6. Update API_BASE_URL in frontend AuthContext

## Contributing

1. Ensure frontend and backend work together
2. Test authentication flow end-to-end
3. Verify role-based permissions
4. Update demo accounts if needed
5. Test CORS configuration
