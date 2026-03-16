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
    // Sanitize: Firestore doesn't like 'undefined'
    const data: any = {
      title: dto.title,
      priority: dto.priority,
      importance: dto.importance,
      userId,
      createdAt: serverTimestamp(),
      done: false,
      deletedAt: null,
    };
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.deadline !== undefined) data.deadline = dto.deadline;
    
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), data);
    return {
      id: docRef.id,
      title: dto.title,
      description: dto.description || '',
      priority: dto.priority,
      importance: dto.importance,
      deadline: dto.deadline,
      createdAt: new Date().toISOString(),
      done: false,
      deletedAt: null,
    } as Task;
  },

  async update(id: string, dto: UpdateTaskDTO): Promise<Task> {
    const docRef = doc(db, TASKS_COLLECTION, id);
    
    // Sanitize: Remove undefined fields before updating
    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.importance !== undefined) updateData.importance = dto.importance;
    if (dto.deadline !== undefined) updateData.deadline = dto.deadline || null;
    if (dto.done !== undefined) updateData.done = dto.done;

    await updateDoc(docRef, updateData);
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
