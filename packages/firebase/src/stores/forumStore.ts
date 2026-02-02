import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  getDocs,
  getDoc,
  writeBatch,
  runTransaction,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  ForumCategory,
  ForumThread,
  ForumPost,
  ForumUserProfile,
  ForumAttachment,
  DEFAULT_FORUM_CATEGORIES,
} from '@breeder/types';

interface ForumStore {
  // State
  categories: ForumCategory[];
  threads: ForumThread[];
  currentThread: ForumThread | null;
  posts: ForumPost[];
  userProfile: ForumUserProfile | null;
  loading: boolean;
  threadsLoading: boolean;
  postsLoading: boolean;
  hasMoreThreads: boolean;
  lastThreadDoc: QueryDocumentSnapshot<DocumentData> | null;

  // Category Actions
  subscribeToCategories: () => () => void;
  createCategory: (
    category: Omit<ForumCategory, 'id' | 'createdAt' | 'updatedAt' | 'threadCount' | 'postCount'>
  ) => Promise<string>;
  updateCategory: (id: string, updates: Partial<ForumCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Thread Actions
  subscribeToThreads: (categoryId?: string) => () => void;
  subscribeToThread: (threadId: string) => () => void;
  loadMoreThreads: (categoryId?: string) => Promise<void>;
  createThread: (
    categoryId: string,
    title: string,
    content: string,
    attachments?: ForumAttachment[],
    tags?: string[],
    breedTags?: string[]
  ) => Promise<string>;
  updateThread: (threadId: string, updates: Partial<ForumThread>) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  incrementViewCount: (threadId: string) => Promise<void>;
  toggleThreadPin: (threadId: string, isPinned: boolean) => Promise<void>;
  toggleThreadLock: (threadId: string, isLocked: boolean) => Promise<void>;

  // Post Actions
  subscribeToPosts: (threadId: string) => () => void;
  createPost: (
    threadId: string,
    content: string,
    attachments?: ForumAttachment[],
    parentPostId?: string
  ) => Promise<string>;
  updatePost: (postId: string, content: string, attachments?: ForumAttachment[]) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  togglePostLike: (postId: string) => Promise<void>;

  // User Profile Actions
  loadUserProfile: (userId: string) => Promise<ForumUserProfile | null>;
  initializeUserProfile: (
    breederName: string,
    kennelName?: string,
    breed?: string,
    location?: string
  ) => Promise<void>;

  // Admin Actions
  seedDefaultCategories: () => Promise<void>;

  // Search
  searchThreads: (searchQuery: string, categoryId?: string) => Promise<ForumThread[]>;

  // Helpers
  getCategoryBySlug: (slug: string) => ForumCategory | undefined;
  clearThreads: () => void;
}

export const useForumStore = create<ForumStore>((set, get) => ({
  categories: [],
  threads: [],
  currentThread: null,
  posts: [],
  userProfile: null,
  loading: false,
  threadsLoading: false,
  postsLoading: false,
  hasMoreThreads: true,
  lastThreadDoc: null,

  // Category Subscriptions
  subscribeToCategories: () => {
    const q = query(
      collection(db, 'forumCategories'),
      where('isActive', '==', true),
      orderBy('sortOrder')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const categories = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ForumCategory[];
        set({ categories });
      },
      (error) => {
        console.error('[forumStore] Categories snapshot error:', error);
      }
    );

    return unsubscribe;
  },

  createCategory: async (category) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'forumCategories'), {
      ...category,
      threadCount: 0,
      postCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  updateCategory: async (id, updates) => {
    const docRef = doc(db, 'forumCategories', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  deleteCategory: async (id) => {
    const docRef = doc(db, 'forumCategories', id);
    // Soft delete by setting isActive to false
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
  },

  // Thread Subscriptions
  subscribeToThreads: (categoryId?: string) => {
    set({ threadsLoading: true, threads: [], lastThreadDoc: null, hasMoreThreads: true });

    let q;
    if (categoryId) {
      q = query(
        collection(db, 'forumThreads'),
        where('categoryId', '==', categoryId),
        where('status', 'in', ['open', 'pinned']),
        orderBy('isPinned', 'desc'),
        orderBy('lastReplyAt', 'desc'),
        limit(20)
      );
    } else {
      q = query(
        collection(db, 'forumThreads'),
        where('status', 'in', ['open', 'pinned']),
        orderBy('lastReplyAt', 'desc'),
        limit(20)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const threads = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ForumThread[];

        const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

        set({
          threads,
          threadsLoading: false,
          hasMoreThreads: snapshot.docs.length === 20,
          lastThreadDoc: lastDoc,
        });
      },
      (error) => {
        console.error('[forumStore] Threads snapshot error:', error);
        set({ threadsLoading: false });
      }
    );

    return unsubscribe;
  },

  subscribeToThread: (threadId: string) => {
    const docRef = doc(db, 'forumThreads', threadId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          set({
            currentThread: {
              id: docSnap.id,
              ...docSnap.data(),
            } as ForumThread,
          });
        } else {
          set({ currentThread: null });
        }
      },
      (error) => {
        console.error('[forumStore] Thread snapshot error:', error);
      }
    );

    return unsubscribe;
  },

  loadMoreThreads: async (categoryId?: string) => {
    const { lastThreadDoc, hasMoreThreads } = get();
    if (!hasMoreThreads || !lastThreadDoc) return;

    set({ threadsLoading: true });

    let q;
    if (categoryId) {
      q = query(
        collection(db, 'forumThreads'),
        where('categoryId', '==', categoryId),
        where('status', 'in', ['open', 'pinned']),
        orderBy('isPinned', 'desc'),
        orderBy('lastReplyAt', 'desc'),
        startAfter(lastThreadDoc),
        limit(20)
      );
    } else {
      q = query(
        collection(db, 'forumThreads'),
        where('status', 'in', ['open', 'pinned']),
        orderBy('lastReplyAt', 'desc'),
        startAfter(lastThreadDoc),
        limit(20)
      );
    }

    const snapshot = await getDocs(q);
    const newThreads = snapshot.docs.map((docSnap) =>
      ({ id: docSnap.id, ...(docSnap.data() as object) }) as ForumThread
    );

    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    set((state) => ({
      threads: [...state.threads, ...newThreads],
      threadsLoading: false,
      hasMoreThreads: snapshot.docs.length === 20,
      lastThreadDoc: lastDoc,
    }));
  },

  createThread: async (categoryId, title, content, attachments, tags, breedTags) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to create a thread');

    // Get user's breeder profile for author info
    const profileDoc = await getDoc(doc(db, 'breederProfiles', user.uid));
    const profile = profileDoc.data();

    // Get category info
    const categoryDoc = await getDoc(doc(db, 'forumCategories', categoryId));
    const category = categoryDoc.data();

    const now = new Date().toISOString();

    const threadData: Omit<ForumThread, 'id'> = {
      categoryId,
      categoryName: category?.name,
      categorySlug: category?.slug,
      authorId: user.uid,
      authorName: profile?.breederName || user.displayName || 'Anonymous',
      authorKennel: profile?.kennelName,
      authorProfilePhoto: profile?.logo || user.photoURL || undefined,
      title,
      content,
      attachments: attachments || [],
      status: 'open',
      isPinned: false,
      isLocked: false,
      tags: tags || [],
      breedTags: breedTags || [],
      viewCount: 0,
      replyCount: 0,
      likeCount: 0,
      lastReplyAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Create thread and update category stats in a batch
    const batch = writeBatch(db);

    const threadRef = doc(collection(db, 'forumThreads'));
    batch.set(threadRef, threadData);

    // Update category stats
    const categoryRef = doc(db, 'forumCategories', categoryId);
    batch.update(categoryRef, {
      threadCount: increment(1),
      lastActivityAt: now,
      lastThreadId: threadRef.id,
      lastThreadTitle: title,
      lastPostAuthorId: user.uid,
      lastPostAuthorName: profile?.breederName || user.displayName || 'Anonymous',
      updatedAt: now,
    });

    // Update user's forum profile
    const userProfileRef = doc(db, 'forumUserProfiles', user.uid);
    const userProfileDoc = await getDoc(userProfileRef);
    if (userProfileDoc.exists()) {
      batch.update(userProfileRef, {
        threadCount: increment(1),
        lastActiveAt: now,
      });
    }

    await batch.commit();

    return threadRef.id;
  },

  updateThread: async (threadId, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const docRef = doc(db, 'forumThreads', threadId);
    await updateDoc(docRef, {
      ...updates,
      editedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  deleteThread: async (threadId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    // Soft delete by archiving
    const docRef = doc(db, 'forumThreads', threadId);
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });
  },

  incrementViewCount: async (threadId) => {
    const docRef = doc(db, 'forumThreads', threadId);
    await updateDoc(docRef, {
      viewCount: increment(1),
    });
  },

  toggleThreadPin: async (threadId, isPinned) => {
    const docRef = doc(db, 'forumThreads', threadId);
    await updateDoc(docRef, {
      isPinned,
      status: isPinned ? 'pinned' : 'open',
      updatedAt: new Date().toISOString(),
    });
  },

  toggleThreadLock: async (threadId, isLocked) => {
    const docRef = doc(db, 'forumThreads', threadId);
    await updateDoc(docRef, {
      isLocked,
      status: isLocked ? 'closed' : 'open',
      updatedAt: new Date().toISOString(),
    });
  },

  // Post Subscriptions
  subscribeToPosts: (threadId: string) => {
    set({ postsLoading: true, posts: [] });

    const q = query(
      collection(db, 'forumPosts'),
      where('threadId', '==', threadId),
      where('status', '!=', 'deleted'),
      orderBy('status'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ForumPost[];
        set({ posts, postsLoading: false });
      },
      (error) => {
        console.error('[forumStore] Posts snapshot error:', error);
        set({ postsLoading: false });
      }
    );

    return unsubscribe;
  },

  createPost: async (threadId, content, attachments, parentPostId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to post');

    // Get user's breeder profile
    const profileDoc = await getDoc(doc(db, 'breederProfiles', user.uid));
    const profile = profileDoc.data();

    // Get thread info for categoryId
    const threadDoc = await getDoc(doc(db, 'forumThreads', threadId));
    const thread = threadDoc.data();
    if (!thread) throw new Error('Thread not found');

    // Calculate reply depth
    let replyDepth = 0;
    if (parentPostId) {
      const parentDoc = await getDoc(doc(db, 'forumPosts', parentPostId));
      const parent = parentDoc.data();
      replyDepth = (parent?.replyDepth || 0) + 1;
      // Max depth of 2
      if (replyDepth > 2) replyDepth = 2;
    }

    const now = new Date().toISOString();

    const postData: Omit<ForumPost, 'id'> = {
      threadId,
      categoryId: thread.categoryId,
      authorId: user.uid,
      authorName: profile?.breederName || user.displayName || 'Anonymous',
      authorKennel: profile?.kennelName,
      authorProfilePhoto: profile?.logo || user.photoURL || undefined,
      content,
      attachments: attachments || [],
      parentPostId,
      replyDepth,
      status: 'active',
      likeCount: 0,
      likedBy: [],
      createdAt: now,
      updatedAt: now,
    };

    // Create post and update thread/category stats
    const batch = writeBatch(db);

    const postRef = doc(collection(db, 'forumPosts'));
    batch.set(postRef, postData);

    // Update thread
    const threadRef = doc(db, 'forumThreads', threadId);
    batch.update(threadRef, {
      replyCount: increment(1),
      lastReplyAt: now,
      lastReplyAuthorId: user.uid,
      lastReplyAuthorName: profile?.breederName || user.displayName || 'Anonymous',
      updatedAt: now,
    });

    // Update category
    const categoryRef = doc(db, 'forumCategories', thread.categoryId);
    batch.update(categoryRef, {
      postCount: increment(1),
      lastActivityAt: now,
      lastPostAuthorId: user.uid,
      lastPostAuthorName: profile?.breederName || user.displayName || 'Anonymous',
      updatedAt: now,
    });

    // Update user profile
    const userProfileRef = doc(db, 'forumUserProfiles', user.uid);
    const userProfileDoc = await getDoc(userProfileRef);
    if (userProfileDoc.exists()) {
      batch.update(userProfileRef, {
        postCount: increment(1),
        lastActiveAt: now,
      });
    }

    await batch.commit();

    return postRef.id;
  },

  updatePost: async (postId, content, attachments) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const now = new Date().toISOString();
    const docRef = doc(db, 'forumPosts', postId);

    const updates: any = {
      content,
      status: 'edited',
      editedAt: now,
      updatedAt: now,
    };

    if (attachments !== undefined) {
      updates.attachments = attachments;
    }

    await updateDoc(docRef, updates);
  },

  deletePost: async (postId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    // Soft delete
    const docRef = doc(db, 'forumPosts', postId);
    await updateDoc(docRef, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: user.uid,
      updatedAt: new Date().toISOString(),
    });
  },

  togglePostLike: async (postId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const postRef = doc(db, 'forumPosts', postId);
    const postDoc = await getDoc(postRef);
    const post = postDoc.data();

    if (!post) throw new Error('Post not found');

    const likedBy = post.likedBy || [];
    const hasLiked = likedBy.includes(user.uid);

    if (hasLiked) {
      // Unlike
      await updateDoc(postRef, {
        likeCount: increment(-1),
        likedBy: likedBy.filter((id: string) => id !== user.uid),
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likeCount: increment(1),
        likedBy: [...likedBy, user.uid],
      });
    }
  },

  // User Profile
  loadUserProfile: async (userId) => {
    const docRef = doc(db, 'forumUserProfiles', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const profile = { userId: docSnap.id, ...docSnap.data() } as ForumUserProfile;
      if (userId === auth.currentUser?.uid) {
        set({ userProfile: profile });
      }
      return profile;
    }
    return null;
  },

  initializeUserProfile: async (breederName, kennelName, breed, location) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const now = new Date().toISOString();

    const profileRef = doc(db, 'forumUserProfiles', user.uid);
    const existingProfile = await getDoc(profileRef);

    if (!existingProfile.exists()) {
      const profile: ForumUserProfile = {
        userId: user.uid,
        breederName,
        kennelName,
        breed,
        location,
        memberSince: now,
        threadCount: 0,
        postCount: 0,
        likeCount: 0,
        emailNotifications: true,
        lastActiveAt: now,
      };

      await addDoc(collection(db, 'forumUserProfiles'), profile);
      set({ userProfile: profile });
    }
  },

