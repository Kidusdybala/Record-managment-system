import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import MinisterDashboard from '@/pages/MinisterDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import DepartmentDashboard from '@/pages/DepartmentDashboard';
import { Clock } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Route based on user role
  switch (user.role) {
    case 'minister':
      return <MinisterDashboard />;
    case 'record_office':
      return <AdminDashboard />;
    case 'department':
      return <DepartmentDashboard />;
    default:
      return <Login />;
  }
};

export default ProtectedRoute;