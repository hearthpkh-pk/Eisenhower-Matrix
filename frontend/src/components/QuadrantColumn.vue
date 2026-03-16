<template>
  <div
    class="quadrant-column"
    :style="{ '--quadrant-color': quadrant.color, '--quadrant-color-alpha': quadrant.color + '20' }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="handleDrop"
    :class="{ 'drag-over': isDragOver }"
  >
    <div class="quadrant-header">
      <div class="quadrant-header-content">
        <v-icon :icon="quadrant.icon" size="20" :style="{ color: quadrant.color }" />
        <div>
          <h3 class="quadrant-title">{{ quadrant.label }}</h3>
          <span class="quadrant-subtitle">{{ quadrant.subtitle }}</span>
        </div>
      </div>
      <v-chip size="x-small" variant="tonal" :style="{ color: quadrant.color }">
        {{ tasks.length }}
      </v-chip>
    </div>

    <!-- Quick Add -->
    <div class="quick-add" v-if="!quickAdding">
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-plus"
        class="quick-add-btn"
        @click="quickAdding = true"
      >
        Add a task
      </v-btn>
    </div>
    <div v-else class="quick-add-form">
      <v-text-field
        v-model="quickTitle"
        placeholder="Task title..."
        variant="outlined"
        density="compact"
        hide-details
        autofocus
        @keyup.enter="submitQuick"
        @keyup.escape="cancelQuick"
        class="quick-input"
      >
        <template #append-inner>
          <v-btn icon size="x-small" variant="text" @click="submitQuick" :disabled="!quickTitle.trim()">
            <v-icon size="18" color="success">mdi-check</v-icon>
          </v-btn>
          <v-btn icon size="x-small" variant="text" @click="cancelQuick">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-text-field>
    </div>

    <!-- Task List -->
    <div class="task-list">
      <TransitionGroup name="task-list">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :quadrant-color="quadrant.color"
          @edit="$emit('edit', task)"
          draggable="true"
          @dragstart="handleDragStart($event, task)"
        />
      </TransitionGroup>
      <div v-if="tasks.length === 0 && !quickAdding" class="empty-state">
        <v-icon icon="mdi-tray-alert" size="32" class="mb-2" style="opacity: 0.3" />
        <span class="text-caption" style="opacity: 0.4">No tasks yet</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Task, QuadrantInfo, CreateTaskDTO } from '../types';
import TaskCard from './TaskCard.vue';
import { useTaskStore } from '../store';

const props = defineProps<{
  quadrant: QuadrantInfo;
  tasks: Task[];
}>();

const emit = defineEmits<{
  (e: 'edit', task: Task): void;
  (e: 'quick-add', dto: CreateTaskDTO): void;
}>();

const store = useTaskStore();
const quickAdding = ref(false);
const quickTitle = ref('');
const isDragOver = ref(false);

function submitQuick() {
  const title = quickTitle.value.trim();
  if (!title) return;
  emit('quick-add', {
    title,
    priority: props.quadrant.priority,
    importance: props.quadrant.importance,
  });
  quickTitle.value = '';
  quickAdding.value = false;
}

function cancelQuick() {
  quickAdding.value = false;
  quickTitle.value = '';
}

function handleDragStart(event: DragEvent, task: Task) {
  event.dataTransfer?.setData('application/json', JSON.stringify(task));
  event.dataTransfer!.effectAllowed = 'move';
}

function onDragOver() {
  isDragOver.value = true;
}

function onDragLeave() {
  isDragOver.value = false;
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false;
  const data = event.dataTransfer?.getData('application/json');
  if (!data) return;
  try {
    const task = JSON.parse(data) as Task;
    if (task.priority === props.quadrant.priority && task.importance === props.quadrant.importance) return;
    store.moveTask(task.id, props.quadrant.priority, props.quadrant.importance);
  } catch { /* ignore parse errors */ }
}
</script>

<style scoped>
.quadrant-column {
  background: rgb(var(--v-theme-surface));
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quadrant-column:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  border-color: var(--quadrant-color);
}

.quadrant-column.drag-over {
  border-color: var(--quadrant-color);
  background: var(--quadrant-color-alpha);
  outline: 2px dashed var(--quadrant-color);
}

.quadrant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0 12px;
  border-bottom: 2px solid var(--quadrant-color-alpha);
}

.quadrant-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quadrant-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
  font-family: 'Inter', 'Prompt', sans-serif;
}

.quadrant-subtitle {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-add-btn {
  text-transform: none !important;
  font-weight: 700;
  color: var(--quadrant-color);
  background: var(--quadrant-color-alpha);
}

.quick-add-btn:hover {
  opacity: 1;
}

.quick-add-form {
  padding: 4px 0;
}

.quick-input {
  font-size: 13px;
}

.task-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 4px;
}

.task-list::-webkit-scrollbar {
  width: 4px;
}

.task-list::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.2);
  border-radius: 2px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
}

/* Transitions */
.task-list-enter-active {
  transition: all 0.3s ease-out;
}

.task-list-leave-active {
  transition: all 0.2s ease-in;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.task-list-move {
  transition: transform 0.3s ease;
}
</style>
