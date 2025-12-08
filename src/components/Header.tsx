import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, LogOut, Download, Mail, Menu, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useBreederStore } from '@/store/breederStore';
import { Dog, Litter } from '@/types/dog';
import {
  exportToJSON,
  exportDogsToCSV,
  exportLittersToCSV,
  exportPuppiesToCSV,
  exportExpensesToCSV,
} from '@/lib/dataExport';

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface HeaderProps {
  onAddDog: () => void;
  onEmailSettings: () => void;
  dogs: Dog[];
  litters: Litter[];
  onMenuClick: () => void;
}

export function Header({
  onAddDog,
  onEmailSettings,
  dogs,
  litters,
  onMenuClick,
}: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const { profile } = useBreederStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className='fixed top-0 left-0 right-0 z-40 h-16 border-b bg-card'>
      <div className='h-full px-4 flex items-center justify-between gap-4'>
        {/* Left section */}
        <div className='flex items-center gap-3'>
          {/* Hamburger menu - mobile only */}
          <Button
            variant='ghost'
            size='icon'
            className='lg:hidden'
            onClick={onMenuClick}
          >
            <Menu className='h-5 w-5' />
          </Button>

          {/* Logo/Brand */}
          <Link to='/' className='flex items-center gap-3'>
            {/* Expert Breeder Logo */}
            <img
              src='/expert-breeder-logo.webp'
              alt='Expert Breeder Logo'
              className='h-16 w-auto'
            />
            {profile?.kennelName && (
              <div className='hidden lg:flex flex-col'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='font-bold text-lg cursor-pointer text-breeder-navy dark:text-white'>
                      Expert Breeder
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Go to dashboard</TooltipContent>
                </Tooltip>
                {profile.kennelName && (
                  <span className='text-xs text-muted-foreground'>
                    {profile.kennelName}
                  </span>
                )}
              </div>
            )}
          </Link>
        </div>

        {/* Right section */}
        <div className='flex items-center gap-1 sm:gap-2'>
          {/* Add Dog Button removed per UX: shown in Dogs page instead */}

          {/* Notifications */}
          <NotificationsDropdown />

          {/* Email Settings - hidden on small mobile */}
          <Button
            variant='ghost'
            size='icon'
            onClick={onEmailSettings}
            title='Email Settings'
            className='hidden xs:flex'
          >
            <Mail className='h-4 w-4' />
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' title='Export Data'>
                <Download className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='bg-background w-56'>
              <DropdownMenuItem onClick={() => exportToJSON(dogs, litters)}>
                <Download className='mr-2 h-4 w-4' />
                Full Backup (JSON)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportDogsToCSV(dogs)}>
                <Download className='mr-2 h-4 w-4' />
                Dogs (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportLittersToCSV(litters, dogs)}
              >
                <Download className='mr-2 h-4 w-4' />
                Litters (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportPuppiesToCSV(litters, dogs)}
              >
                <Download className='mr-2 h-4 w-4' />
                Puppies (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportExpensesToCSV(litters, dogs)}
              >
                <Download className='mr-2 h-4 w-4' />
                Expenses (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <div className='hidden sm:block'>
            <ThemeToggle />
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <User className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='bg-background'>
              <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                {currentUser?.displayName || currentUser?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className='mr-2 h-4 w-4' />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
