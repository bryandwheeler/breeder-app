// Waitlist Form Builder Types

export type WaitlistFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'number';

export interface WaitlistFormFieldOption {
  value: string;
  label: string;
}

export interface WaitlistFormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface WaitlistFormField {
  id: string;
  type: WaitlistFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  enabled: boolean;
  order: number;
  sectionId: string;
  options?: WaitlistFormFieldOption[];
  validation?: WaitlistFormFieldValidation;
  builtIn?: boolean;
  fieldKey?: string; // Maps to WaitlistEntry property for built-in fields
}

export interface WaitlistFormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  enabled: boolean;
}

export interface WaitlistFormConfig {
  id: string;
  breederId: string;
  sections: WaitlistFormSection[];
  fields: WaitlistFormField[];
  submitButtonText?: string;
  successMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Default form configuration that mirrors the current hardcoded form
export const DEFAULT_FORM_SECTIONS: WaitlistFormSection[] = [
  { id: 'contact', title: 'Contact Information', order: 0, enabled: true },
  { id: 'co-applicants', title: 'Co-Applicants', description: 'Add any additional people who will be involved in caring for the puppy', order: 1, enabled: true },
  { id: 'social', title: 'Social Media', description: 'Help us connect with you on social media', order: 2, enabled: true },
  { id: 'preferences', title: 'Puppy Preferences', order: 3, enabled: true },
  { id: 'home', title: 'Home & Lifestyle', order: 4, enabled: true },
  { id: 'experience', title: 'Experience & References', order: 5, enabled: true },
  { id: 'additional', title: 'Additional Information', order: 6, enabled: true },
];

export const DEFAULT_FORM_FIELDS: WaitlistFormField[] = [
  // Contact Information
  { id: 'firstName', type: 'text', label: 'First Name', placeholder: 'Enter your first name', required: true, enabled: true, order: 0, sectionId: 'contact', builtIn: true, fieldKey: 'firstName' },
  { id: 'lastName', type: 'text', label: 'Last Name', placeholder: 'Enter your last name', required: true, enabled: true, order: 1, sectionId: 'contact', builtIn: true, fieldKey: 'lastName' },
  { id: 'email', type: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true, enabled: true, order: 2, sectionId: 'contact', builtIn: true, fieldKey: 'email' },
  { id: 'phone', type: 'phone', label: 'Phone Number', placeholder: '(555) 123-4567', required: false, enabled: true, order: 3, sectionId: 'contact', builtIn: true, fieldKey: 'phone' },
  { id: 'address', type: 'text', label: 'Street Address', placeholder: '123 Main St', required: false, enabled: true, order: 4, sectionId: 'contact', builtIn: true, fieldKey: 'address' },
  { id: 'city', type: 'text', label: 'City', placeholder: 'City', required: false, enabled: true, order: 5, sectionId: 'contact', builtIn: true, fieldKey: 'city' },
  { id: 'state', type: 'text', label: 'State/Province', placeholder: 'State', required: false, enabled: true, order: 6, sectionId: 'contact', builtIn: true, fieldKey: 'state' },
  { id: 'zipCode', type: 'text', label: 'ZIP/Postal Code', placeholder: '12345', required: false, enabled: true, order: 7, sectionId: 'contact', builtIn: true, fieldKey: 'zipCode' },
  { id: 'country', type: 'text', label: 'Country', placeholder: 'Country', required: false, enabled: true, order: 8, sectionId: 'contact', builtIn: true, fieldKey: 'country' },

  // Social Media
  { id: 'instagram', type: 'text', label: 'Instagram Username', placeholder: '@username', required: false, enabled: true, order: 0, sectionId: 'social', builtIn: true, fieldKey: 'instagram' },
  { id: 'facebook', type: 'text', label: 'Facebook Profile', placeholder: 'facebook.com/username', required: false, enabled: true, order: 1, sectionId: 'social', builtIn: true, fieldKey: 'facebook' },
  { id: 'tiktok', type: 'text', label: 'TikTok Username', placeholder: '@username', required: false, enabled: true, order: 2, sectionId: 'social', builtIn: true, fieldKey: 'tiktok' },

  // Puppy Preferences
  { id: 'preferredSex', type: 'select', label: 'Preferred Sex', required: false, enabled: true, order: 0, sectionId: 'preferences', builtIn: true, fieldKey: 'preferredSex', options: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'no_preference', label: 'No Preference' },
  ]},
  { id: 'preferredColor', type: 'text', label: 'Preferred Color/Markings', placeholder: 'Any color preferences', required: false, enabled: true, order: 1, sectionId: 'preferences', builtIn: true, fieldKey: 'preferredColor' },
  { id: 'preferredCoat', type: 'text', label: 'Preferred Coat Type', placeholder: 'Any coat preferences', required: false, enabled: true, order: 2, sectionId: 'preferences', builtIn: true, fieldKey: 'preferredCoat' },
  { id: 'purpose', type: 'select', label: 'Primary Purpose', required: false, enabled: true, order: 3, sectionId: 'preferences', builtIn: true, fieldKey: 'purpose', options: [
    { value: 'pet', label: 'Family Pet' },
    { value: 'show', label: 'Show/Conformation' },
    { value: 'breeding', label: 'Breeding' },
    { value: 'performance', label: 'Performance/Sport' },
    { value: 'therapy', label: 'Therapy/Service' },
    { value: 'other', label: 'Other' },
  ]},
  { id: 'interestedInBreedingRights', type: 'checkbox', label: 'Interested in Breeding Rights', required: false, enabled: true, order: 4, sectionId: 'preferences', builtIn: true, fieldKey: 'interestedInBreedingRights' },

  // Home & Lifestyle
  { id: 'homeType', type: 'select', label: 'Type of Home', required: false, enabled: true, order: 0, sectionId: 'home', builtIn: true, fieldKey: 'homeType', options: [
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment/Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'farm', label: 'Farm/Rural Property' },
    { value: 'other', label: 'Other' },
  ]},
  { id: 'ownOrRent', type: 'select', label: 'Own or Rent', required: false, enabled: true, order: 1, sectionId: 'home', builtIn: true, fieldKey: 'ownOrRent', options: [
    { value: 'own', label: 'Own' },
    { value: 'rent', label: 'Rent' },
  ]},
  { id: 'hasYard', type: 'checkbox', label: 'Do you have a yard?', required: false, enabled: true, order: 2, sectionId: 'home', builtIn: true, fieldKey: 'hasYard' },
  { id: 'yardFenced', type: 'checkbox', label: 'Is the yard fenced?', required: false, enabled: true, order: 3, sectionId: 'home', builtIn: true, fieldKey: 'yardFenced' },
  { id: 'hasChildren', type: 'checkbox', label: 'Do you have children?', required: false, enabled: true, order: 4, sectionId: 'home', builtIn: true, fieldKey: 'hasChildren' },
  { id: 'childrenAges', type: 'text', label: 'Ages of Children', placeholder: 'e.g., 5, 8, 12', required: false, enabled: true, order: 5, sectionId: 'home', builtIn: true, fieldKey: 'childrenAges' },
  { id: 'hasOtherPets', type: 'checkbox', label: 'Do you have other pets?', required: false, enabled: true, order: 6, sectionId: 'home', builtIn: true, fieldKey: 'hasOtherPets' },
  { id: 'otherPetsDescription', type: 'textarea', label: 'Describe Your Other Pets', placeholder: 'Type, breed, age, temperament...', required: false, enabled: true, order: 7, sectionId: 'home', builtIn: true, fieldKey: 'otherPetsDescription' },
  { id: 'householdActivity', type: 'select', label: 'Household Activity Level', required: false, enabled: true, order: 8, sectionId: 'home', builtIn: true, fieldKey: 'householdActivity', options: [
    { value: 'low', label: 'Low - Quiet, relaxed household' },
    { value: 'moderate', label: 'Moderate - Some activity' },
    { value: 'high', label: 'High - Very active household' },
  ]},

  // Experience & References
  { id: 'previousDogExperience', type: 'textarea', label: 'Previous Dog Experience', placeholder: 'Tell us about your experience with dogs...', required: false, enabled: true, order: 0, sectionId: 'experience', builtIn: true, fieldKey: 'previousDogExperience' },
  { id: 'breedExperience', type: 'textarea', label: 'Experience with This Breed', placeholder: 'Any experience with this specific breed...', required: false, enabled: true, order: 1, sectionId: 'experience', builtIn: true, fieldKey: 'breedExperience' },
  { id: 'vetName', type: 'text', label: 'Veterinarian Name', placeholder: 'Your vet\'s name or clinic', required: false, enabled: true, order: 2, sectionId: 'experience', builtIn: true, fieldKey: 'vetName' },
  { id: 'vetPhone', type: 'phone', label: 'Veterinarian Phone', placeholder: '(555) 123-4567', required: false, enabled: true, order: 3, sectionId: 'experience', builtIn: true, fieldKey: 'vetPhone' },
  { id: 'references', type: 'textarea', label: 'References', placeholder: 'Personal or professional references...', required: false, enabled: true, order: 4, sectionId: 'experience', builtIn: true, fieldKey: 'references' },

  // Additional Information
  { id: 'howHeard', type: 'select', label: 'How did you hear about us?', required: false, enabled: true, order: 0, sectionId: 'additional', builtIn: true, fieldKey: 'howHeard', options: [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'google', label: 'Google Search' },
    { value: 'referral', label: 'Friend/Family Referral' },
    { value: 'breeder_directory', label: 'Breeder Directory' },
    { value: 'dog_show', label: 'Dog Show/Event' },
    { value: 'other', label: 'Other' },
  ]},
  { id: 'additionalComments', type: 'textarea', label: 'Additional Comments', placeholder: 'Anything else you\'d like us to know...', required: false, enabled: true, order: 1, sectionId: 'additional', builtIn: true, fieldKey: 'additionalComments' },
  { id: 'agreeToTerms', type: 'checkbox', label: 'I agree to the waitlist terms and conditions', required: true, enabled: true, order: 2, sectionId: 'additional', builtIn: true, fieldKey: 'agreeToTerms' },
];

export function createDefaultFormConfig(breederId: string): WaitlistFormConfig {
  const now = new Date().toISOString();
  return {
    id: `form_${breederId}`,
    breederId,
    sections: [...DEFAULT_FORM_SECTIONS],
    fields: [...DEFAULT_FORM_FIELDS],
    submitButtonText: 'Submit Application',
    successMessage: 'Thank you for your application! We will review it and get back to you soon.',
    createdAt: now,
    updatedAt: now,
  };
}
