import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  orderBy,
} from 'firebase/firestore';
import { db } from '@breeder/firebase';
import { Workflow, WorkflowExecutionLog, DEFAULT_WORKFLOW_TEMPLATES } from '@breeder/types';

interface WorkflowStore {
  workflows: Workflow[];
  executionLogs: WorkflowExecutionLog[];
  loading: boolean;
  error: string | null;

  // Workflow CRUD
  loadWorkflows: (userId: string) => Promise<void>;
  subscribeToWorkflows: (userId: string) => Unsubscribe;
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggered' | 'timesTriggered'>) => Promise<void>;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  toggleWorkflow: (id: string, isActive: boolean) => Promise<void>;
  getWorkflowById: (id: string) => Workflow | undefined;

  // Default templates
  initializeDefaultWorkflows: (userId: string) => Promise<void>;

  // Execution
  executeWorkflow: (workflowId: string, context: any) => Promise<void>;
  loadExecutionLogs: (userId: string, workflowId?: string) => Promise<void>;
  subscribeToExecutionLogs: (userId: string, workflowId?: string) => Unsubscribe;

  // Helper methods
  getActiveWorkflowsByTrigger: (triggerType: string) => Workflow[];
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  executionLogs: [],
  loading: false,
  error: null,

  loadWorkflows: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'workflows'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const workflows = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Workflow[];
      set({ workflows, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Error loading workflows:', error);
    }
  },

  subscribeToWorkflows: (userId: string) => {
    const q = query(
      collection(db, 'workflows'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const workflows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Workflow[];
        set({ workflows });
      },
      (error) => {
        set({ error: error.message });
        console.error('Error subscribing to workflows:', error);
      }
    );
  },

  createWorkflow: async (workflowData) => {
    try {
      const docRef = doc(collection(db, 'workflows'));
      const workflow: Workflow = {
        ...workflowData,
        id: docRef.id,
        timesTriggered: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, workflow);

      set((state) => ({
        workflows: [workflow, ...state.workflows],
      }));
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error creating workflow:', error);
      throw error;
    }
  },

