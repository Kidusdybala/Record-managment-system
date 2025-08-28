# Ministry of Innovation and Technology - Record Management System (RMS)

A comprehensive digital solution for government record management, correspondence tracking, and inter-departmental communication built with modern web technologies.

## 📋 Overview

The Record Management System (RMS) streamlines government operations by providing a secure, efficient platform for:
- **Document Management**: Upload, store, and track official documents and letters
- **Workflow Automation**: Automated routing and approval processes
- **User Management**: Role-based access control with comprehensive user administration
- **Real-time Tracking**: Monitor document status and approval progress
- **Inter-departmental Communication**: Seamless collaboration between government departments

## 🏗️ System Architecture

This enterprise-grade system consists of:

- **Frontend**: React 18 + TypeScript + Tailwind CSS (`frontend/`)
- **Backend**: Laravel 12 API with PHP 8.2+ (`backend/`)
- **Database**: SQLite (development) / MySQL/PostgreSQL (production)
- **Authentication**: JWT with HTTP-only cookies for security
- **File Storage**: Secure document upload and storage system

## 🎯 Key Features

### 🔐 Advanced User Management
- **Role-Based Access Control**: Minister, Record Office (Admin), Department User roles
- **Account Lifecycle Management**: Create, suspend, activate, and manage user accounts
- **Secure Authentication**: JWT-based authentication with cookie security
- **User Administration**: Complete CRUD operations for system administrators

### 📄 Document & Correspondence Management
- **Multi-format Support**: PDF, DOC, DOCX document uploads
- **Flexible Routing**: Send to specific departments or admin for review
- **Approval Workflows**: Multi-level approval process with minister oversight
- **Document Tracking**: Real-time status monitoring and audit trails

### 🎨 Modern User Interface
- **Responsive Design**: Optimized for desktop and mobile devices
- **Component-Based Architecture**: Reusable, maintainable UI components
- **Real-time Updates**: Dynamic dashboard with live statistics
- **Intuitive Navigation**: Role-specific dashboards and workflows

### 🔒 Enterprise Security
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Permissions**: Granular access control
- **Input Validation**: Comprehensive server-side validation
- **CORS Protection**: Configured for secure cross-origin requests
- **File Upload Security**: Type and size validation for documents

## 👥 User Roles & Permissions

| Role | Permissions | Description |
|------|-------------|-------------|
| **Minister** | Full system access, final approval authority, document review | Government minister with ultimate decision-making power |
| **Record Office (Admin)** | User management, document routing, system administration | Administrative staff managing records and user accounts |
| **Department User** | Document creation, department-specific access | Department staff creating and managing their correspondence |

## 🚀 Quick Start

### Prerequisites
- PHP 8.2 or higher
- Node.js 18+ and npm
- Composer (PHP dependency manager)
- Git

### Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd rms

# Backend Setup
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed

# Frontend Setup
cd ../frontend
npm install

# Start Development Servers
# Terminal 1 - Backend
cd backend
php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Demo Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Minister | `minister@ministry.gov` | `minister123` | Full System Access |
| Record Office (Admin) | `admin@ministry.gov` | `admin123` | Administrative Access |
| Department User | `dit@ministry.gov` | `dept123` | Department Access |

## 📊 System Workflow

### Document Creation & Routing
1. **Department User** creates a letter/document
2. **Department User** chooses recipient (specific department or admin)
3. **Record Office** reviews and routes the document
4. **Minister** provides final approval (if required)
5. **Document** is delivered to target department

### User Management Workflow
1. **Record Office** creates user accounts
2. **Record Office** assigns appropriate roles and departments
3. **Record Office** can suspend/activate accounts as needed
4. **System** maintains audit trail of all user actions

## 🔧 Technical Implementation

### Frontend Architecture
```
frontend/src/
├── components/           # Reusable UI components
│   ├── dashboard/       # Dashboard-specific components
│   ├── letters/         # Letter management components
│   ├── users/          # User management components
│   └── forms/          # Form components
├── pages/              # Main application pages
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
└── lib/                # API clients and utilities
```

### Backend Architecture
```
backend/
├── app/
│   ├── Http/Controllers/    # API controllers
│   ├── Models/             # Eloquent models
│   ├── Services/           # Business logic services
│   └── Middleware/         # Custom middleware
├── database/
│   ├── migrations/         # Database schema
│   └── seeders/           # Demo data
├── routes/                # API routes
└── config/               # Configuration files
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, React Router
- **Backend**: Laravel 12, PHP 8.2+, MySQL/PostgreSQL
- **Authentication**: JWT with HTTP-only cookies
- **File Storage**: Laravel's filesystem with secure uploads
- **Validation**: Laravel's robust validation system

## 📡 API Documentation

### Authentication Endpoints
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@ministry.gov",
  "password": "password123"
}
```

```http
POST /api/auth/logout
GET  /api/auth/me
```

### Core API Endpoints

