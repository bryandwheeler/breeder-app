// src/App.tsx – With Firebase Authentication
import { Routes, Route, Navigate } from 'react-router-dom';
import { DogList } from '@/pages/DogList';
import { DogProfile } from '@/pages/DogProfile';
import { Litters } from '@/pages/Litters';
import { LitterDetails } from '@/pages/LitterDetails';
import { Calendar } from '@/pages/Calendar';
import { Reminders } from '@/pages/Reminders';
import { PublicLitter } from '@/pages/PublicLitter';
import { PublicHome } from '@/pages/PublicHome';
import { ContactForm } from '@/pages/ContactForm';
import { BreederSettings } from '@/pages/BreederSettings';
import { Inquiries } from '@/pages/Inquiries';
import { Waitlist } from '@/pages/Waitlist';
import { WaitlistApplication } from '@/pages/WaitlistApplication';
import { Customers } from '@/pages/Customers';
import { BuyerPortal } from '@/pages/BuyerPortal';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { DogFormDialog } from '@/components/DogFormDialog';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { EmailSettingsDialog } from '@/components/EmailSettingsDialog';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { Dog } from '@/types/dog';
import { useDogStore } from '@/store/dogStoreFirebase';
import { useBreederStore } from '@/store/breederStore';
import { useWaitlistStore } from '@/store/waitlistStore';
import { useCrmStore } from '@/store/crmStore';
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
  const subscribeToBreederData = useBreederStore((state) => state.subscribeToBreederData);
  const subscribeToWaitlist = useWaitlistStore((state) => state.subscribeToWaitlist);
  const subscribeToCustomers = useCrmStore((state) => state.subscribeToCustomers);
  const dogs = useDogStore((state) => state.dogs);
  const litters = useDogStore((state) => state.litters);

  // Subscribe to Firestore data when user logs in
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToUserData();
      return unsubscribe;
    }
  }, [currentUser, subscribeToUserData]);

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

  const openEditDialog = (dog: Dog) => {
    setEditingDog(dog);
    setDialogOpen(true);
  };

  return (
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
        <div className='container mx-auto px-4 py-8'>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />

          {/* Public routes */}
          <Route path='/home/:userId' element={<PublicHome />} />
          <Route path='/contact/:userId' element={<ContactForm />} />
          <Route path='/waitlist-apply/:userId' element={<WaitlistApplication />} />
          <Route path='/public/:userId/:litterId' element={<PublicLitter />} />
          <Route path='/buyer-portal' element={<BuyerPortal />} />

          {/* Protected routes */}
          <Route
            path='/'
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
            path='/customers'
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
        </div>
      </main>

      {currentUser && (
        <DogFormDialog open={dialogOpen} setOpen={setDialogOpen} dog={editingDog} />
      )}

      <EmailSettingsDialog open={emailSettingsOpen} setOpen={setEmailSettingsOpen} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
