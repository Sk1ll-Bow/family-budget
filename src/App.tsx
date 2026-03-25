import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from './core/useAuthStore';
import { initialSync, startSyncListener } from './features/sync/syncEngine';
import { subscribeToRealtime } from './features/sync/realtimeSubscription';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { VerifyOtpPage } from './features/auth/VerifyOtpPage';
import { FamilySetup } from './features/family/FamilySetup';
import { ExpenseList } from './features/expenses/ExpenseList';
import { AddExpenseModal } from './features/expenses/AddExpenseModal';
import { AnalyticsDashboard } from './features/analytics/AnalyticsDashboard';
import { SettingsPage } from './features/settings/SettingsPage';
import { FamilyManagementPage } from './features/family/FamilyManagementPage';
import { BottomNav } from './components/BottomNav';

/**
 * Main application shell with routing, auth guards, and sync initialization.
 */
function App() {
  return (
    <BrowserRouter>
      <AppShell />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(3, 7, 18, 0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f8fafc',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
          },
        }}
      />
    </BrowserRouter>
  );
}


function AppShell() {
  const { initialized, user, familyId } = useAuthStore();
  const initialize = useAuthStore((s) => s.initialize);
  const location = useLocation();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize sync & realtime when family is available
  useEffect(() => {
    if (!familyId) return;

    // Initial data sync
    initialSync(familyId);

    // Start online/offline sync listener
    const cleanupSync = startSyncListener(familyId);

    // Subscribe to realtime changes
    const cleanupRealtime = subscribeToRealtime(familyId);

    return () => {
      cleanupSync();
      cleanupRealtime();
    };
  }, [familyId]);

  // Loading state
  if (!initialized) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 relative overflow-hidden bg-surface-950">
        <div className="ambient-bg" />
        <div className="spotlight" />
        
        <div className="text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto relative z-10" />
          </motion.div>
          
          <h2 className="text-2xl font-black text-surface-50 mb-3 tracking-tight">
            {user ? 'Entering Workspace' : 'Initializing'}
          </h2>
          <p className="text-surface-500 text-sm font-medium max-w-[240px] mx-auto leading-relaxed">
            {user 
              ? 'Synchronizing your family budget data...' 
              : 'Connecting to secure servers...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Auth required routes */}
        <Route path="/setup" element={
          <RequireAuth>
            {familyId ? <Navigate to="/" replace /> : <FamilySetup />}
          </RequireAuth>
        } />

        {/* Main app routes (require auth + family) */}
        <Route path="/" element={
          <RequireFamily>
            <MainLayout>
              <ExpenseList />
            </MainLayout>
          </RequireFamily>
        } />

        <Route path="/analytics" element={
          <RequireFamily>
            <MainLayout>
              <AnalyticsDashboard />
            </MainLayout>
          </RequireFamily>
        } />

        <Route path="/family" element={
          <RequireFamily>
            <MainLayout>
              <FamilyManagementPage />
            </MainLayout>
          </RequireFamily>
        } />

        <Route path="/settings" element={
          <RequireFamily>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </RequireFamily>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}


/** Require authenticated user */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Require authenticated user WITH a family */
function RequireFamily({ children }: { children: ReactNode }) {
  const { user, familyId, loading } = useAuthStore();
  
  if (!user) return <Navigate to="/login" replace />;
  
  // If we are still refetching something in the store but it's initialized,
  // we might want to wait if it's explicitly a "checking" state.
  // But usually initialized=true means initial fetch (profile+family) is done.
  if (!familyId) {
    console.log('[RequireFamily] No familyId found, redirecting to setup...');
    return <Navigate to="/setup" replace />;
  }
  
  return <>{children}</>;
}

/** Main layout wrapper with bottom nav and add expense modal */
function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-lg mx-auto min-h-dvh relative bg-surface-950 overflow-hidden">
      {/* Ambient background */}
      <div className="ambient-bg" />
      <div className="spotlight" />

      {/* Page content with transition */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 px-4 pt-4 pb-32 safe-top"
      >
        {children}
      </motion.main>

      {/* Global modals */}
      <AddExpenseModal />

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}


export default App;
