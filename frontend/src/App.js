import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import './i18n';
import './index.css';

// Lazy load pages
const Emergency = lazy(() => import('./pages/Emergency'));
const Layout = lazy(() => import('./components/Layout'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Upload = lazy(() => import('./pages/Upload'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Doctors = lazy(() => import('./pages/Doctors'));
const DoctorProfile = lazy(() => import('./pages/DoctorProfile'));
const Nearby = lazy(() => import('./pages/Nearby'));
const Medicines = lazy(() => import('./pages/Medicines'));
const History = lazy(() => import('./pages/History'));
const Help = lazy(() => import('./pages/Help'));
const Settings = lazy(() => import('./pages/Settings'));
const Stage = lazy(() => import('./pages/Stage'));
const CarePlan = lazy(() => import('./pages/CarePlan'));
const Precautions = lazy(() => import('./pages/Precautions'));
const Lifestyle = lazy(() => import('./pages/Lifestyle'));
const SymptomChecker = lazy(() => import('./pages/SymptomChecker'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Splash Screen Component
const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem('splashSeen', 'true');
      onComplete();
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        {/* Heartbeat Animation */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <svg className="w-full h-full heartbeat" viewBox="0 0 100 100" fill="none">
            <path
              d="M50 88C50 88 15 65 15 40C15 25 27 15 40 15C47 15 50 20 50 20C50 20 53 15 60 15C73 15 85 25 85 40C85 65 50 88 50 88Z"
              className="fill-primary"
            />
          </svg>
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-2 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
          <span className="text-primary">Medi</span>Cure
        </h1>
        <p className="text-muted-foreground text-sm">Your Health, Simplified</p>

        {/* VitalWave bars */}
        <div className="flex items-end justify-center gap-1 mt-8 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="vital-wave-bar w-1 bg-primary rounded-full"
              style={{ height: '100%' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex items-end gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="vital-wave-bar w-1 bg-primary rounded-full"
          style={{ height: '100%' }}
        />
      ))}
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Content
const AppContent = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashSeen');
  });
  const { isAuthenticated, loading } = useAuth();

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          loading ? <PageLoader /> : (isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />)
        } />
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute><ForgotPassword /></PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute><Register /></PublicRoute>
        } />

        {/* Authenticated Routes with Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctor/:id" element={<DoctorProfile />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/history" element={<History />} />
          <Route path="/help" element={<Help />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/stage" element={<Stage />} />
          <Route path="/care-plan" element={<CarePlan />} />
          <Route path="/precautions" element={<Precautions />} />
          <Route path="/lifestyle" element={<Lifestyle />} />
          <Route path="/symptoms" element={<SymptomChecker />} />
        </Route>

        {/* Emergency doesn't use standard layout usually, or we can include it */}
        <Route path="/emergency" element={
          <ProtectedRoute><Emergency /></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {


  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
