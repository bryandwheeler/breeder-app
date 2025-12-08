// Email Variable Replacement System

import { BreederProfile } from '@/types/dog';
import { Customer } from '@/types/crm';

export interface VariableContext {
  customer?: Customer;
  breederProfile?: BreederProfile;
  puppy?: {
    name?: string;
    sex?: string;
    color?: string;
    birthdate?: string;
    age?: string;
  };
  litter?: {
    name?: string;
    damName?: string;
    sireName?: string;
    birthDate?: string;
    readyDate?: string;
  };
  payment?: {
    depositAmount?: string;
    totalPrice?: string;
    balanceDue?: string;
    dueDate?: string;
  };
  custom?: Record<string, string>;
}

/**
 * Replace template variables with actual values
 */
export function replaceEmailVariables(
  text: string,
  context: VariableContext
): string {
  let result = text;

  // Customer variables
  if (context.customer) {
    result = result.replace(/{{customer_name}}/g, context.customer.name || '');
    result = result.replace(
      /{{customer_first_name}}/g,
      context.customer.name?.split(' ')[0] || ''
    );
  }

  // Breeder profile variables
  if (context.breederProfile) {
    result = result.replace(
      /{{breeder_name}}/g,
      context.breederProfile.breederName || ''
    );
    result = result.replace(
      /{{kennel_name}}/g,
      context.breederProfile.kennelName || context.breederProfile.breederName || ''
    );
    result = result.replace(
      /{{breed}}/g,
      context.breederProfile.primaryBreed || ''
    );
    result = result.replace(
      /{{phone}}/g,
      context.breederProfile.phone || ''
    );
    result = result.replace(
      /{{email}}/g,
      context.breederProfile.email || ''
    );
    result = result.replace(
      /{{website}}/g,
      context.breederProfile.website || ''
    );
  }

  // Puppy variables
  if (context.puppy) {
    result = result.replace(/{{puppy_name}}/g, context.puppy.name || '');
    result = result.replace(/{{puppy_sex}}/g, context.puppy.sex || '');
    result = result.replace(/{{puppy_color}}/g, context.puppy.color || '');
    result = result.replace(/{{puppy_birthdate}}/g, context.puppy.birthdate || '');
    result = result.replace(/{{puppy_age}}/g, context.puppy.age || '');
  }

  // Litter variables
  if (context.litter) {
    result = result.replace(/{{litter_name}}/g, context.litter.name || '');
    result = result.replace(/{{dam_name}}/g, context.litter.damName || '');
    result = result.replace(/{{sire_name}}/g, context.litter.sireName || '');
    result = result.replace(/{{birth_date}}/g, context.litter.birthDate || '');
    result = result.replace(/{{ready_date}}/g, context.litter.readyDate || '');
  }

  // Payment variables
  if (context.payment) {
    result = result.replace(
      /{{deposit_amount}}/g,
      context.payment.depositAmount || ''
    );
    result = result.replace(
      /{{total_price}}/g,
      context.payment.totalPrice || ''
    );
    result = result.replace(
      /{{balance_due}}/g,
      context.payment.balanceDue || ''
    );
    result = result.replace(
      /{{due_date}}/g,
      context.payment.dueDate || ''
    );
  }

  // Custom variables
  if (context.custom) {
    Object.entries(context.custom).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
  }

  return result;
}

/**
 * Get list of missing variables in a template
 */
export function findMissingVariables(
  text: string,
  context: VariableContext
): string[] {
  const variableRegex = /{{(\w+)}}/g;
  const matches = text.matchAll(variableRegex);
  const missing: string[] = [];

  for (const match of matches) {
    const variable = match[1];
    const replaced = replaceEmailVariables(`{{${variable}}}`, context);

    // If replacement didn't change the text, variable is missing
    if (replaced === `{{${variable}}}`) {
      if (!missing.includes(variable)) {
        missing.push(variable);
      }
    }
  }

  return missing;
}

/**
 * Extract all variables from a template
 */
export function extractVariables(text: string): string[] {
  const variableRegex = /{{(\w+)}}/g;
  const matches = text.matchAll(variableRegex);
  const variables: string[] = [];

  for (const match of matches) {
    const variable = match[1];
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return variables;
}

/**
 * Preview template with sample data
 */
export function previewTemplate(text: string): string {
  const sampleContext: VariableContext = {
    customer: {
      id: 'sample',
      breederId: 'sample',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      type: 'prospect',
      status: 'active',
      source: 'website',
      createdAt: new Date().toISOString(),
      interactions: [],
      tags: [],
    },
    breederProfile: {
      id: 'sample',
      userId: 'sample',
      breederName: 'Jane Doe',
      kennelName: 'Elite Golden Retrievers',
      primaryBreed: 'Golden Retriever',
      email: 'jane@example.com',
      phone: '(555) 987-6543',
      website: 'https://example.com',
      tagline: '',
      about: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      acceptingInquiries: true,
      showPricing: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    puppy: {
      name: 'Max',
      sex: 'Male',
      color: 'Golden',
      birthdate: 'January 15, 2024',
      age: '8 weeks',
    },
    litter: {
      name: 'Spring 2024 Litter',
      damName: 'Bella',
      sireName: 'Duke',
      birthDate: 'January 15, 2024',
      readyDate: 'March 15, 2024',
    },
    payment: {
      depositAmount: '$500',
      totalPrice: '$2,500',
      balanceDue: '$2,000',
      dueDate: 'March 15, 2024',
    },
  };

  return replaceEmailVariables(text, sampleContext);
}
