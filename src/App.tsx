import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import Editor from './pages/Editor';
import { MusicConfig } from './pages/MusicConfig';
import TranscriptPortal from './pages/TranscriptPortal';
import { Loading } from './components/Loading';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/editor/:moduleId" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
          <Route path="/music/:moduleId" element={<ProtectedRoute><MusicConfig /></ProtectedRoute>} />
          <Route path="/transcript" element={<TranscriptPortal />} />
          <Route path="/transcript/:sessionId" element={<TranscriptPortal />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
    </AuthProvider>
  );
}