  updateWorkflow: async (id, updates) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'workflows', id), updatedData, { merge: true });

      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === id ? { ...w, ...updatedData } : w
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error updating workflow:', error);
      throw error;
    }
  },

  deleteWorkflow: async (id) => {
    try {
      await deleteDoc(doc(db, 'workflows', id));
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error deleting workflow:', error);
      throw error;
    }
  },

  toggleWorkflow: async (id, isActive) => {
    try {
      await get().updateWorkflow(id, { isActive });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error toggling workflow:', error);
      throw error;
    }
  },

  getWorkflowById: (id) => {
    return get().workflows.find((w) => w.id === id);
  },

  initializeDefaultWorkflows: async (userId: string) => {
    try {
      const existingWorkflows = get().workflows;

      // Only initialize if no workflows exist
      if (existingWorkflows.length > 0) {
        console.log('Workflows already exist, skipping initialization');
        return;
      }

      const workflowsToCreate = DEFAULT_WORKFLOW_TEMPLATES.map((template) => ({
        userId,
        name: template.name,
        description: template.description,
        isActive: false, // Start disabled so users can review first
        trigger: template.trigger,
        conditions: template.conditions,
        actions: template.actions,
      }));

      // Create all workflows
      for (const workflowData of workflowsToCreate) {
        await get().createWorkflow(workflowData);
      }

      console.log(`Initialized ${workflowsToCreate.length} default workflows`);
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error initializing default workflows:', error);
      throw error;
    }
  },

  executeWorkflow: async (workflowId, context) => {
    try {
      const workflow = get().getWorkflowById(workflowId);
      if (!workflow || !workflow.isActive) {
        return;
      }

      // Create execution log
      const logRef = doc(collection(db, 'workflowExecutionLogs'));
      const executionLog: WorkflowExecutionLog = {
        id: logRef.id,
        workflowId,
        userId: workflow.userId,
        triggeredAt: new Date().toISOString(),
        status: 'pending',
        context,
      };

      await setDoc(logRef, executionLog);

      // Check conditions
      if (workflow.conditions && workflow.conditions.length > 0) {
        const conditionsMet = await get().evaluateConditions(workflow.conditions, context);
        if (!conditionsMet) {
          await setDoc(
            doc(db, 'workflowExecutionLogs', logRef.id),
            {
              status: 'skipped',
              result: 'Conditions not met',
              completedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          return;
        }
      }

      // Execute actions
      const actionResults = [];
      for (const action of workflow.actions) {
        try {
          const result = await get().executeAction(action, context, workflow.userId);
          actionResults.push({ action: action.type, success: true, result });
        } catch (error: any) {
          actionResults.push({ action: action.type, success: false, error: error.message });
        }
      }

      // Update execution log
      await setDoc(
        doc(db, 'workflowExecutionLogs', logRef.id),
        {
          status: 'completed',
          result: actionResults,
          completedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Update workflow stats
      await get().updateWorkflow(workflowId, {
        timesTriggered: workflow.timesTriggered + 1,
        lastTriggered: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  },

  evaluateConditions: async (conditions, context) => {
    // This is a placeholder - actual implementation would depend on condition types
    // For now, return true to allow workflows to execute
    return true;
  },

  executeAction: async (action, context, userId) => {
    const { useScheduledEmailStore } = await import('@breeder/firebase');
    const { useCrmStore } = await import('@breeder/firebase');
    const { useTaskStore } = await import('@breeder/firebase');

    switch (action.type) {
      case 'send_email':
        if (action.templateId && context.customer) {
          const { useEmailTemplateStore } = await import('@breeder/firebase');
          const template = useEmailTemplateStore.getState().getTemplateById(action.templateId);
          if (template) {
            const { replaceEmailVariables } = await import('@/lib/emailVariables');
            const subject = replaceEmailVariables(template.subject, context);
            const body = replaceEmailVariables(template.body, context);

            // Send email via email store
            const { useEmailStore } = await import('@breeder/firebase');
            await useEmailStore.getState().sendEmail({
              to: [context.customer.email],
              subject,
              body,
              customerId: context.customer.id,
            });

            return { sent: true, to: context.customer.email };
          }
        }
        break;

      case 'schedule_email':
        if (action.templateId && action.delayDays && context.customer) {
          const { useEmailTemplateStore } = await import('@breeder/firebase');
          const template = useEmailTemplateStore.getState().getTemplateById(action.templateId);
          if (template) {
            const { replaceEmailVariables } = await import('@/lib/emailVariables');
            const subject = replaceEmailVariables(template.subject, context);
            const body = replaceEmailVariables(template.body, context);

            const scheduledFor = new Date();
            scheduledFor.setDate(scheduledFor.getDate() + action.delayDays);

            await useScheduledEmailStore.getState().scheduleEmail({
              userId,
              to: [context.customer.email],
              subject,
              body,
              scheduledFor: scheduledFor.toISOString(),
              source: 'workflow',
              customerId: context.customer.id,
            });

            return { scheduled: true, for: scheduledFor.toISOString() };
          }
        }
        break;

      case 'add_tag':
        if (action.tagName && context.customer) {
          const customer = useCrmStore.getState().customers.find((c) => c.id === context.customer.id);
          if (customer) {
            const tags = customer.tags || [];
            if (!tags.includes(action.tagName)) {
              await useCrmStore.getState().updateCustomer(context.customer.id, {
                tags: [...tags, action.tagName],
              });
            }
            return { tagAdded: action.tagName };
          }
        }
        break;

      case 'remove_tag':
        if (action.tagName && context.customer) {
          const customer = useCrmStore.getState().customers.find((c) => c.id === context.customer.id);
          if (customer && customer.tags) {
            await useCrmStore.getState().updateCustomer(context.customer.id, {
              tags: customer.tags.filter((t) => t !== action.tagName),
            });
            return { tagRemoved: action.tagName };
          }
        }
        break;

      case 'change_status':
        if (action.newStatus && context.customer) {
          await useCrmStore.getState().updateCustomer(context.customer.id, {
            type: action.newStatus,
          });
          return { statusChanged: action.newStatus };
        }
        break;

      case 'create_task':
        if (action.taskTitle && context.customer) {
          const dueDate = new Date();
          if (action.dueDays) {
            dueDate.setDate(dueDate.getDate() + action.dueDays);
          }

          await useTaskStore.getState().createTask({
            userId,
            title: action.taskTitle,
            description: action.taskDescription || '',
            relatedTo: 'customer',
            relatedId: context.customer.id,
            dueDate: dueDate.toISOString(),
            priority: 'medium',
            status: 'pending',
          });

          return { taskCreated: action.taskTitle };
        }
        break;

      case 'send_sms':
        // Placeholder for future SMS integration
        return { smsNotImplemented: true };

      case 'create_interaction':
        if (context.customer) {
          const interaction = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            type: 'other' as const,
            notes: action.interactionNotes || 'Automated workflow interaction',
            source: 'workflow' as const,
            direction: 'outbound' as const,
          };

          const customer = useCrmStore.getState().customers.find((c) => c.id === context.customer.id);
          if (customer) {
            await useCrmStore.getState().updateCustomer(context.customer.id, {
              interactions: [...(customer.interactions || []), interaction],
            });
          }

          return { interactionCreated: true };
        }
        break;

      case 'webhook':
        if (action.webhookUrl) {
          await fetch(action.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(context),
          });
          return { webhookCalled: action.webhookUrl };
        }
        break;

      default:
        return { actionNotImplemented: action.type };
    }

    return { executed: false };
  },

  loadExecutionLogs: async (userId, workflowId) => {
    set({ loading: true, error: null });
    try {
      let q = query(
        collection(db, 'workflowExecutionLogs'),
        where('userId', '==', userId),
        orderBy('triggeredAt', 'desc')
      );

      if (workflowId) {
        q = query(q, where('workflowId', '==', workflowId));
      }

      const snapshot = await getDocs(q);
      const executionLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WorkflowExecutionLog[];

      set({ executionLogs, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Error loading execution logs:', error);
    }
  },

  subscribeToExecutionLogs: (userId, workflowId) => {
    let q = query(
      collection(db, 'workflowExecutionLogs'),
      where('userId', '==', userId),
      orderBy('triggeredAt', 'desc')
    );

    if (workflowId) {
      q = query(q, where('workflowId', '==', workflowId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const executionLogs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as WorkflowExecutionLog[];
        set({ executionLogs });
      },
      (error) => {
        set({ error: error.message });
        console.error('Error subscribing to execution logs:', error);
      }
    );
  },

  getActiveWorkflowsByTrigger: (triggerType) => {
    return get().workflows.filter(
      (w) => w.isActive && w.trigger.type === triggerType
    );
  },
}));
