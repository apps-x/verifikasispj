import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Verify from './pages/Verify';
import Recap from './pages/Recap';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'admin' | 'user' }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  if (role && profile?.role !== role) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route 
              path="/upload" 
              element={<ProtectedRoute role="user"><Upload /></ProtectedRoute>} 
            />
            <Route 
              path="/verify" 
              element={<ProtectedRoute role="admin"><Verify /></ProtectedRoute>} 
            />
            <Route path="/recap" element={<ProtectedRoute><Recap /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
