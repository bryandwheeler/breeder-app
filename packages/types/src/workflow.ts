// Automated Workflows & Email Scheduling Types

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;

  // Trigger - What starts the workflow
  trigger: WorkflowTrigger;

  // Conditions - When to run (optional filters)
  conditions?: WorkflowCondition[];

  // Actions - What to do
  actions: WorkflowAction[];

  // Statistics
  timesTriggered: number;
  lastTriggered?: string;

  createdAt: string;
  updatedAt: string;
}

// ========== TRIGGERS ==========

export type TriggerType =
  | 'customer_created'           // New customer added
  | 'customer_status_changed'    // Customer status changes
  | 'customer_type_changed'      // Customer type changes
  | 'interaction_added'          // New interaction logged
  | 'deposit_received'           // Payment/deposit noted
  | 'litter_born'                // New litter created
  | 'puppy_ready'                // Puppy reaches ready age
  | 'pickup_scheduled'           // Pickup date set
  | 'days_after_pickup'          // X days after pickup
  | 'days_before_pickup'         // X days before pickup
  | 'puppy_birthday'             // Puppy's birthday
  | 'no_response'                // X days with no interaction
  | 'manual';                    // Manually triggered

export interface WorkflowTrigger {
  type: TriggerType;

  // For time-based triggers
  daysOffset?: number;           // e.g., 7 days after pickup

  // For status/type change triggers
  fromValue?: string;            // Previous value
  toValue?: string;              // New value

  // For scheduled triggers
  time?: string;                 // Time of day (HH:mm)
}

// ========== CONDITIONS ==========

export type ConditionType =
  | 'customer_type'              // If customer type is X
  | 'customer_status'            // If customer status is X
  | 'customer_tag'               // If customer has tag X
  | 'customer_source'            // If customer source is X
  | 'has_email'                  // If customer has email
  | 'has_phone'                  // If customer has phone
  | 'interaction_count'          // If interaction count meets criteria
  | 'days_since_inquiry'         // Days since first contact
  | 'custom_field';              // Custom condition

export interface WorkflowCondition {
  type: ConditionType;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
  value: string | number | boolean;
}

// ========== ACTIONS ==========

export type ActionType =
  | 'send_email'                 // Send an email
  | 'schedule_email'             // Schedule email for later
  | 'add_tag'                    // Add tag to customer
  | 'remove_tag'                 // Remove tag from customer
  | 'change_status'              // Change customer status
  | 'create_task'                // Create a reminder/task
  | 'add_to_segment'             // Add to customer segment
  | 'send_notification'          // Internal notification
  | 'delay';                     // Wait before next action

export interface WorkflowAction {
  type: ActionType;

  // For send_email action
  templateId?: string;           // Email template to use
  subject?: string;              // Email subject (if not using template)
  body?: string;                 // Email body (if not using template)

  // For schedule_email action
  delayDays?: number;            // Days to wait before sending
  delayHours?: number;           // Hours to wait
  scheduledDate?: string;        // Specific date/time

  // For tag actions
  tagName?: string;

  // For status change
  newStatus?: string;

  // For task creation
  taskTitle?: string;
  taskDescription?: string;
  taskDueDate?: string;

  // For segment actions
  segmentId?: string;

  // For delay action
  delayMinutes?: number;
}

// ========== SCHEDULED EMAILS ==========

export interface ScheduledEmail {
  id: string;
  userId: string;

  // Email details
  customerId?: string;           // Customer to send to
  to: string[];                  // Email addresses
  cc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;

  // Scheduling
  scheduledFor: string;          // ISO timestamp
  timezone?: string;             // User's timezone

  // Template used (optional)
  templateId?: string;

  // Status
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: string;
  error?: string;

  // Source
  source: 'manual' | 'workflow';
  workflowId?: string;           // If created by workflow

  createdAt: string;
  updatedAt: string;
}

// ========== WORKFLOW TEMPLATES ==========

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  trigger: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
}

export type WorkflowCategory =
  | 'inquiry_followup'
  | 'waitlist_management'
  | 'deposit_reminders'
  | 'pickup_preparation'
  | 'post_placement'
  | 'birthday_wishes'
  | 'health_updates'
  | 're_engagement';

// ========== DEFAULT WORKFLOW TEMPLATES ==========

