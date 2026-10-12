import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts & Route Guards
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Core Student Pages
import Dashboard from './pages/student/Dashboard';
import ProblemSheets from './pages/student/ProblemSheets';
import SheetDetail from './pages/student/SheetDetail';
import Assignments from './pages/student/Assignments';
import Leaderboards from './pages/student/Leaderboards';
import PracticeRooms from './pages/student/PracticeRooms';
import RoomDetail from './pages/student/RoomDetail';
import Announcements from './pages/student/Announcements';
import Profile from './pages/student/Profile';

// Mentor Pages
import SheetEditor from './pages/mentor/SheetEditor';
import AssignmentEditor from './pages/mentor/AssignmentEditor';
import AssignmentProgress from './pages/mentor/AssignmentProgress';
import RoomEditor from './pages/mentor/RoomEditor';

// Admin Page
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Platform Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="sheets" element={<ProblemSheets />} />
            <Route path="sheets/:id" element={<SheetDetail />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="leaderboards" element={<Leaderboards />} />
            <Route path="practice-rooms" element={<PracticeRooms />} />
            <Route path="practice-rooms/:id" element={<RoomDetail />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="profile" element={<Profile />} />

            {/* Mentor Routes */}
            <Route
              path="mentor/sheets/new"
              element={
                <RoleRoute allowedRoles={['mentor', 'admin']}>
                  <SheetEditor />
                </RoleRoute>
              }
            />
            <Route
              path="mentor/sheets/edit/:id"
              element={
                <RoleRoute allowedRoles={['mentor', 'admin']}>
                  <SheetEditor />
                </RoleRoute>
              }
            />
            <Route
              path="mentor/assignments/new"
              element={
                <RoleRoute allowedRoles={['mentor', 'admin']}>
                  <AssignmentEditor />
                </RoleRoute>
              }
            />
            <Route
              path="mentor/assignments/:id/progress"
              element={
                <RoleRoute allowedRoles={['mentor', 'admin']}>
                  <AssignmentProgress />
                </RoleRoute>
              }
            />
            <Route
              path="mentor/rooms/new"
              element={
                <RoleRoute allowedRoles={['mentor', 'admin']}>
                  <RoomEditor />
                </RoleRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="admin"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
