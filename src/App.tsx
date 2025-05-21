import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth
import Login from './pages/auth/Login';
import RequireAuth from './components/auth/RequireAuth';
import AuthProvider from './contexts/AuthContext';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';

// HR Pages
import HRDashboard from './pages/hr/Dashboard';
import SurveyBuilder from './pages/hr/SurveyBuilder';
import SurveyList from './pages/hr/SurveyList';
import FactorManagement from './pages/hr/FactorManagement';
import EmployeeManagement from './pages/hr/EmployeeManagement';
import TrainingManagement from './pages/hr/TrainingManagement';
import SurveyResponses from './pages/hr/SurveyResponses';

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import SurveyResponse from './pages/employee/SurveyResponse';
import TrainingList from './pages/employee/TrainingList';
import EmpSurveyList from './pages/employee/SurveyList';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <RequireAuth allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <RequireAuth allowedRoles={['ADMIN']}>
                <UserManagement />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/departments" 
            element={
              <RequireAuth allowedRoles={['ADMIN']}>
                <DepartmentManagement />
              </RequireAuth>
            } 
          />
          
          {/* HR routes */}
          <Route 
            path="/hr" 
            element={
              <RequireAuth allowedRoles={['HR']}>
                <HRDashboard />
              </RequireAuth>
            } 
          />
          <Route 
            path="/hr/surveys" 
            element={
              <RequireAuth allowedRoles={['HR']}>
                <SurveyList />
              </RequireAuth>
            } 
          />
          <Route 
            path="/hr/surveys/builder" 
            element={
              <RequireAuth allowedRoles={['HR']}>
                <SurveyBuilder />
              </RequireAuth>
            } 
          />
          <Route 
            path="/hr/surveys/builder/:id" 
            element={
              <RequireAuth allowedRoles={['HR']}>
                <SurveyBuilder />
              </RequireAuth>
            } 
          />
          <Route 
            path="/hr/surveyresponses" 
            element={
              <RequireAuth allowedRoles={['HR']}>
                <SurveyResponses />
              </RequireAuth>
            } 
          />
          <Route 
            path="/hr/factors" 
            element={
              <RequireAuth allowedRoles={['HR']}>
                <FactorManagement />
              </RequireAuth>
            } 
          />
          <Route 
            path="/hr/employees" 
            element={
              <RequireAuth allowedRoles={['HR']}>
                <EmployeeManagement />
              </RequireAuth>
            } 
          />
          <Route 
            path="/hr/trainings" 
            element={
              <RequireAuth allowedRoles={['HR']}>
                <TrainingManagement />
              </RequireAuth>
            } 
          />
          
          {/* Employee routes */}
          <Route 
            path="/employee" 
            element={
              <RequireAuth allowedRoles={['EMPLOYEE']}>
                <EmployeeDashboard />
              </RequireAuth>
            } 
          />
          <Route 
            path="/employee/surveys/:id" 
            element={
              <RequireAuth allowedRoles={['EMPLOYEE']}>
                <SurveyResponse />
              </RequireAuth>
            } 
          />
          <Route 
            path="/employee/trainings" 
            element={
              <RequireAuth allowedRoles={['EMPLOYEE']}>
                <TrainingList />
              </RequireAuth>
            } 
          />
          <Route 
            path="/employee/surveys" 
            element={
              <RequireAuth allowedRoles={['EMPLOYEE']}>
                <EmpSurveyList />
              </RequireAuth>
            } 
          />
          
          {/* Fallback routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={5000} />
      </Router>
    </AuthProvider>
  );
}

export default App;