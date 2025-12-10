// src/App.tsx – With Firebase Authentication
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { DogList } from '@/pages/DogList';
import { DogProfile } from '@/pages/DogProfile';
import { Litters } from '@/pages/Litters';
import { LitterDetails } from '@/pages/LitterDetails';
import { Calendar } from '@/pages/Calendar';
import { Reminders } from '@/pages/Reminders';
import { Pedigrees } from '@/pages/Pedigrees';
import { PublicLitter } from '@/pages/PublicLitter';
import { PublicHome } from '@/pages/PublicHome';
import { PublicWebsite } from '@/pages/PublicWebsite';
import { ContactForm } from '@/pages/ContactForm';
import { BreederSettings } from '@/pages/BreederSettings';
import { WebsiteDesign } from '@/pages/WebsiteDesign';
import { AccountManagement } from '@/pages/AccountManagement';
import { Inquiries } from '@/pages/Inquiries';
import { Waitlist } from '@/pages/Waitlist';
import { WaitlistApplication } from '@/pages/WaitlistApplication';
import { Customers } from '@/pages/Customers';
import { Connections } from '@/pages/Connections';
import { BuyerPortal } from '@/pages/BuyerPortal';
import { HealthRecords } from '@/pages/HealthRecords';
import { StudJobsPage } from '@/pages/StudJobsPage';
import { LitterForecast } from '@/pages/LitterForecast';
import { Help } from '@/pages/Help';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminSettings } from '@/pages/AdminSettings';
import { AdminCustomers } from '@/pages/AdminCustomers';
import { GmailCallback } from '@/pages/auth/GmailCallback';
import { OutlookCallback } from '@/pages/auth/OutlookCallback';
import { DogFormDialog } from '@/components/DogFormDialog';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { EmailSettingsDialog } from '@/components/EmailSettingsDialog';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HelmetProvider } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Dog } from '@/types/dog';
import { useDogStore } from '@/store/dogStoreFirebase';
import { useBreederStore } from '@/store/breederStore';
import { useWaitlistStore } from '@/store/waitlistStore';
import { useCrmStore } from '@/store/crmStore';
import { useConnectionStore } from '@/store/connectionStore';
import { useAdminStore } from '@/store/adminStore';
import { useStudJobStore } from '@/store/studJobStore';
import { useHeatCycleStore } from '@/store/heatCycleStore';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { cn } from '@/lib/utils';

function AppContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('sidebarPinned');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const { currentUser } = useAuth();
  const subscribeToUserData = useDogStore((state) => state.subscribeToUserData);
  const subscribeToBreederData = useBreederStore(
    (state) => state.subscribeToBreederData
  );
  const subscribeToWaitlist = useWaitlistStore(
    (state) => state.subscribeToWaitlist
  );
  const subscribeToCustomers = useCrmStore(
    (state) => state.subscribeToCustomers
  );
  const subscribeToNotifications = useConnectionStore(
    (state) => state.subscribeToNotifications
  );
  const subscribeToStudJobs = useStudJobStore(
    (state) => state.subscribeToStudJobs
  );
  const subscribeToHeatCycles = useHeatCycleStore(
    (state) => state.subscribeToHeatCycles
  );
  const impersonatedUserId = useAdminStore((s) => s.impersonatedUserId);
  const dogs = useDogStore((state) => state.dogs);
  const litters = useDogStore((state) => state.litters);

  // Subscribe to Firestore data when user logs in
  useEffect(() => {
    if (currentUser) {
      const targetUid = impersonatedUserId || currentUser.uid;
      const unsubscribe = subscribeToUserData(targetUid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToUserData, impersonatedUserId]);

  // Subscribe to breeder profile data when user logs in
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToBreederData();
      return unsubscribe;
    }
  }, [currentUser, subscribeToBreederData]);

  // Subscribe to waitlist data when user logs in
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToWaitlist();
      return unsubscribe;
    }
  }, [currentUser, subscribeToWaitlist]);

  // Subscribe to CRM customer data when user logs in
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToCustomers();
      return unsubscribe;
    }
  }, [currentUser, subscribeToCustomers]);

  // Subscribe to notifications when user logs in
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToNotifications(currentUser.uid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToNotifications]);

  // Subscribe to stud jobs when user logs in
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToStudJobs();
      return unsubscribe;
    }
  }, [currentUser, subscribeToStudJobs]);

  // Subscribe to heat cycles when user logs in
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToHeatCycles();
      return unsubscribe;
    }
  }, [currentUser, subscribeToHeatCycles]);

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('sidebarPinned', JSON.stringify(sidebarPinned));
  }, [sidebarPinned]);

  const openAddDialog = () => {
    setEditingDog(null);
    setDialogOpen(true);
  };

  const openEditDialog = (dog: Dog | null) => {
    setEditingDog(dog);
    setDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <ErrorBoundary>
        <div className='min-h-screen bg-background'>
          {currentUser && (
            <>
              <Header
                onAddDog={openAddDialog}
                onEmailSettings={() => setEmailSettingsOpen(true)}
                dogs={dogs}
                litters={litters}
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              />
              <ImpersonationBanner />
              <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isPinned={sidebarPinned}
                setIsPinned={setSidebarPinned}
              />
            </>
          )}

          <main
            className={cn(
              'min-h-screen transition-all duration-300',
              currentUser && 'pt-16',
              currentUser && sidebarPinned && sidebarOpen && 'lg:ml-64',
              currentUser && sidebarPinned && !sidebarOpen && 'lg:ml-20'
            )}
          >
            <div className='container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl'>
              <Routes>
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<Signup />} />

              {/* OAuth Callback routes */}
              <Route path='/auth/gmail/callback' element={<GmailCallback />} />
              <Route
                path='/auth/outlook/callback'
                element={<OutlookCallback />}
              />

              {/* Public routes */}
              <Route path='/website/:userId' element={<PublicWebsite />} />
              <Route path='/home/:userId' element={<PublicHome />} />
              <Route path='/contact/:userId' element={<ContactForm />} />
              <Route
                path='/waitlist-apply/:userId'
                element={<WaitlistApplication />}
              />
              <Route
                path='/public/:userId/:litterId'
                element={<PublicLitter />}
              />
              <Route path='/buyer-portal' element={<BuyerPortal />} />

              {/* Protected routes */}
              <Route
                path='/'
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/dogs'
                element={
                  <ProtectedRoute>
                    <DogList openEditDialog={openEditDialog} />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/breeder-settings'
                element={
                  <ProtectedRoute>
                    <BreederSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/settings'
                element={
                  <ProtectedRoute>
                    <BreederSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/account'
                element={
                  <ProtectedRoute>
                    <AccountManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/website-design'
                element={
                  <ProtectedRoute>
                    <WebsiteDesign />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/dogs/:id'
                element={
                  <ProtectedRoute>
                    <DogProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/litters'
                element={
                  <ProtectedRoute>
                    <Litters />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/litters/:id'
                element={
                  <ProtectedRoute>
                    <LitterDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/calendar'
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/reminders'
                element={
                  <ProtectedRoute>
                    <Reminders />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/pedigrees'
                element={
                  <ProtectedRoute>
                    <Pedigrees />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/inquiries'
                element={
                  <ProtectedRoute>
                    <Inquiries />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/waitlist'
                element={
                  <ProtectedRoute>
                    <Waitlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/connections'
                element={
                  <ProtectedRoute>
                    <Connections />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/customers'
                element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/health'
                element={
                  <ProtectedRoute>
                    <HealthRecords />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/stud-jobs'
                element={
                  <ProtectedRoute>
                    <StudJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/forecast'
                element={
                  <ProtectedRoute>
                    <LitterForecast />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/help'
                element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin'
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/settings'
                element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/customers'
                element={
                  <ProtectedRoute>
                    <AdminCustomers />
                  </ProtectedRoute>
                }
              />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </div>
        </main>

        {currentUser && (
          <DogFormDialog
            open={dialogOpen}
            setOpen={setDialogOpen}
            dog={editingDog}
          />
        )}

        <EmailSettingsDialog
          open={emailSettingsOpen}
          setOpen={setEmailSettingsOpen}
        />
        <Toaster />
      </div>
      </ErrorBoundary>
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HelmetProvider>
  );
}