export const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'welcome-new-inquiry',
    name: 'Welcome New Inquiry',
    description: 'Automatically send welcome email when new prospect added',
    category: 'inquiry_followup',
    trigger: {
      type: 'customer_created',
    },
    conditions: [
      {
        type: 'customer_type',
        operator: 'equals',
        value: 'prospect',
      },
      {
        type: 'has_email',
        operator: 'exists',
        value: true,
      },
    ],
    actions: [
      {
        type: 'send_email',
        // templateId will be set to user's "Initial Inquiry Response" template
      },
      {
        type: 'add_tag',
        tagName: 'Auto-Welcomed',
      },
    ],
  },
  {
    id: 'followup-no-response',
    name: 'Follow Up After 7 Days No Response',
    description: 'Send follow-up email if prospect hasn\'t responded in 7 days',
    category: 'inquiry_followup',
    trigger: {
      type: 'no_response',
      daysOffset: 7,
    },
    conditions: [
      {
        type: 'customer_type',
        operator: 'equals',
        value: 'prospect',
      },
    ],
    actions: [
      {
        type: 'send_email',
        subject: 'Just checking in - {{kennel_name}}',
        body: `Hi {{customer_first_name}},

I wanted to follow up on my previous email about our {{breed}} puppies. I know life gets busy, so I wanted to make sure my message didn't get lost!

If you have any questions or would like to chat, I'd love to hear from you.

Best regards,
{{breeder_name}}
{{kennel_name}}
{{phone}} | {{email}}`,
      },
    ],
  },
  {
    id: 'deposit-reminder',
    name: 'Deposit Reminder - 3 Days',
    description: 'Remind customers about pending deposit after 3 days',
    category: 'deposit_reminders',
    trigger: {
      type: 'customer_status_changed',
      toValue: 'pending_deposit',
    },
    actions: [
      {
        type: 'delay',
        delayDays: 3,
      },
      {
        type: 'send_email',
        subject: 'Deposit Reminder - {{kennel_name}}',
        body: `Hi {{customer_first_name}},

Just a friendly reminder that we're holding a spot for you on our waitlist! To secure your place, we'll need the deposit of {{deposit_amount}}.

If you have any questions or concerns, please don't hesitate to reach out.

Thank you,
{{breeder_name}}
{{kennel_name}}`,
      },
    ],
  },
  {
    id: 'pickup-week-reminder',
    name: 'Pickup Reminder - 1 Week Before',
    description: 'Send pickup details one week before scheduled pickup',
    category: 'pickup_preparation',
    trigger: {
      type: 'days_before_pickup',
      daysOffset: 7,
    },
    actions: [
      {
        type: 'send_email',
        // templateId will be set to "Pickup Reminder - 1 Week" template
      },
    ],
  },
  {
    id: 'pickup-day-reminder',
    name: 'Pickup Reminder - Day Before',
    description: 'Final reminder the day before pickup',
    category: 'pickup_preparation',
    trigger: {
      type: 'days_before_pickup',
      daysOffset: 1,
    },
    actions: [
      {
        type: 'send_email',
        subject: 'Tomorrow is the big day! - {{kennel_name}}',
        body: `Hi {{customer_first_name}},

Tomorrow is finally here! {{puppy_name}} is so excited to meet you.

Quick reminders:
✓ Pickup time: [TIME]
✓ Bring carrier/crate
✓ Bring final payment ({{balance_due}})
✓ Bring photo ID

See you tomorrow!
{{breeder_name}}`,
      },
    ],
  },
  {
    id: 'post-pickup-2-weeks',
    name: '2-Week Follow-Up After Pickup',
    description: 'Check in with new puppy owners 2 weeks after pickup',
    category: 'post_placement',
    trigger: {
      type: 'days_after_pickup',
      daysOffset: 14,
    },
    actions: [
      {
        type: 'send_email',
        // templateId will be set to "2-Week Follow-Up" template
      },
    ],
  },
  {
    id: 'first-birthday',
    name: 'First Birthday Wishes',
    description: 'Automatically send birthday wishes on puppy\'s first birthday',
    category: 'birthday_wishes',
    trigger: {
      type: 'puppy_birthday',
    },
    actions: [
      {
        type: 'send_email',
        // templateId will be set to "First Birthday" template
      },
    ],
  },
  {
    id: 'yearly-health-update',
    name: 'Yearly Health Update Request',
    description: 'Request health update annually',
    category: 'health_updates',
    trigger: {
      type: 'puppy_birthday',
    },
    conditions: [
      {
        type: 'custom_field',
        operator: 'greater_than',
        value: 1, // Older than 1 year
      },
    ],
    actions: [
      {
        type: 'send_email',
        // templateId will be set to "Health Update Request" template
      },
    ],
  },
];

// ========== WORKFLOW EXECUTION LOG ==========

export interface WorkflowExecutionLog {
  id: string;
  userId: string;
  workflowId: string;
  customerId?: string;

  status: 'success' | 'failed' | 'skipped';
  error?: string;

  actionsExecuted: {
    action: WorkflowAction;
    status: 'success' | 'failed';
    error?: string;
    result?: any;
  }[];

  triggeredAt: string;
  completedAt?: string;
}
