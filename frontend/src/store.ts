import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Task, CreateTaskDTO, UpdateTaskDTO, Priority, Importance } from './types';
import { taskApi } from './api';

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([]);
  const archivedTasks = ref<Task[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const showArchive = ref(false);

  // Group tasks by quadrant
  const quadrantTasks = computed(() => {
    const activeTasks = tasks.value.filter((t) => !t.done);
    return {
      'urgent-important': activeTasks
        .filter((t) => t.priority === 'urgent' && t.importance === 'important')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      'not-urgent-important': activeTasks
        .filter((t) => t.priority === 'not urgent' && t.importance === 'important')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      'urgent-not-important': activeTasks
        .filter((t) => t.priority === 'urgent' && t.importance === 'not important')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      'not-urgent-not-important': activeTasks
        .filter((t) => t.priority === 'not urgent' && t.importance === 'not important')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  });

  const completedTasks = computed(() => tasks.value.filter((t) => t.done));

  async function fetchTasks() {
    loading.value = true;
    error.value = null;
    try {
      tasks.value = await taskApi.getAll();
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchArchived() {
    try {
      archivedTasks.value = await taskApi.getArchived();
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message;
    }
  }

  async function createTask(dto: CreateTaskDTO) {
    error.value = null;
    try {
      const task = await taskApi.create(dto);
      tasks.value.unshift(task);
      return task;
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message;
      throw e;
    }
  }

  async function updateTask(id: string, dto: UpdateTaskDTO) {
    error.value = null;
    try {
      const updated = await taskApi.update(id, dto);
      const idx = tasks.value.findIndex((t) => t.id === id);
      if (idx >= 0) {
        tasks.value[idx] = { ...tasks.value[idx], ...updated };
      }
      return updated;
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message;
      throw e;
    }
  }

  async function deleteTask(id: string) {
    error.value = null;
    try {
      await taskApi.delete(id);
      tasks.value = tasks.value.filter((t) => t.id !== id);
    } catch (e: any) {
      error.value = e.response?.data?.error || e.message;
      throw e;
    }
  }

  async function moveTask(taskId: string, priority: Priority, importance: Importance) {
    return updateTask(taskId, { priority, importance });
  }

  async function toggleDone(id: string) {
    const task = tasks.value.find((t) => t.id === id);
    if (task) {
      return updateTask(id, { done: !task.done });
    }
  }

  return {
    tasks,
    archivedTasks,
    loading,
    error,
    showArchive,
    quadrantTasks,
    completedTasks,
    fetchTasks,
    fetchArchived,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleDone,
  };
});
