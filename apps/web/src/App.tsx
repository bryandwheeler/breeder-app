// src/App.tsx – With Firebase Authentication
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { BlogPosts } from '@/pages/BlogPosts';
import { BlogPostEditor } from '@/pages/BlogPostEditor';
import { AccountManagement } from '@/pages/AccountManagement';
import { Inquiries } from '@/pages/Inquiries';
import { Waitlist } from '@/pages/Waitlist';
import { WaitlistApplication } from '@/pages/WaitlistApplication';
import { Customers } from '@/pages/Customers';
import { ContactDetail } from '@/pages/ContactDetail';
import { Connections } from '@/pages/Connections';
import { BreederCommunity } from '@/pages/BreederCommunity';
import { ForumHome } from '@/pages/ForumHome';
import { ForumCategory } from '@/pages/ForumCategory';
import { ForumThread } from '@/pages/ForumThread';
import { BreederNewsletter } from '@/pages/BreederNewsletter';
import { BreederNewsletterLists } from '@/pages/newsletter/BreederNewsletterLists';
import { BreederNewsletterSubscribers } from '@/pages/newsletter/BreederNewsletterSubscribers';
import { BreederNewsletterCampaigns } from '@/pages/newsletter/BreederNewsletterCampaigns';
import { BreederNewsletterSequences } from '@/pages/newsletter/BreederNewsletterSequences';
import { BreederNewsletterLeadMagnets } from '@/pages/newsletter/BreederNewsletterLeadMagnets';
import { BreederNewsletterForms } from '@/pages/newsletter/BreederNewsletterForms';
import { BreederNewsletterSettings } from '@/pages/newsletter/BreederNewsletterSettings';
import { BuyerPortal } from '@/pages/BuyerPortal';
import { HealthRecords } from '@/pages/HealthRecords';
import { StudJobsPage } from '@/pages/StudJobsPage';
import { LitterForecast } from '@/pages/LitterForecast';
import { Contracts } from '@/pages/Contracts';
import { ContractDetail } from '@/pages/ContractDetail';
import { BreedingPlanner } from '@/pages/BreedingPlanner';
import { CustomerAnalytics } from '@/pages/CustomerAnalytics';
import { Help } from '@/pages/Help';
import { BookAppointment } from '@/pages/BookAppointment';
import { Tasks } from '@/pages/Tasks';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { ResetPassword } from '@/pages/ResetPassword';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfService } from '@/pages/TermsOfService';
import { LandingPage } from '@/pages/LandingPage';
import { SupportTickets } from '@/pages/SupportTickets';
import { NewTicket } from '@/pages/NewTicket';
import { TicketDetail } from '@/pages/TicketDetail';
import { AdminTickets } from '@/pages/AdminTickets';
import { AcceptStaffInvitation } from '@/pages/AcceptStaffInvitation';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminSettings } from '@/pages/AdminSettings';
import { AdminCustomers } from '@/pages/AdminCustomers';
import { AdminNewsletter } from '@/pages/admin/Newsletter';
import { NewsletterLists } from '@/pages/admin/NewsletterLists';
import { NewsletterSubscribers } from '@/pages/admin/NewsletterSubscribers';
import { NewsletterCampaigns } from '@/pages/admin/NewsletterCampaigns';
import { NewsletterSequences } from '@/pages/admin/NewsletterSequences';
import { NewsletterLeadMagnets } from '@/pages/admin/NewsletterLeadMagnets';
import { NewsletterForms } from '@/pages/admin/NewsletterForms';
import { AdminNewsletterSettings } from '@/pages/admin/NewsletterSettings';
import { NewsletterTemplates } from '@/pages/admin/NewsletterTemplates';
import { GmailCallback } from '@/pages/auth/GmailCallback';
import { OutlookCallback } from '@/pages/auth/OutlookCallback';
import { GoogleCalendarCallback } from '@/pages/auth/GoogleCalendarCallback';
import { MessagingInbox } from '@/pages/MessagingInbox';
import { InstagramCallback } from '@/pages/InstagramCallback';
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
import { Dog } from '@breeder/types';
import { useDogStore } from '@breeder/firebase';
import { useBreederStore } from '@breeder/firebase';
import { useWaitlistStore } from '@breeder/firebase';
import { useCrmStore } from '@breeder/firebase';
import { useConnectionStore } from '@breeder/firebase';
import { useAdminStore } from '@breeder/firebase';
import { useStudJobStore } from '@/store/studJobStore';
import { useHeatCycleStore } from '@breeder/firebase';
import { useSchedulingStore } from '@breeder/firebase';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { TawkToWidget } from '@/components/chat/TawkToWidget';
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
  const location = useLocation();
  const isLandingPage = !currentUser && location.pathname === '/';
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
  const subscribeToSchedulingSettings = useSchedulingStore(
    (state) => state.subscribeToSettings
  );
  const subscribeToBookings = useSchedulingStore(
    (state) => state.subscribeToBookings
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
      const targetUid = impersonatedUserId || currentUser.uid;
      const unsubscribe = subscribeToBreederData(targetUid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToBreederData, impersonatedUserId]);

  // Subscribe to waitlist data when user logs in
  useEffect(() => {
    if (currentUser) {
      const targetUid = impersonatedUserId || currentUser.uid;
      const unsubscribe = subscribeToWaitlist(targetUid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToWaitlist, impersonatedUserId]);

  // Subscribe to CRM customer data when user logs in
  useEffect(() => {
    if (currentUser) {
      const targetUid = impersonatedUserId || currentUser.uid;
      const unsubscribe = subscribeToCustomers(targetUid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToCustomers, impersonatedUserId]);

  // Subscribe to notifications when user logs in
  useEffect(() => {
    if (currentUser) {
      const targetUid = impersonatedUserId || currentUser.uid;
      const unsubscribe = subscribeToNotifications(targetUid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToNotifications, impersonatedUserId]);

  // Subscribe to stud jobs when user logs in
  useEffect(() => {
    if (currentUser) {
      const targetUid = impersonatedUserId || currentUser.uid;
      const unsubscribe = subscribeToStudJobs(targetUid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToStudJobs, impersonatedUserId]);

  // Subscribe to heat cycles when user logs in
  useEffect(() => {
    if (currentUser) {
      const targetUid = impersonatedUserId || currentUser.uid;
      const unsubscribe = subscribeToHeatCycles(targetUid);
      return unsubscribe;
    }
  }, [currentUser, subscribeToHeatCycles, impersonatedUserId]);

  // Subscribe to scheduling settings and bookings when user logs in
  useEffect(() => {
    if (currentUser) {
      const targetUid = impersonatedUserId || currentUser.uid;
      const unsubSettings = subscribeToSchedulingSettings(targetUid);
      const unsubBookings = subscribeToBookings(targetUid);
      return () => {
        unsubSettings();
        unsubBookings();
      };
    }
  }, [currentUser, subscribeToSchedulingSettings, subscribeToBookings, impersonatedUserId]);

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
            {isLandingPage ? (
              <LandingPage />
            ) : (
            <div className='container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl'>
              <Routes>
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<Signup />} />
              <Route path='/reset-password' element={<ResetPassword />} />
              <Route path='/privacy' element={<PrivacyPolicy />} />
              <Route path='/terms' element={<TermsOfService />} />

              {/* OAuth Callback routes */}
              <Route path='/auth/gmail/callback' element={<GmailCallback />} />
              <Route
                path='/auth/outlook/callback'
                element={<OutlookCallback />}
              />
              <Route
                path='/auth/instagram/callback'
                element={<InstagramCallback />}
              />
              <Route
                path='/oauth/google-calendar/callback'
                element={<GoogleCalendarCallback />}
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
                path='/book/:userId'
                element={<BookAppointment />}
              />
              <Route
                path='/public/:userId/:litterId'
                element={<PublicLitter />}
              />
              <Route path='/buyer-portal' element={<BuyerPortal />} />
              <Route
                path='/accept-invitation/:invitationId'
                element={<AcceptStaffInvitation />}
              />

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
                path='/blog'
                element={
                  <ProtectedRoute>
                    <BlogPosts />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/blog/new'
                element={
                  <ProtectedRoute>
                    <BlogPostEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/blog/:postId/edit'
                element={
                  <ProtectedRoute>
                    <BlogPostEditor />
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
                path='/tasks'
                element={
                  <ProtectedRoute>
                    <Tasks />
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
                path='/breeding-planner'
                element={
                  <ProtectedRoute>
                    <BreedingPlanner />
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
                path='/community'
                element={
                  <ProtectedRoute>
                    <BreederCommunity />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/forum'
                element={
                  <ProtectedRoute>
                    <ForumHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/forum/category/:categorySlug'
                element={
                  <ProtectedRoute>
                    <ForumCategory />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/forum/thread/:threadId'
                element={
                  <ProtectedRoute>
                    <ForumThread />
                  </ProtectedRoute>
                }
              />
              {/* Breeder Newsletter Routes */}
              <Route
                path='/newsletter'
                element={
                  <ProtectedRoute>
                    <BreederNewsletter />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/newsletter/lists'
                element={
                  <ProtectedRoute>
                    <BreederNewsletterLists />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/newsletter/subscribers'
                element={
                  <ProtectedRoute>
                    <BreederNewsletterSubscribers />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/newsletter/campaigns'
                element={
                  <ProtectedRoute>
                    <BreederNewsletterCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/newsletter/campaigns/:id'
                element={
                  <ProtectedRoute>
                    <BreederNewsletterCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/newsletter/sequences'
                element={
                  <ProtectedRoute>
                    <BreederNewsletterSequences />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/newsletter/sequences/:id'
                element={
                  <ProtectedRoute>
                    <BreederNewsletterSequences />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/newsletter/lead-magnets'
                element={
                  <ProtectedRoute>
                    <BreederNewsletterLeadMagnets />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/newsletter/forms'
                element={
                  <ProtectedRoute>
                    <BreederNewsletterForms />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/newsletter/settings'
                element={
                  <ProtectedRoute>
                    <BreederNewsletterSettings />
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
                path='/contacts/:id'
                element={
                  <ProtectedRoute>
                    <ContactDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/customer-analytics'
                element={
                  <ProtectedRoute>
                    <CustomerAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/messaging'
                element={
                  <ProtectedRoute>
                    <MessagingInbox />
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
                path='/contracts'
                element={
                  <ProtectedRoute>
                    <Contracts />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/contracts/:contractId'
                element={
                  <ProtectedRoute>
                    <ContractDetail />
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
              {/* Support Tickets Routes */}
              <Route
                path='/support'
                element={
                  <ProtectedRoute>
                    <SupportTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/support/new'
                element={
                  <ProtectedRoute>
                    <NewTicket />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/support/tickets/:ticketId'
                element={
                  <ProtectedRoute>
                    <TicketDetail />
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
              <Route
                path='/admin/newsletter'
                element={
                  <ProtectedRoute>
                    <AdminNewsletter />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/lists'
                element={
                  <ProtectedRoute>
                    <NewsletterLists />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/subscribers'
                element={
                  <ProtectedRoute>
                    <NewsletterSubscribers />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/campaigns'
                element={
                  <ProtectedRoute>
                    <NewsletterCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/campaigns/:id'
                element={
                  <ProtectedRoute>
                    <NewsletterCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/sequences'
                element={
                  <ProtectedRoute>
                    <NewsletterSequences />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/sequences/:id'
                element={
                  <ProtectedRoute>
                    <NewsletterSequences />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/lead-magnets'
                element={
                  <ProtectedRoute>
                    <NewsletterLeadMagnets />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/forms'
                element={
                  <ProtectedRoute>
                    <NewsletterForms />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/settings'
                element={
                  <ProtectedRoute>
                    <AdminNewsletterSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/newsletter/templates'
                element={
                  <ProtectedRoute>
                    <NewsletterTemplates />
                  </ProtectedRoute>
                }
              />
              {/* Admin Tickets Routes */}
              <Route
                path='/admin/tickets'
                element={
                  <ProtectedRoute>
                    <AdminTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/admin/tickets/:ticketId'
                element={
                  <ProtectedRoute>
                    <TicketDetail />
                  </ProtectedRoute>
                }
              />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </div>
            )}
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
        <TawkToWidget />
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
