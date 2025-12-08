// Email Template Types

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  category: TemplateCategory;
  isDefault: boolean; // System-provided templates
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory =
  | 'inquiry_response'
  | 'waitlist'
  | 'deposit'
  | 'payment'
  | 'pickup'
  | 'followup'
  | 'birthday'
  | 'health_update'
  | 'general'
  | 'custom';

export interface TemplateVariable {
  name: string;
  label: string;
  description: string;
  example: string;
}

// Available variables for all templates
export const COMMON_VARIABLES: TemplateVariable[] = [
  {
    name: 'customer_name',
    label: 'Customer Name',
    description: "Customer's full name",
    example: 'John Smith',
  },
  {
    name: 'customer_first_name',
    label: 'Customer First Name',
    description: "Customer's first name only",
    example: 'John',
  },
  {
    name: 'breeder_name',
    label: 'Breeder Name',
    description: 'Your name',
    example: 'Jane Doe',
  },
  {
    name: 'kennel_name',
    label: 'Kennel Name',
    description: 'Your kennel name',
    example: 'Elite Golden Retrievers',
  },
  {
    name: 'breed',
    label: 'Breed',
    description: 'Dog breed',
    example: 'Golden Retriever',
  },
  {
    name: 'phone',
    label: 'Your Phone',
    description: 'Your phone number',
    example: '(555) 123-4567',
  },
  {
    name: 'email',
    label: 'Your Email',
    description: 'Your email address',
    example: 'jane@example.com',
  },
  {
    name: 'website',
    label: 'Your Website',
    description: 'Your website URL',
    example: 'https://example.com',
  },
];

// Puppy-specific variables
export const PUPPY_VARIABLES: TemplateVariable[] = [
  {
    name: 'puppy_name',
    label: 'Puppy Name',
    description: "Puppy's name",
    example: 'Max',
  },
  {
    name: 'puppy_sex',
    label: 'Puppy Sex',
    description: "Puppy's sex",
    example: 'Male',
  },
  {
    name: 'puppy_color',
    label: 'Puppy Color',
    description: "Puppy's color",
    example: 'Golden',
  },
  {
    name: 'puppy_birthdate',
    label: 'Puppy Birth Date',
    description: "Puppy's date of birth",
    example: 'January 15, 2024',
  },
  {
    name: 'puppy_age',
    label: 'Puppy Age',
    description: "Puppy's current age",
    example: '8 weeks',
  },
];

// Payment-specific variables
export const PAYMENT_VARIABLES: TemplateVariable[] = [
  {
    name: 'deposit_amount',
    label: 'Deposit Amount',
    description: 'Deposit amount',
    example: '$500',
  },
  {
    name: 'total_price',
    label: 'Total Price',
    description: 'Total puppy price',
    example: '$2,500',
  },
  {
    name: 'balance_due',
    label: 'Balance Due',
    description: 'Remaining balance',
    example: '$2,000',
  },
  {
    name: 'due_date',
    label: 'Due Date',
    description: 'Payment due date',
    example: 'March 15, 2024',
  },
];

// Litter-specific variables
export const LITTER_VARIABLES: TemplateVariable[] = [
  {
    name: 'litter_name',
    label: 'Litter Name',
    description: 'Name of the litter',
    example: 'Spring 2024 Litter',
  },
  {
    name: 'dam_name',
    label: 'Dam Name',
    description: "Mother's name",
    example: 'Bella',
  },
  {
    name: 'sire_name',
    label: 'Sire Name',
    description: "Father's name",
    example: 'Duke',
  },
  {
    name: 'birth_date',
    label: 'Birth Date',
    description: 'Litter birth date',
    example: 'January 15, 2024',
  },
  {
    name: 'ready_date',
    label: 'Ready Date',
    description: 'Date puppies are ready to go home',
    example: 'March 15, 2024',
  },
];

