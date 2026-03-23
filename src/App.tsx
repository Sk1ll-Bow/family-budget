import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
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
            background: 'rgba(26, 26, 46, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e8e8f0',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </BrowserRouter>
  );
}

function AppShell() {
  const { initialized, user, familyId, loading } = useAuthStore();
  const initialize = useAuthStore((s) => s.initialize);

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
      <div className="min-h-dvh flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-primary/10 blur-[100px] rounded-full" />
        <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-brand-secondary/5 blur-[80px] rounded-full" />
        
        <div className="text-center relative z-10 animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
            <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto relative z-10" />
          </div>
          
          <h2 className="text-xl font-semibold text-surface-100 mb-2">
            {user ? 'Входим в систему...' : 'Загрузка...'}
          </h2>
          <p className="text-surface-400 text-sm max-w-[200px] mx-auto">
            {user 
              ? 'Проверяем доступ к вашему семейному бюджету...' 
              : 'Подключаемся к серверу...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
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
    <div className="w-full max-w-lg mx-auto min-h-dvh relative">
      {/* Ambient background */}
      <div className="ambient-glow w-full h-full" />

      {/* Page content */}
      <main className="relative z-10 px-4 pt-4 pb-24 safe-top">
        {children}
      </main>

      {/* Global modals */}
      <AddExpenseModal />

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}

export default App;
