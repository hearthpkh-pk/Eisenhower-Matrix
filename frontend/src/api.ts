import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from './types';

/** Get or create a persistent user ID */
function getUserId(): string {
  let userId = localStorage.getItem('eisen-user-id');
  if (!userId) {
    userId = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('eisen-user-id', userId);
  }
  return userId;
}

const TASKS_COLLECTION = 'tasks';

export const taskApi = {
  async getAll(): Promise<Task[]> {
    const userId = getUserId();
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        importance: data.importance,
        done: data.done,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate().toISOString() : null,
      } as Task;
    });
  },

  async getArchived(): Promise<Task[]> {
    const userId = getUserId();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      where('deletedAt', '==', null)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          description: data.description,
          priority: data.priority,
          importance: data.importance,
          done: data.done,
          createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
          deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate().toISOString() : null,
        } as Task;
      })
      .filter(t => new Date(t.createdAt) < yesterday || t.done)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async create(dto: CreateTaskDTO): Promise<Task> {
    const userId = getUserId();
    const data = {
      ...dto,
      userId,
      createdAt: serverTimestamp(),
      done: false,
      deletedAt: null,
    };
    
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), data);
    return {
      id: docRef.id,
      ...dto,
      createdAt: new Date().toISOString(),
      done: false,
      deletedAt: null,
    } as Task;
  },

  async update(id: string, dto: UpdateTaskDTO): Promise<Task> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(docRef, { ...dto });
    
    // In a real app, we'd fetch the latest, but for speed we return merged
    return { id, ...dto } as Task; 
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(docRef, { deletedAt: serverTimestamp() });
  },

  async aiSuggest(text: string): Promise<any> {
    // Keep internal mock for AI or integrate later
    const lowerText = text.toLowerCase();
    let priority: 'urgent' | 'not urgent' = 'not urgent';
    let importance: 'important' | 'not important' = 'not important';

    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('now')) priority = 'urgent';
    if (lowerText.includes('important') || lowerText.includes('critical')) importance = 'important';

    return {
      suggestion: { title: text.trim(), priority, importance, confidence: 0.75 }
    };
  },
};
