import React, { useState, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Users, Building2, LogOut, Menu, X, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transition duration-300 transform bg-blue-800 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center">
            <span className="mx-2 text-2xl font-semibold text-white">ETMS</span>
          </div>
        </div>

        <nav className="mt-10">
          <Link
            to="/admin"
            className={`flex items-center px-6 py-3 mt-1 text-white transition-colors duration-200 ${
              isActive('/admin') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Home className="w-5 h-5" />
            <span className="mx-3">Dashboard</span>
          </Link>

          <Link
            to="/admin/users"
            className={`flex items-center px-6 py-3 mt-1 text-white transition-colors duration-200 ${
              isActive('/admin/users') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users className="w-5 h-5" />
            <span className="mx-3">User Management</span>
          </Link>

          <Link
            to="/admin/departments"
            className={`flex items-center px-6 py-3 mt-1 text-white transition-colors duration-200 ${
              isActive('/admin/departments') ? 'bg-blue-700' : 'hover:bg-blue-700'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Building2 className="w-5 h-5" />
            <span className="mx-3">Departments</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 w-full mb-6">
          <button
            onClick={handleLogout}
            className="flex items-center px-6 py-3 text-white hover:bg-blue-700 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="mx-3">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 focus:outline-none lg:hidden"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 ml-3">{title}</h2>
          </div>

          <div className="flex items-center">
            <div className="relative ml-5">
              <span className="text-gray-800">
                Welcome, {user?.name}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;