#### Departments
```http
GET /api/departments  # List all departments
```

#### Letters Management
```http
GET  /api/letters/inbox           # Get user's inbox
GET  /api/letters/sent            # Get user's sent letters
POST /api/letters                 # Create new letter/document
GET  /api/letters/{id}/document   # Download document
```

#### Administrative Actions
```http
PATCH /api/letters/{id}/admin-review     # Admin review & routing
PATCH /api/letters/{id}/minister-decision # Minister approval/rejection
PATCH /api/letters/{id}/forward          # Forward to department
```

#### User Management (Admin Only)
```http
GET    /api/users              # List all users
POST   /api/users              # Create new user
GET    /api/users/{id}         # Get user details
PUT    /api/users/{id}         # Update user
DELETE /api/users/{id}         # Delete user (admin only)
PATCH  /api/users/{id}/suspend # Suspend user account
PATCH  /api/users/{id}/activate # Activate user account
```

## 🚀 Recent Improvements

### ✅ Major Refactoring (Latest Update)
- **Component Architecture**: Broke down large dashboard files into reusable components
- **AdminDashboard**: Reduced from ~896 lines to 469 lines (47% reduction)
- **Code Reusability**: Created shared components for stats, letters, and forms
- **Maintainability**: Improved code organization and separation of concerns

### ✅ User Management System
- **Complete CRUD**: Create, read, update, delete user accounts
- **Account Status**: Suspend/activate users instead of permanent deletion
- **Role Management**: Assign and modify user roles and departments
- **Security**: Proper authorization and validation

### ✅ Enhanced Document Management
- **Flexible Routing**: Send to admin or specific departments
- **File Upload**: Fixed 422 errors with proper multipart handling
- **Document Security**: Type validation and size limits
- **Audit Trail**: Complete tracking of document lifecycle

### ✅ Authentication & Security
- **JWT with Cookies**: Secure token storage in HTTP-only cookies
- **Fallback Authentication**: Cookie-based auth when localStorage fails
- **Role-Based Access**: Granular permissions for different user types
- **Input Validation**: Comprehensive server-side validation

### ✅ User Experience
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live dashboard statistics
- **Intuitive Workflows**: Streamlined document approval process
- **Error Handling**: Comprehensive error messages and validation

## 🛡️ Security & Compliance

### Authentication & Authorization
- **JWT with HTTP-only Cookies**: Secure token storage preventing XSS attacks
- **Role-Based Access Control**: Granular permissions for different user types
- **Session Management**: Secure logout with token invalidation
- **Password Security**: Bcrypt hashing with Laravel's Hash facade

### Data Protection
- **Input Sanitization**: Comprehensive server-side validation
- **File Upload Security**: Type, size, and content validation
- **CORS Configuration**: Properly configured for secure cross-origin requests
- **Audit Trail**: Complete logging of user actions and document changes

### Infrastructure Security
- **Environment Variables**: Sensitive data stored securely
- **Database Security**: Parameterized queries preventing SQL injection
- **File Storage**: Secure document storage with access controls

## 🔧 Development & Deployment

### Development Environment
```bash
# Environment Setup
cp backend/.env.example backend/.env
php artisan key:generate

# Database Setup
php artisan migrate:fresh --seed

# Development Servers
php artisan serve --host=127.0.0.1 --port=8000  # Backend
npm run dev                                    # Frontend
```

### Production Deployment

#### Backend Deployment
```bash
# Environment Configuration
cp .env.example .env
# Configure production database, mail, etc.

# Build and Deploy
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy dist/ folder to web server
# Configure nginx/apache to serve static files
```

#### Docker Deployment (Optional)
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
  db:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=rms
      - MYSQL_ROOT_PASSWORD=secret
```

## 🐛 Troubleshooting

### Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **CORS Errors** | Frontend can't connect to backend | Check ports (8000/5173) and CORS config |
| **Auth Failures** | "Invalid token" errors | Clear localStorage, re-login, check JWT secret |
| **File Upload** | 422 errors on document upload | Check file size/type limits, multipart config |
| **Database** | Migration/connection errors | Run `php artisan migrate:fresh --seed` |
| **Port Conflicts** | Services won't start | Kill processes on ports 8000/5173 |

### Debug Commands
```bash
# Check Laravel logs
tail -f backend/storage/logs/laravel.log

# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Reset database
php artisan migrate:fresh --seed
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **PHP**: Follow PSR-12 coding standards
- **JavaScript/TypeScript**: Use ESLint configuration
- **Commits**: Use conventional commit format
- **Testing**: Write tests for new features

### Testing Checklist
- [ ] Authentication flow works end-to-end
- [ ] Role-based permissions are enforced
- [ ] File uploads work correctly
- [ ] User management functions properly
- [ ] Responsive design on mobile devices
- [ ] CORS configuration is correct

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: Contact the development team

---

**Built with ❤️ for efficient government operations**
