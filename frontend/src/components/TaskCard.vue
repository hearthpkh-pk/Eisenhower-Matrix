<template>
  <div
    class="task-card"
    :class="{ 'task-done': task.done || completed }"
    @click="$emit('edit', task)"
  >
    <div class="task-card-row">
      <v-btn
        icon
        size="x-small"
        variant="text"
        class="check-btn"
        @click.stop="toggleDone"
      >
        <v-icon
          :icon="task.done ? 'mdi-check-circle' : 'mdi-circle-outline'"
          :color="task.done ? 'success' : undefined"
          size="20"
        />
      </v-btn>
      <div class="task-card-content">
        <span class="task-title" :class="{ 'done-title': task.done }">{{ task.title }}</span>
        <span v-if="task.description" class="task-desc">{{ task.description }}</span>
      </div>
      <v-btn
        icon
        size="x-small"
        variant="text"
        class="drag-handle"
        @mousedown.stop
      >
        <v-icon size="16" style="opacity:0.4">mdi-drag-vertical</v-icon>
      </v-btn>
    </div>
    <div class="task-meta" v-if="task.deadline">
      <v-icon icon="mdi-calendar-outline" size="12" class="mr-1" />
      <span>{{ formatDate(task.deadline) }}</span>
    </div>
    <!-- Accent bar -->
    <div class="accent-bar" :style="{ background: quadrantColor }" />
  </div>
</template>

<script setup lang="ts">
import type { Task } from '../types';
import { useTaskStore } from '../store';

const props = defineProps<{
  task: Task;
  quadrantColor?: string;
  completed?: boolean;
}>();

defineEmits<{
  (e: 'edit', task: Task): void;
}>();

const store = useTaskStore();

function toggleDone() {
  store.toggleDone(props.task.id);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
</script>

<style scoped>
.task-card {
  position: relative;
  padding: 16px 16px 16px 8px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.task-card:hover {
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px) scale(1.01);
  border-color: var(--quadrant-color);
}

.task-card:active {
  transform: scale(0.98);
}

.task-done {
  opacity: 0.6;
}

.task-card-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.check-btn {
  flex-shrink: 0;
}

.task-card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-title {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  word-break: break-word;
  color: rgb(var(--v-theme-on-surface));
}

.done-title {
  text-decoration: line-through;
  opacity: 0.6;
}

.task-desc {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.7;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.drag-handle {
  flex-shrink: 0;
  cursor: grab;
  opacity: 0.2;
  transition: opacity 0.2s;
}

.task-card:hover .drag-handle {
  opacity: 0.8;
  color: var(--quadrant-color);
}

.task-meta {
  display: flex;
  align-items: center;
  margin-top: 12px;
  margin-left: 44px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 0;
  opacity: 1;
}
</style>
