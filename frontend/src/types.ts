/** Shared Task types (mirrored from backend) */

export type Priority = 'urgent' | 'not urgent';
export type Importance = 'important' | 'not important';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  importance: Importance;
  createdAt: string;
  deadline?: string;
  done: boolean;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority: Priority;
  importance: Importance;
  deadline?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: Priority;
  importance?: Importance;
  deadline?: string;
  done?: boolean;
}

export type QuadrantKey =
  | 'urgent-important'
  | 'not-urgent-important'
  | 'urgent-not-important'
  | 'not-urgent-not-important';

export interface QuadrantInfo {
  key: QuadrantKey;
  label: string;
  subtitle: string;
  priority: Priority;
  importance: Importance;
  color: string;
  icon: string;
}

export const QUADRANTS: QuadrantInfo[] = [
  {
    key: 'urgent-important',
    label: 'Do First',
    subtitle: 'Urgent & Important',
    priority: 'urgent',
    importance: 'important',
    color: '#D32F2F', // Red
    icon: 'mdi-flash',
  },
  {
    key: 'not-urgent-important',
    label: 'Schedule',
    subtitle: 'Not Urgent & Important',
    priority: 'not urgent',
    importance: 'important',
    color: '#1976D2', // Blue
    icon: 'mdi-calendar-clock',
  },
  {
    key: 'urgent-not-important',
    label: 'Delegate',
    subtitle: 'Urgent & Not Important',
    priority: 'urgent',
    importance: 'not important',
    color: '#F9A825', // Orange/Yellow
    icon: 'mdi-account-arrow-right',
  },
  {
    key: 'not-urgent-not-important',
    label: 'Eliminate',
    subtitle: 'Not Urgent & Not Important',
    priority: 'not urgent',
    importance: 'not important',
    color: '#607D8B', // Gray-Blue
    icon: 'mdi-delete-outline',
  },
];
