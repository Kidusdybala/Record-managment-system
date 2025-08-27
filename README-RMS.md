# Record Management System
## Ministry of Innovation and Technology

A comprehensive record management system built with Laravel (backend) and React (frontend) for managing letters and communications between departments, record office, and minister.

## 🏗️ Architecture

### Backend (Laravel + SQLite)
- **Database**: SQLite with migrations and seeders
- **Authentication**: JWT with httpOnly cookies
- **API**: RESTful API with role-based access control

### Frontend (React + TypeScript + Tailwind CSS)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context for authentication
- **HTTP Client**: Axios with credentials support

## 👥 User Roles

### 1. Minister
- Reviews letters requiring ministerial approval
- Can approve or reject letters
- Dashboard shows pending approvals and statistics

### 2. Record Office (Admin)
- Central hub for all letter management
- Reviews incoming letters from departments
- Decides whether letters need ministerial approval
- Forwards letters to target departments
- Manages the entire letter workflow

### 3. Department Users (24 Departments)
- Can compose and send letters
- Letters first go to Record Office for review
- Can view inbox for received letters
- Can track status of sent letters

## 🏢 Departments (24 Total)

1. Digital Transformation
2. Cybersecurity
3. Research & Innovation
4. ICT Infrastructure
5. Data & Analytics
6. e-Government Services
7. AI & Emerging Tech
8. Standards & Compliance
9. Policy & Regulation
10. Grants & Funding
11. International Cooperation
12. Procurement & Logistics
13. Public Engagement
14. Training & Capacity
15. Startup & Incubation
16. Intellectual Property
17. Open Data
18. Cloud Services
19. Enterprise Systems
20. Telecommunications
21. Rural Connectivity
22. Smart Cities
23. Sustainable Tech
24. Project Management

## 📋 Letter Workflow

```
Department → Record Office → [Minister (if required)] → Record Office → Target Department
```

### Status Lifecycle:
1. **pending_review** - Letter submitted by department, awaiting admin review
2. **needs_minister_approval** - Admin sent letter to minister for approval
3. **minister_approved** - Minister approved the letter
4. **minister_rejected** - Minister rejected the letter
5. **forwarded** - Admin forwarded letter to target department
6. **delivered** - Letter successfully delivered to target department
7. **rejected** - Letter was rejected in the process

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- npm

### 1. Start Development Servers
```powershell
# Run the startup script (Windows PowerShell)
.\start-dev.ps1
```

Or manually:

```powershell
# Backend (Terminal 1)
Set-Location backend
php artisan serve --host=0.0.0.0 --port=8000

# Frontend (Terminal 2)
npm run dev
```

### 2. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api

## 🔐 Test Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Minister | minister@example.gov | Passw0rd! | Approves/rejects letters |
| Record Office | admin@example.gov | Passw0rd! | System administrator |
| Department | digital-tr@example.gov | Passw0rd! | Digital Transformation dept |

*Note: All 24 departments have user accounts with pattern: `{dept-code}@example.gov`*

## 🛠️ Development

### Backend Commands
```bash
# Database operations
php artisan migrate:fresh --seed  # Reset and seed database
php artisan migrate               # Run migrations only
php artisan db:seed              # Seed data only

# Development
php artisan serve                # Start development server
php artisan tinker              # Interactive shell
```

### Frontend Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 📁 Project Structure

```
innovation-scribe/
├── backend/                 # Laravel backend
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php
├── src/                     # React frontend
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   └── pages/
├── start-dev.ps1           # Development startup script
└── README-RMS.md           # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Departments
- `GET /api/departments` - List all departments

### Letters
- `GET /api/letters/inbox` - Get inbox (role-aware)
- `GET /api/letters/sent` - Get sent letters
- `POST /api/letters` - Create new letter (department only)
- `PATCH /api/letters/{id}/admin-review` - Admin review (record office only)
- `PATCH /api/letters/{id}/minister-decision` - Minister decision (minister only)
- `PATCH /api/letters/{id}/forward` - Forward letter (record office only)

## 🎨 Features

### Dashboard Features by Role

#### Minister Dashboard
- Pending approvals counter
- Letters requiring approval list
- Approve/reject actions
- Decision history

#### Record Office Dashboard
- Comprehensive letter management
- Pending review queue
- Minister decision tracking
- Department forwarding
- System statistics

#### Department Dashboard
- Letter composition with rich editor
- Inbox for received letters
- Sent letters tracking
- Status monitoring
- Minister approval toggle

### UI/UX Features
- Responsive design for all screen sizes
- Real-time status updates
- Interactive letter composer
- Role-based navigation
- Toast notifications
- Loading states and error handling

## 🔒 Security Features

- JWT authentication with httpOnly cookies
- Role-based access control
- CORS protection
- Input validation and sanitization
- Protected routes
- Secure password hashing

## 📊 Database Schema

### Users Table
- id, name, email, password
- role (minister, record_office, department)
- department_id (nullable)

### Departments Table
- id, name, code
- timestamps

### Letters Table
- id, subject, body
- from_department_id, to_department_id
- requires_minister, status
- created_by_user_id, reviewed_by_admin_id
- minister_decision, timestamps

## 🚀 Production Deployment

### Backend (Laravel)
1. Set up production environment variables
2. Run `composer install --optimize-autoloader --no-dev`
3. Run `php artisan config:cache`
4. Run `php artisan route:cache`
5. Set up web server (Apache/Nginx)

### Frontend (React)
1. Run `npm run build`
2. Deploy `dist/` folder to web server
3. Configure routing for SPA

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team.

---

**Built with ❤️ for the Ministry of Innovation and Technology**