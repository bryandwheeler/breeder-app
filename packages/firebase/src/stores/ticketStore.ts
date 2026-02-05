// Ticket Store - Zustand store for managing support tickets
import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy,
  limit,
  getDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  Ticket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketFilters,
  TicketStats,
  CreateTicketData,
  UpdateTicketData,
  CreateTicketMessageData,
  generateTicketNumber,
  UserRole,
} from '@breeder/types';

interface TicketStore {
  // State
  tickets: Ticket[];
  currentTicket: Ticket | null;
  currentTicketMessages: TicketMessage[];
  stats: TicketStats | null;
  loading: boolean;
  error: string | null;

  // Ticket Actions
  createTicket: (data: CreateTicketData) => Promise<string>;
  updateTicket: (ticketId: string, data: UpdateTicketData) => Promise<void>;
  closeTicket: (ticketId: string) => Promise<void>;
  reopenTicket: (ticketId: string) => Promise<void>;
  assignTicket: (ticketId: string, assigneeId: string, assigneeName: string, assigneeEmail: string) => Promise<void>;

  // Message Actions
  addMessage: (ticketId: string, data: CreateTicketMessageData) => Promise<string>;

  // Subscriptions
  subscribeToUserTickets: (userId: string) => () => void;
  subscribeToAllTickets: () => () => void;
  subscribeToTicket: (ticketId: string) => () => void;
  subscribeToTicketMessages: (ticketId: string) => () => void;

  // Queries
  getTicketById: (ticketId: string) => Promise<Ticket | null>;
  getTicketsByFilter: (filters: TicketFilters) => Promise<Ticket[]>;
  getTicketStats: () => Promise<TicketStats>;

