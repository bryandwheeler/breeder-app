import { useState, useEffect } from 'react';
import {
  StaffPermissions,
  StaffRole,
  DEFAULT_STAFF_PERMISSIONS,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_DESCRIPTIONS,
  STAFF_PERMISSION_CATEGORIES,
  STAFF_PERMISSION_LABELS,
} from '@breeder/types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Dog,
  GitFork,
  Heart,
  Camera,
  ListTodo,
  Users,
  ListOrdered,
  Briefcase,
  FileSignature,
  BarChart3,
  Settings,
} from 'lucide-react';

// Icons for each permission category
const categoryIcons: Record<string, React.ElementType> = {
  dogs: Dog,
  litters: GitFork,
  health: Heart,
  photos: Camera,
  tasks: ListTodo,
  customers: Users,
  waitlist: ListOrdered,
  studJobs: Briefcase,
  contracts: FileSignature,
  reports: BarChart3,
  settings: Settings,
};

interface StaffPermissionsEditorProps {
  /**
   * Current role selection
   */
  role: StaffRole;

  /**
   * Current permissions state
   */
  permissions: StaffPermissions;

  /**
   * Callback when role changes
   */
  onRoleChange: (role: StaffRole) => void;

  /**
   * Callback when permissions change
   */
  onPermissionsChange: (permissions: StaffPermissions) => void;

  /**
   * Whether the editor is disabled
   */
  disabled?: boolean;

  /**
   * Show role selector (default: true)
   */
  showRoleSelector?: boolean;
}

export function StaffPermissionsEditor({
  role,
  permissions,
  onRoleChange,
  onPermissionsChange,
  disabled = false,
  showRoleSelector = true,
}: StaffPermissionsEditorProps) {
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // When role changes, update permissions to match the preset
  const handleRoleChange = (newRole: StaffRole) => {
    onRoleChange(newRole);
    // Apply default permissions for the new role
    onPermissionsChange({ ...DEFAULT_STAFF_PERMISSIONS[newRole] });
  };

  // Toggle a single permission
  const togglePermission = (permissionKey: keyof StaffPermissions) => {
    // If changing permissions manually, switch to custom role
    if (role !== 'custom') {
      onRoleChange('custom');
    }

    onPermissionsChange({
      ...permissions,
      [permissionKey]: !permissions[permissionKey],
    });
  };

  // Count enabled permissions in a category
  const countEnabledInCategory = (categoryKey: string): number => {
    const category = STAFF_PERMISSION_CATEGORIES[categoryKey as keyof typeof STAFF_PERMISSION_CATEGORIES];
    if (!category) return 0;
    return category.permissions.filter(
      (p) => permissions[p as keyof StaffPermissions]
    ).length;
  };

  // Get total permissions in a category
  const getTotalInCategory = (categoryKey: string): number => {
    const category = STAFF_PERMISSION_CATEGORIES[categoryKey as keyof typeof STAFF_PERMISSION_CATEGORIES];
    return category?.permissions.length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      {showRoleSelector && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Role Preset</Label>
          <RadioGroup
            value={role}
            onValueChange={handleRoleChange}
            disabled={disabled}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {(['full_access', 'manager', 'assistant', 'viewer', 'custom'] as StaffRole[]).map(
              (roleOption) => (
                <Label
                  key={roleOption}
                  htmlFor={`role-${roleOption}`}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    role === roleOption
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RadioGroupItem
                    value={roleOption}
                    id={`role-${roleOption}`}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{STAFF_ROLE_LABELS[roleOption]}</div>
                    <div className="text-xs text-muted-foreground">
                      {STAFF_ROLE_DESCRIPTIONS[roleOption]}
                    </div>
                  </div>
                </Label>
              )
            )}
          </RadioGroup>
        </div>
      )}

      {/* Permission Categories */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Permissions {role !== 'custom' && '(from preset)'}
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          {role === 'custom'
            ? 'Select individual permissions below.'
            : 'Adjust any permission to switch to custom role.'}
        </p>

        <Accordion
          type="multiple"
          value={expandedCategories}
          onValueChange={setExpandedCategories}
          className="space-y-2"
        >
          {Object.entries(STAFF_PERMISSION_CATEGORIES).map(([categoryKey, category]) => {
            const Icon = categoryIcons[categoryKey] || Settings;
            const enabledCount = countEnabledInCategory(categoryKey);
            const totalCount = getTotalInCategory(categoryKey);

            return (
              <AccordionItem
                key={categoryKey}
                value={categoryKey}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{category.label}</span>
                    <Badge
                      variant={enabledCount === totalCount ? 'default' : 'secondary'}
                      className="ml-auto mr-2"
                    >
                      {enabledCount}/{totalCount}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    {category.permissions.map((permissionKey) => (
                      <div
                        key={permissionKey}
                        className="flex items-center justify-between"
                      >
                        <Label
                          htmlFor={`perm-${permissionKey}`}
                          className="text-sm cursor-pointer"
                        >
                          {STAFF_PERMISSION_LABELS[permissionKey as keyof StaffPermissions]}
                        </Label>
                        <Switch
                          id={`perm-${permissionKey}`}
                          checked={permissions[permissionKey as keyof StaffPermissions]}
                          onCheckedChange={() =>
                            togglePermission(permissionKey as keyof StaffPermissions)
                          }
                          disabled={disabled}
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
