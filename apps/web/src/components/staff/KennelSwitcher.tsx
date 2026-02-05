import { useState } from 'react';
import { useKennel } from '@/contexts/KennelContext';
import { useAuth } from '@/contexts/AuthContext';
import { STAFF_ROLE_LABELS } from '@breeder/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  ChevronDown,
  Check,
  Home,
  Users,
} from 'lucide-react';

export function KennelSwitcher() {
  const { currentUser } = useAuth();
  const {
    isStaff,
    activeKennel,
    availableKennels,
    switchKennel,
    exitStaffMode,
  } = useKennel();
  const [loading, setLoading] = useState(false);

  // Don't show if user has no staff access to any kennels
  if (availableKennels.length === 0) {
    return null;
  }

  const handleSwitchKennel = async (breederId: string) => {
    setLoading(true);
    try {
      await switchKennel(breederId);
    } catch (error) {
      console.error('[KennelSwitcher] Error switching kennel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExitStaffMode = () => {
    exitStaffMode();
  };

  // Current kennel name
  const currentKennelName = isStaff
    ? activeKennel?.kennelName || activeKennel?.breederName || 'Staff Mode'
    : 'My Kennel';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isStaff ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          {isStaff ? (
            <Users className="h-4 w-4" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          <span className="max-w-32 truncate">{currentKennelName}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch Kennel</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Own kennel option */}
        <DropdownMenuItem
          onClick={handleExitStaffMode}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          <div className="flex-1">
            <p className="font-medium">My Kennel</p>
            <p className="text-xs text-muted-foreground">Owner access</p>
          </div>
          {!isStaff && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        {availableKennels.length > 0 && <DropdownMenuSeparator />}

        {/* Staff kennels */}
        {availableKennels.map((kennel) => {
          const isActive = isStaff && activeKennel?.breederId === kennel.breederId;

          return (
            <DropdownMenuItem
              key={kennel.breederId}
              onClick={() => handleSwitchKennel(kennel.breederId)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">
                  {kennel.kennelName || kennel.breederName}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {STAFF_ROLE_LABELS[kennel.role]}
                  </Badge>
                </div>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Banner shown when user is operating in staff mode
 * Similar to the ImpersonationBanner for admins
 */
export function StaffModeBanner() {
  const { isStaff, activeKennel, exitStaffMode } = useKennel();

  if (!isStaff || !activeKennel) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5" />
        <div>
          <span className="font-medium">Staff Mode:</span>{' '}
          <span>
            Working as {STAFF_ROLE_LABELS[activeKennel.role]} for{' '}
            <strong>{activeKennel.kennelName || activeKennel.breederName}</strong>
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={exitStaffMode}
        className="text-white hover:bg-blue-700"
      >
        <Home className="h-4 w-4 mr-2" />
        Exit to My Kennel
      </Button>
    </div>
  );
}