// Default email templates
export const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Initial Inquiry Response',
    category: 'inquiry_response',
    subject: 'Thank you for your interest in {{kennel_name}}',
    body: `Hi {{customer_first_name}},

Thank you so much for reaching out about our {{breed}}s! I'm {{breeder_name}} from {{kennel_name}}, and I'm excited to learn more about you and your family.

I'd love to hear more about:
• Your experience with dogs
• Your living situation (house, yard, etc.)
• What you're looking for in a puppy
• Your timeline for bringing a puppy home

Our typical pricing is {{total_price}}, with a deposit of {{deposit_amount}} to reserve your spot on our waitlist.

Feel free to call me at {{phone}} or reply to this email with any questions. I'm also happy to schedule a call to discuss further!

Looking forward to hearing from you,
{{breeder_name}}
{{kennel_name}}
{{phone}} | {{email}}
{{website}}`,
    isDefault: true,
    variables: [...COMMON_VARIABLES, ...PAYMENT_VARIABLES],
  },
  {
    name: 'Waitlist Confirmation',
    category: 'waitlist',
    subject: 'Welcome to the {{kennel_name}} Waitlist!',
    body: `Hi {{customer_first_name}},

Congratulations! You're now on our waitlist for a {{breed}} puppy from {{kennel_name}}.

Your deposit of {{deposit_amount}} has been received and your spot is secured. Here's what happens next:

1. I'll keep you updated on upcoming litters
2. You'll receive photos and updates as puppies grow
3. When it's your turn, you'll have the opportunity to choose your puppy
4. Puppies go home at 8 weeks old

Current Timeline:
• Next expected litter: {{birth_date}}
• Expected ready date: {{ready_date}}

I'll be in touch soon with more updates! In the meantime, feel free to reach out with any questions.

Best regards,
{{breeder_name}}
{{kennel_name}}
{{phone}} | {{email}}`,
    isDefault: true,
    variables: [...COMMON_VARIABLES, ...PAYMENT_VARIABLES, ...LITTER_VARIABLES],
  },
  {
    name: 'Deposit Received',
    category: 'deposit',
    subject: 'Deposit Received - {{kennel_name}}',
    body: `Hi {{customer_first_name}},

This email confirms I've received your deposit of {{deposit_amount}} for your {{breed}} puppy!

Payment Details:
• Deposit: {{deposit_amount}}
• Total Price: {{total_price}}
• Balance Due: {{balance_due}}
• Due By: {{due_date}}

Your spot is now secured. I'll keep you updated with photos and progress as your puppy grows!

Thank you,
{{breeder_name}}
{{kennel_name}}`,
    isDefault: true,
    variables: [...COMMON_VARIABLES, ...PAYMENT_VARIABLES],
  },
  {
    name: 'Puppy Available - Litter Announcement',
    category: 'waitlist',
    subject: 'Exciting News - {{litter_name}} Has Arrived!',
    body: `Hi {{customer_first_name}},

Great news! Our {{litter_name}} was born on {{birth_date}}!

Litter Details:
• Dam: {{dam_name}}
• Sire: {{sire_name}}
• Birth Date: {{birth_date}}
• Ready to Go Home: {{ready_date}}

I'll be sending weekly updates with photos and videos as the puppies grow. You're in a great position on our waitlist, so start getting excited!

If you have any questions about the selection process or what to expect, don't hesitate to reach out.

Best,
{{breeder_name}}
{{kennel_name}}
{{phone}} | {{email}}`,
    isDefault: true,
    variables: [...COMMON_VARIABLES, ...LITTER_VARIABLES],
  },
  {
    name: 'Pickup Reminder - 1 Week',
    category: 'pickup',
    subject: 'One Week Until {{puppy_name}} Comes Home! 🐾',
    body: `Hi {{customer_first_name}},

Can you believe it? Just one more week until {{puppy_name}} comes home with you!

Pickup Details:
• Date: {{due_date}}
• Puppy: {{puppy_name}} ({{puppy_sex}}, {{puppy_color}})
• Age: {{puppy_age}}

Please remember to bring:
✓ Carrier or crate for the ride home
✓ Collar and leash
✓ Final payment ({{balance_due}})
✓ Photo ID

{{puppy_name}} will come home with:
✓ Health records and vaccine history
✓ AKC registration paperwork
✓ Puppy starter kit (food, toys, etc.)
✓ Health guarantee and contract

If you have any last-minute questions, please don't hesitate to call me at {{phone}}.

See you soon!
{{breeder_name}}
{{kennel_name}}`,
    isDefault: true,
    variables: [...COMMON_VARIABLES, ...PUPPY_VARIABLES, ...PAYMENT_VARIABLES],
  },
  {
    name: '2-Week Follow-Up',
    category: 'followup',
    subject: 'How is {{puppy_name}} doing?',
    body: `Hi {{customer_first_name}},

I hope {{puppy_name}} is settling in well! It's been about 2 weeks since pickup, and I wanted to check in and see how things are going.

How is {{puppy_name}} adjusting to the new home? I'd love to hear about:
• How's the potty training going?
• Is {{puppy_name}} eating well?
• Any challenges or questions?
• Sleeping through the night yet?

Please feel free to send photos or videos - I love seeing updates!

Remember, I'm here to help with any questions or concerns. Don't hesitate to reach out.

Best,
{{breeder_name}}
{{kennel_name}}
{{phone}} | {{email}}`,
    isDefault: true,
    variables: [...COMMON_VARIABLES, ...PUPPY_VARIABLES],
  },
  {
    name: 'First Birthday',
    category: 'birthday',
    subject: 'Happy 1st Birthday, {{puppy_name}}! 🎂',
    body: `Hi {{customer_first_name}},

Happy 1st Birthday to {{puppy_name}}! 🎉

I can't believe it's been a whole year since {{puppy_name}} went home with you. I hope you're having a wonderful celebration!

I'd absolutely love to see recent photos and hear how {{puppy_name}} is doing. It's always such a joy to see how my puppies grow and thrive in their forever homes.

If you haven't already, please consider:
• Scheduling {{puppy_name}}'s annual vet checkup
• Updating any health clearances (OFA, etc.)
• Sharing an updated photo for our website/social media (with your permission!)

Thank you for giving {{puppy_name}} such a wonderful home. Please stay in touch!

Warm regards,
{{breeder_name}}
{{kennel_name}}`,
    isDefault: true,
    variables: [...COMMON_VARIABLES, ...PUPPY_VARIABLES],
  },
  {
    name: 'Health Update Request',
    category: 'health_update',
    subject: 'Health Update for {{puppy_name}}',
    body: `Hi {{customer_first_name}},

I hope this email finds you and {{puppy_name}} doing well!

As part of my commitment to breeding healthy {{breed}}s, I track the long-term health of all my puppies. Would you mind providing a quick update on {{puppy_name}}?

I'm interested in:
• Any health issues or concerns
• Results of health testing (hips, elbows, eyes, heart, etc.)
• Overall temperament and behavior
• Any other updates you'd like to share

This information helps me make the best breeding decisions for future litters and ensures I'm producing healthy, sound puppies.

Thank you so much for your help! And as always, I'd love to see recent photos of {{puppy_name}}!

Best,
{{breeder_name}}
{{kennel_name}}
{{phone}} | {{email}}`,
    isDefault: true,
    variables: [...COMMON_VARIABLES, ...PUPPY_VARIABLES],
  },
];