  // Admin Actions
  seedDefaultCategories: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const now = new Date().toISOString();
    const batch = writeBatch(db);

    for (const category of DEFAULT_FORUM_CATEGORIES) {
      const docRef = doc(collection(db, 'forumCategories'));
      batch.set(docRef, {
        ...category,
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
  },

  // Search
  searchThreads: async (searchQuery, categoryId) => {
    // Basic search - in production you'd use Algolia or similar
    let q;
    if (categoryId) {
      q = query(
        collection(db, 'forumThreads'),
        where('categoryId', '==', categoryId),
        where('status', 'in', ['open', 'pinned']),
        orderBy('lastReplyAt', 'desc'),
        limit(50)
      );
    } else {
      q = query(
        collection(db, 'forumThreads'),
        where('status', 'in', ['open', 'pinned']),
        orderBy('lastReplyAt', 'desc'),
        limit(50)
      );
    }

    const snapshot = await getDocs(q);
    const threads = snapshot.docs.map((docSnap) =>
      ({ id: docSnap.id, ...(docSnap.data() as object) }) as ForumThread
    );

    // Client-side filter by search query
    const lowerQuery = searchQuery.toLowerCase();
    return threads.filter(
      (thread) =>
        thread.title.toLowerCase().includes(lowerQuery) ||
        thread.content.toLowerCase().includes(lowerQuery) ||
        thread.authorName.toLowerCase().includes(lowerQuery) ||
        thread.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        thread.breedTags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  },

  // Helpers
  getCategoryBySlug: (slug) => {
    return get().categories.find((cat) => cat.slug === slug);
  },

  clearThreads: () => {
    set({ threads: [], currentThread: null, posts: [], lastThreadDoc: null, hasMoreThreads: true });
  },
}));