  // Utility
  setCurrentTicket: (ticket: Ticket | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Helper to convert Firestore timestamp to ISO string
const toISOString = (timestamp: unknown): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
};

export const useTicketStore = create<TicketStore>((set, get) => ({
  // Initial State
  tickets: [],
  currentTicket: null,
  currentTicketMessages: [],
  stats: null,
  loading: false,
  error: null,

  // ============================================================================
  // Ticket Actions
  // ============================================================================

  createTicket: async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to create tickets');

    set({ loading: true, error: null });
    try {
      // Get user profile for submitter info
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      const ticketData: Omit<Ticket, 'id'> = {
        ticketNumber: generateTicketNumber(),
        submitterId: user.uid,
        submitterEmail: user.email || '',
        submitterName: userData?.displayName || user.email || 'Unknown',
        submitterType: userData?.userType || 'breeder',
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority || 'medium',
        status: 'open',
        tags: [],
        messageCount: 1, // Initial description counts as first message
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(data.relatedDogId && { relatedDogId: data.relatedDogId }),
        ...(data.relatedLitterId && { relatedLitterId: data.relatedLitterId }),
      };

      const docRef = await addDoc(collection(db, 'tickets'), ticketData);

      // Create the initial message (the description)
      await addDoc(collection(db, 'tickets', docRef.id, 'messages'), {
        ticketId: docRef.id,
        senderId: user.uid,
        senderName: userData?.displayName || user.email || 'Unknown',
        senderEmail: user.email || '',
        senderRole: userData?.role || 'user',
        content: data.description,
        attachments: data.attachments || [],
        isInternal: false,
        createdAt: new Date().toISOString(),
      });

      // Create notification for support staff
      await addDoc(collection(db, 'notifications'), {
        userId: 'support', // Special ID for support notifications
        type: 'new_ticket',
        title: 'New Support Ticket',
        message: `${ticketData.submitterName} submitted: ${ticketData.subject}`,
        read: false,
        actionUrl: `/admin/tickets/${docRef.id}`,
        metadata: {
          ticketId: docRef.id,
          ticketNumber: ticketData.ticketNumber,
          category: ticketData.category,
          priority: ticketData.priority,
        },
        createdAt: new Date().toISOString(),
      });

      set({ loading: false });
      return docRef.id;
    } catch (error) {
      console.error('[ticketStore] createTicket error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create ticket';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateTicket: async (ticketId, data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update tickets');

    set({ loading: true, error: null });
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      set({ loading: false });
    } catch (error) {
      console.error('[ticketStore] updateTicket error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update ticket';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  closeTicket: async (ticketId) => {
    await get().updateTicket(ticketId, {
      status: 'closed',
    });
    // Update with closedAt timestamp
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
      closedAt: new Date().toISOString(),
    });
  },

  reopenTicket: async (ticketId) => {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
      status: 'open',
      closedAt: null,
      resolvedAt: null,
      updatedAt: new Date().toISOString(),
    });
  },

  assignTicket: async (ticketId, assigneeId, assigneeName, assigneeEmail) => {
    await get().updateTicket(ticketId, {
      assignedToId: assigneeId,
      assignedToName: assigneeName,
      assignedToEmail: assigneeEmail,
    });

    // Notify the assigned support staff
    await addDoc(collection(db, 'notifications'), {
      userId: assigneeId,
      type: 'ticket_assigned',
      title: 'Ticket Assigned to You',
      message: `You have been assigned to ticket`,
      read: false,
      actionUrl: `/admin/tickets/${ticketId}`,
      metadata: { ticketId },
      createdAt: new Date().toISOString(),
    });
  },

  // ============================================================================
  // Message Actions
  // ============================================================================

  addMessage: async (ticketId, data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to add messages');

    set({ loading: true, error: null });
    try {
      // Get user info
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const userRole = (userData?.role || 'user') as UserRole;

      // Only support/admin can create internal notes
      if (data.isInternal && !['admin', 'support'].includes(userRole)) {
        throw new Error('Only support staff can create internal notes');
      }

      const messageData: Omit<TicketMessage, 'id'> = {
        ticketId,
        senderId: user.uid,
        senderName: userData?.displayName || user.email || 'Unknown',
        senderEmail: user.email || '',
        senderRole: userRole,
        content: data.content,
        attachments: data.attachments || [],
        isInternal: data.isInternal || false,
        createdAt: new Date().toISOString(),
      };

      const messageRef = await addDoc(
        collection(db, 'tickets', ticketId, 'messages'),
        messageData
      );

      // Update ticket metadata
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);
      const ticketData = ticketDoc.data() as Ticket;

      const updateData: Partial<Ticket> = {
        messageCount: (ticketData.messageCount || 0) + 1,
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview:
          data.content.length > 100
            ? data.content.substring(0, 100) + '...'
            : data.content,
        lastMessageSenderId: user.uid,
        updatedAt: new Date().toISOString(),
      };

      // Update status based on who replied
      if (['admin', 'support'].includes(userRole)) {
        // Support replied
        if (ticketData.status === 'open' || ticketData.status === 'waiting_on_support') {
          updateData.status = 'in_progress';
        }
        // Track first response time
        if (!ticketData.firstResponseAt) {
          updateData.firstResponseAt = new Date().toISOString();
        }
      } else {
        // Customer replied
        if (ticketData.status === 'waiting_on_customer') {
          updateData.status = 'waiting_on_support';
        }
      }

      await updateDoc(ticketRef, updateData);

      // Create notification for the other party (if not internal)
      if (!data.isInternal) {
        const isSupport = ['admin', 'support'].includes(userRole);
        const notifyUserId = isSupport
          ? ticketData.submitterId
          : ticketData.assignedToId || 'support';

        await addDoc(collection(db, 'notifications'), {
          userId: notifyUserId,
          type: 'ticket_reply',
          title: 'New Reply on Your Ticket',
          message: `${messageData.senderName} replied to ticket: ${ticketData.subject}`,
          read: false,
          actionUrl: isSupport
            ? `/support/tickets/${ticketId}`
            : `/admin/tickets/${ticketId}`,
          metadata: {
            ticketId,
            ticketNumber: ticketData.ticketNumber,
          },
          createdAt: new Date().toISOString(),
        });
      }

      set({ loading: false });
      return messageRef.id;
    } catch (error) {
      console.error('[ticketStore] addMessage error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to add message';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // ============================================================================
  // Subscriptions
  // ============================================================================

  subscribeToUserTickets: (userId) => {
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('submitterId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const tickets: Ticket[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: toISOString(doc.data().createdAt),
          updatedAt: toISOString(doc.data().updatedAt),
        })) as Ticket[];
        set({ tickets });
      },
      (error) => {
        console.error('[ticketStore] subscribeToUserTickets error:', error);
        set({ error: error.message });
      }
    );
  },

  subscribeToAllTickets: () => {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const tickets: Ticket[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: toISOString(doc.data().createdAt),
          updatedAt: toISOString(doc.data().updatedAt),
        })) as Ticket[];
        set({ tickets });
      },
      (error) => {
        console.error('[ticketStore] subscribeToAllTickets error:', error);
        set({ error: error.message });
      }
    );
  },

  subscribeToTicket: (ticketId) => {
    const ticketRef = doc(db, 'tickets', ticketId);

    return onSnapshot(
      ticketRef,
      (doc) => {
        if (doc.exists()) {
          const ticket = {
            id: doc.id,
            ...doc.data(),
            createdAt: toISOString(doc.data().createdAt),
            updatedAt: toISOString(doc.data().updatedAt),
          } as Ticket;
          set({ currentTicket: ticket });
        } else {
          set({ currentTicket: null });
        }
      },
      (error) => {
        console.error('[ticketStore] subscribeToTicket error:', error);
        set({ error: error.message });
      }
    );
  },

  subscribeToTicketMessages: (ticketId) => {
    const messagesRef = collection(db, 'tickets', ticketId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: TicketMessage[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: toISOString(doc.data().createdAt),
        })) as TicketMessage[];
        set({ currentTicketMessages: messages });
      },
      (error) => {
        console.error('[ticketStore] subscribeToTicketMessages error:', error);
        set({ error: error.message });
      }
    );
  },

  // ============================================================================
  // Queries
  // ============================================================================

  getTicketById: async (ticketId) => {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);

      if (!ticketDoc.exists()) {
        return null;
      }

      return {
        id: ticketDoc.id,
        ...ticketDoc.data(),
        createdAt: toISOString(ticketDoc.data().createdAt),
        updatedAt: toISOString(ticketDoc.data().updatedAt),
      } as Ticket;
    } catch (error) {
      console.error('[ticketStore] getTicketById error:', error);
      throw error;
    }
  },

  getTicketsByFilter: async (filters) => {
    try {
      const ticketsRef = collection(db, 'tickets');
      let q = query(ticketsRef, orderBy('createdAt', 'desc'));

      // Note: Firestore has limitations on compound queries
      // For complex filtering, we fetch and filter in memory
      const snapshot = await getDocs(q);

      let tickets: Ticket[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: toISOString(doc.data().createdAt),
        updatedAt: toISOString(doc.data().updatedAt),
      })) as Ticket[];

      // Apply filters in memory
      if (filters.status?.length) {
        tickets = tickets.filter((t) => filters.status!.includes(t.status));
      }
      if (filters.priority?.length) {
        tickets = tickets.filter((t) => filters.priority!.includes(t.priority));
      }
      if (filters.category?.length) {
        tickets = tickets.filter((t) => filters.category!.includes(t.category));
      }
      if (filters.assignedToId) {
        tickets = tickets.filter((t) => t.assignedToId === filters.assignedToId);
      }
      if (filters.submitterId) {
        tickets = tickets.filter((t) => t.submitterId === filters.submitterId);
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        tickets = tickets.filter(
          (t) =>
            t.subject.toLowerCase().includes(query) ||
            t.ticketNumber.toLowerCase().includes(query) ||
            t.submitterName.toLowerCase().includes(query)
        );
      }

      return tickets;
    } catch (error) {
      console.error('[ticketStore] getTicketsByFilter error:', error);
      throw error;
    }
  },

  getTicketStats: async () => {
    try {
      const ticketsRef = collection(db, 'tickets');
      const snapshot = await getDocs(ticketsRef);

      const stats: TicketStats = {
        totalOpen: 0,
        totalInProgress: 0,
        totalWaitingOnCustomer: 0,
        totalWaitingOnSupport: 0,
        totalResolved: 0,
        totalClosed: 0,
        avgFirstResponseTime: 0,
        avgResolutionTime: 0,
        ticketsByCategory: {
          bug_report: 0,
          feature_request: 0,
          account_issue: 0,
          billing: 0,
          technical_support: 0,
          general_inquiry: 0,
          other: 0,
        },
        ticketsByPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        },
      };

      let totalFirstResponseTime = 0;
      let ticketsWithFirstResponse = 0;
      let totalResolutionTime = 0;
      let resolvedTickets = 0;

      snapshot.docs.forEach((doc) => {
        const ticket = doc.data() as Ticket;

        // Count by status
        switch (ticket.status) {
          case 'open':
            stats.totalOpen++;
            break;
          case 'in_progress':
            stats.totalInProgress++;
            break;
          case 'waiting_on_customer':
            stats.totalWaitingOnCustomer++;
            break;
          case 'waiting_on_support':
            stats.totalWaitingOnSupport++;
            break;
          case 'resolved':
            stats.totalResolved++;
            break;
          case 'closed':
            stats.totalClosed++;
            break;
        }

        // Count by category
        if (ticket.category in stats.ticketsByCategory) {
          stats.ticketsByCategory[ticket.category]++;
        }

        // Count by priority
        if (ticket.priority in stats.ticketsByPriority) {
          stats.ticketsByPriority[ticket.priority]++;
        }

        // Calculate first response time
        if (ticket.firstResponseAt && ticket.createdAt) {
          const created = new Date(ticket.createdAt).getTime();
          const firstResponse = new Date(ticket.firstResponseAt).getTime();
          totalFirstResponseTime += (firstResponse - created) / (1000 * 60); // minutes
          ticketsWithFirstResponse++;
        }

        // Calculate resolution time
        if (ticket.resolvedAt && ticket.createdAt) {
          const created = new Date(ticket.createdAt).getTime();
          const resolved = new Date(ticket.resolvedAt).getTime();
          totalResolutionTime += (resolved - created) / (1000 * 60); // minutes
          resolvedTickets++;
        }
      });

      stats.avgFirstResponseTime =
        ticketsWithFirstResponse > 0
          ? Math.round(totalFirstResponseTime / ticketsWithFirstResponse)
          : 0;
      stats.avgResolutionTime =
        resolvedTickets > 0
          ? Math.round(totalResolutionTime / resolvedTickets)
          : 0;

      set({ stats });
      return stats;
    } catch (error) {
      console.error('[ticketStore] getTicketStats error:', error);
      throw error;
    }
  },

  // ============================================================================
  // Utility
  // ============================================================================

  setCurrentTicket: (ticket) => {
    set({ currentTicket: ticket });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      tickets: [],
      currentTicket: null,
      currentTicketMessages: [],
      stats: null,
      loading: false,
      error: null,
    });
  },
}));
