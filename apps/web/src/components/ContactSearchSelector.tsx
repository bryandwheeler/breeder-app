import React, { useState, useMemo } from 'react';
import type { Customer, ContactRole } from '@breeder/types';
import { useCrmStore } from '@breeder/firebase';

interface ContactSearchSelectorProps {
  value: string | undefined;
  onChange: (contactId: string) => void;
  roles?: ContactRole[];
  label: string;
  placeholder?: string;
  allowCreate?: boolean;
  required?: boolean;
}

export function ContactSearchSelector({
  value,
  onChange,
  roles,
  label,
  placeholder = 'Search by name, email, or phone...',
  allowCreate = true,
  required = false,
}: ContactSearchSelectorProps) {
  const { customers, searchContactByEmail, searchContactByPhone, searchContactByName } = useCrmStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filter contacts by roles if specified
  const filteredContacts = useMemo(() => {
    let contacts = customers;

    if (roles && roles.length > 0) {
      contacts = contacts.filter((c) =>
        c.contactRoles?.some((role) => roles.includes(role))
      );
    }

    return contacts;
  }, [customers, roles]);

  // Search results based on query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredContacts.slice(0, 10); // Show first 10 contacts when no search
    }

    const query = searchQuery.trim();
    const results: Customer[] = [];
    const seen = new Set<string>();

    // Try email match first
    const emailMatch = searchContactByEmail(query);
    if (emailMatch && filteredContacts.some((c) => c.id === emailMatch.id)) {
      results.push(emailMatch);
      seen.add(emailMatch.id);
    }

    // Try phone match
    const phoneMatch = searchContactByPhone(query);
    if (phoneMatch && !seen.has(phoneMatch.id) && filteredContacts.some((c) => c.id === phoneMatch.id)) {
      results.push(phoneMatch);
      seen.add(phoneMatch.id);
    }

    // Add name matches
    const nameMatches = searchContactByName(query).filter(
      (c) => !seen.has(c.id) && filteredContacts.some((fc) => fc.id === c.id)
    );
    results.push(...nameMatches);

    return results.slice(0, 10); // Limit to 10 results
  }, [searchQuery, filteredContacts, searchContactByEmail, searchContactByPhone, searchContactByName]);

  // Get selected contact
  const selectedContact = useMemo(() => {
    return value ? customers.find((c) => c.id === value) : undefined;
  }, [value, customers]);

  const handleSelectContact = (contact: Customer) => {
    onChange(contact.id);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    onChange('');
    setSearchQuery('');
  };

  const handleCreateNew = () => {
    setShowCreateDialog(true);
    setShowDropdown(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {selectedContact ? (
        // Display selected contact
        <div className="flex items-center justify-between border border-gray-300 rounded-md p-3 bg-gray-50">
          <div className="flex-1">
            <div className="font-medium text-gray-900">{selectedContact.name}</div>
            {selectedContact.email && (
              <div className="text-sm text-gray-600">{selectedContact.email}</div>
            )}
            {selectedContact.phone && (
              <div className="text-sm text-gray-600">{selectedContact.phone}</div>
            )}
            {selectedContact.contactRoles && selectedContact.contactRoles.length > 0 && (
              <div className="flex gap-1 mt-1">
                {selectedContact.contactRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="ml-3 text-sm text-red-600 hover:text-red-800"
          >
            Change
          </button>
        </div>
      ) : (
        // Search input
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Dropdown with search results */}
          {showDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              {/* Results dropdown */}
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.length > 0 ? (
                  <ul>
                    {searchResults.map((contact) => (
                      <li key={contact.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectContact(contact)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          <div className="font-medium text-gray-900">{contact.name}</div>
                          {contact.email && (
                            <div className="text-sm text-gray-600">{contact.email}</div>
                          )}
                          {contact.phone && (
                            <div className="text-sm text-gray-600">{contact.phone}</div>
                          )}
                          {contact.contactRoles && contact.contactRoles.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {contact.contactRoles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {searchQuery ? 'No contacts found' : 'Start typing to search...'}
                  </div>
                )}

                {/* Create new contact button */}
                {allowCreate && searchQuery && (
                  <div className="border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      + Create new contact "{searchQuery}"
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Create Contact Dialog */}
      {showCreateDialog && (
        <CreateContactDialog
          initialName={searchQuery}
          roles={roles || []}
          onContactCreated={(contactId) => {
            onChange(contactId);
            setShowCreateDialog(false);
            setSearchQuery('');
          }}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}

// Simple create contact dialog
interface CreateContactDialogProps {
  initialName: string;
  roles: ContactRole[];
  onContactCreated: (contactId: string) => void;
  onClose: () => void;
}

function CreateContactDialog({
  initialName,
  roles,
  onContactCreated,
  onClose,
}: CreateContactDialogProps) {
  const { addCustomer, customers } = useCrmStore();
  const [formData, setFormData] = useState({
    name: initialName,
    email: '',
    phone: '',
    address: '',
    kennelName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    // Validate - require at least email OR phone for contact identification
    if (!formData.email && !formData.phone) {
      setError('Please provide at least an email or phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the contact directly with addCustomer for more control
      await addCustomer({
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        type: 'prospect',
        status: 'active',
        contactRoles: roles,
        tags: formData.kennelName ? [formData.kennelName] : [],
        notes: formData.kennelName ? `Kennel: ${formData.kennelName}` : undefined,
      });

      // Find the newly created contact by email or phone
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Re-fetch the customers to get the latest
      const latestCustomers = useCrmStore.getState().customers;
      let newContact;

      if (formData.email) {
        newContact = latestCustomers.find(
          (c) => c.email?.toLowerCase() === formData.email.toLowerCase()
        );
      }
      if (!newContact && formData.phone) {
        const normalizedPhone = formData.phone.replace(/\D/g, '');
        newContact = latestCustomers.find(
          (c) => c.phone?.replace(/\D/g, '') === normalizedPhone
        );
      }
      if (!newContact) {
        // Fallback: find by name (most recently created)
        newContact = latestCustomers
          .filter((c) => c.name === formData.name)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      }

      if (!newContact) {
        throw new Error('Contact was created but could not be found. Please search for the contact.');
      }

      onContactCreated(newContact.id);
    } catch (err) {
      console.error('Error creating contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use portal to render at document body level (higher z-index context)
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the dialog content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Contact</h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kennel Name
            </label>
            <input
              type="text"
              value={formData.kennelName}
              onChange={(e) => setFormData({ ...formData, kennelName: e.target.value })}
              placeholder="e.g., Happy Paws Kennel"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Required: email or phone</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {roles.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Contact will be created with roles:{' '}
              <span className="font-medium">{roles.map(r => r.replace(/_/g, ' ')).join(', ')}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
