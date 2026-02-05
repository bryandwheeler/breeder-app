import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Dog,
  Calendar,
  Bell,
  FileText,
  Users,
  BarChart3,
  Settings,
  Globe,
  MessageSquare,
  MessagesSquare,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pin,
  PinOff,
  LayoutDashboard,
  GitFork,
  HelpCircle,
  Briefcase,
  TrendingUp,
  Calculator,
  Shield,
  ListTodo,
  Mail,
  LifeBuoy,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStore } from '@breeder/firebase';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const breederNavigation: NavGroup[] = [
  {
    title: 'Management',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Dogs', path: '/dogs', icon: Dog },
      { name: 'Litters', path: '/litters', icon: GitFork },
      { name: 'Tasks', path: '/tasks', icon: ListTodo },
      { name: 'Calendar', path: '/calendar', icon: Calendar },
      { name: 'Reminders', path: '/reminders', icon: Bell },
    ],
  },
  {
    title: 'Records',
    items: [
      { name: 'Health Records', path: '/health', icon: FileText },
      { name: 'Pedigrees', path: '/pedigrees', icon: Users },
      { name: 'Breeding Planner', path: '/breeding-planner', icon: Calculator },
      { name: 'Stud Jobs', path: '/stud-jobs', icon: Briefcase },
    ],
  },
  {
    title: 'Business',
    items: [
      { name: 'Litter Forecast', path: '/forecast', icon: TrendingUp },
      { name: 'Contacts', path: '/customers', icon: Users },
      {
        name: 'Customer Analytics',
        path: '/customer-analytics',
        icon: BarChart3,
      },
      { name: 'Waitlist', path: '/waitlist', icon: ListOrdered },
      { name: 'Inquiries', path: '/inquiries', icon: MessageSquare },
      { name: 'Connections', path: '/connections', icon: GitFork },
      { name: 'Community', path: '/community', icon: Users },
      { name: 'Newsletter', path: '/newsletter', icon: Mail },
      { name: 'Forum', path: '/forum', icon: MessagesSquare },
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Website',
    items: [{ name: 'Website Design', path: '/website-design', icon: Globe }],
  },
  {
    title: 'Account',
    items: [
      { name: 'Account Management', path: '/account', icon: Settings },
      { name: 'Settings', path: '/settings', icon: Settings },
      { name: 'Support', path: '/support', icon: LifeBuoy },
      { name: 'Help', path: '/help', icon: HelpCircle },
    ],
  },
];

const adminNavigation: NavGroup[] = [
  {
    title: 'Administration',
    items: [
      { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Contacts', path: '/admin/customers', icon: Users },
      { name: 'Tickets', path: '/admin/tickets', icon: Ticket },
      { name: 'Newsletter', path: '/admin/newsletter', icon: Mail },
      { name: 'Admin Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isPinned: boolean;
  setIsPinned: (pinned: boolean) => void;
}

export function Sidebar({
  isOpen,
  setIsOpen,
  isPinned,
  setIsPinned,
}: SidebarProps) {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { checkIsAdmin, impersonatedUserId } = useAdminStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!currentUser) {
        if (mounted) setIsAdmin(false);
        return;
      }
      try {
        const result = await checkIsAdmin(currentUser.uid);
        if (mounted) setIsAdmin(!!result);
      } catch {
        if (mounted) setIsAdmin(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [currentUser, checkIsAdmin]);

  const isImpersonating = !!impersonatedUserId;
  // When impersonating, only show breeder navigation
  // For admins, show breeder navigation always, with collapsible admin section
  const topClass = isImpersonating ? 'top-28' : 'top-16';

  return (
    <>
      {/* Overlay for mobile - only show when not pinned */}
      {isOpen && !isPinned && (
        <div
          className='fixed inset-0 bg-black/50 z-30 lg:hidden'
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 bottom-0 z-40 bg-card border-r transition-all duration-300 flex flex-col',
          topClass,
          isOpen
            ? 'w-64 translate-x-0'
            : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'
        )}
      >
        {/* Header with Pin and Toggle buttons - only on desktop when open */}
        {isOpen && (
          <div className='hidden lg:flex items-center justify-end gap-1 px-3 py-2 border-b'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            >
              {isPinned ? (
                <Pin className='h-4 w-4 text-primary' />
              ) : (
                <PinOff className='h-4 w-4' />
              )}
            </Button>
            {!isPinned && (
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7'
                onClick={() => setIsOpen(false)}
                title='Collapse sidebar'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
            )}
          </div>
        )}

        {/* Toggle button - only show when collapsed on desktop */}
        {!isOpen && (
          <Button
            variant='ghost'
            size='icon'
            className='hidden lg:flex absolute -right-3 top-4 h-6 w-6 rounded-full border bg-background'
            onClick={() => setIsOpen(true)}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        )}

        {/* Navigation */}
        <nav className='flex-1 overflow-y-auto py-6 px-3 space-y-8'>
          {/* Collapsible Admin Section for admin users */}
          {isAdmin && !isImpersonating && (
            <div>
              {isOpen ? (
                <button
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  className='flex items-center justify-between w-full px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors'
                >
                  <span className='flex items-center gap-2'>
                    <Shield className='h-3.5 w-3.5' />
                    Admin
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      adminExpanded ? 'rotate-180' : ''
                    )}
                  />
                </button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setAdminExpanded(!adminExpanded)}
                      className='flex items-center justify-center w-full px-3 py-2 mb-2 rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors'
                    >
                      <Shield className='h-5 w-5' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Admin Menu</TooltipContent>
                </Tooltip>
              )}
              {adminExpanded && (
                <div className='space-y-1'>
                  {adminNavigation[0].items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <Tooltip key={item.path}>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.path}
                            onClick={() => {
                              if (window.innerWidth < 1024 && !isPinned) {
                                setIsOpen(false);
                              }
                            }}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                              isActive
                                ? 'bg-orange-600 text-white'
                                : 'text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30',
                              !isOpen && 'justify-center'
                            )}
                            title={!isOpen ? item.name : undefined}
                          >
                            <Icon
                              className={cn(
                                'h-5 w-5 flex-shrink-0',
                                !isOpen && 'mx-auto'
                              )}
                            />
                            {isOpen && (
                              <span className='text-sm font-medium'>
                                {item.name}
                              </span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>{`Go to ${item.name}`}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Breeder Navigation */}
          {breederNavigation.map((group) => (
            <div key={group.title}>
              {isOpen && (
                <h3 className='px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  {group.title}
                </h3>
              )}
              <div className='space-y-1'>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.path}
                          onClick={() => {
                            // Close mobile menu on navigation if not pinned
                            if (window.innerWidth < 1024 && !isPinned) {
                              setIsOpen(false);
                            }
                          }}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            !isOpen && 'justify-center'
                          )}
                          title={!isOpen ? item.name : undefined}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5 flex-shrink-0',
                              !isOpen && 'mx-auto'
                            )}
                          />
                          {isOpen && (
                            <span className='text-sm font-medium'>
                              {item.name}
                            </span>
                          )}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>{`Go to ${item.name}`}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer - Expert Breeder branding */}
        {isOpen && (
          <div className='border-t p-4'>
            <div className='text-xs text-muted-foreground text-center'>
              Powered by Expert Breeder
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
