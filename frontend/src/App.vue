<template>
  <v-app>
    <v-app-bar elevation="1" color="primary" class="px-4">
      <template #prepend>
        <v-icon icon="mdi-view-grid-outline" color="secondary" size="28" />
      </template>
      <v-app-bar-title class="font-weight-bold text-h6" style="letter-spacing: 1px;">
        EISENHOWER MATRIX
      </v-app-bar-title>
      <template #append>
        <v-btn
          icon
          variant="text"
          @click="toggleTheme"
          class="mr-2"
        >
          <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          @click="store.showArchive = !store.showArchive"
          class="mr-2"
        >
          <v-icon>mdi-archive-outline</v-icon>
        </v-btn>
        <v-btn
          color="secondary"
          variant="flat"
          prepend-icon="mdi-plus"
          class="text-black font-weight-bold px-6"
          rounded="pill"
          @click="showCreate = true"
        >
          CREATE TASK
        </v-btn>
      </template>
    </v-app-bar>

    <v-main class="matrix-main">
      <!-- Axis Labels -->
      <div class="axis-labels">
        <div class="axis-top">
          <span class="axis-label urgent-label">URGENT</span>
          <span class="axis-label not-urgent-label">NOT URGENT</span>
        </div>
        <div class="axis-left">
          <span class="axis-label important-label">IMPORTANT</span>
          <span class="axis-label not-important-label">NOT IMPORTANT</span>
        </div>
      </div>

      <!-- Matrix Grid -->
      <div class="matrix-grid">
        <QuadrantColumn
          v-for="q in QUADRANTS"
          :key="q.key"
          :quadrant="q"
          :tasks="store.quadrantTasks[q.key]"
          @edit="openEdit"
          @quick-add="quickAdd"
        />
      </div>

      <!-- Completed Section -->
      <v-expand-transition>
        <div v-if="store.completedTasks.length > 0" class="completed-section">
          <v-divider class="mb-4" />
          <v-btn
            variant="tonal"
            color="primary"
            class="completed-toggle"
            @click="showCompleted = !showCompleted"
            :prepend-icon="showCompleted ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          >
            Completed Tasks ({{ store.completedTasks.length }})
          </v-btn>
          <v-expand-transition>
            <div v-if="showCompleted" class="completed-list">
              <TaskCard
                v-for="task in store.completedTasks"
                :key="task.id"
                :task="task"
                @edit="openEdit"
                completed
              />
            </div>
          </v-expand-transition>
        </div>
      </v-expand-transition>
    </v-main>

    <!-- Create / Edit Dialog -->
    <TaskDialog
      v-model="showCreate"
      :task="editingTask"
      @save="handleSave"
      @delete="handleDelete"
      @close="closeDialog"
    />

    <!-- Archive Drawer -->
    <v-navigation-drawer
      v-model="store.showArchive"
      location="right"
      temporary
      width="380"
    >
      <v-toolbar color="surface" flat>
        <v-toolbar-title class="text-body-1 font-weight-medium">
          <v-icon icon="mdi-archive-outline" class="mr-2" />
          Archived Tasks
        </v-toolbar-title>
        <v-btn icon @click="store.showArchive = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-list v-if="store.archivedTasks.length">
        <v-list-item
          v-for="task in store.archivedTasks"
          :key="task.id"
          :title="task.title"
          :subtitle="task.description"
          class="archive-item"
        >
          <template #prepend>
            <v-icon
              :icon="task.done ? 'mdi-check-circle' : 'mdi-clock-outline'"
              :color="task.done ? 'success' : 'warning'"
              size="20"
            />
          </template>
        </v-list-item>
      </v-list>
      <div v-else class="pa-6 text-center text-medium-emphasis">
        <v-icon icon="mdi-archive-off-outline" size="48" class="mb-2" />
        <div>No archived tasks</div>
      </div>
    </v-navigation-drawer>

    <!-- AI Suggestion FAB -->
    <AiSuggestDialog />

    <!-- Snackbar for errors -->
    <v-snackbar
      v-model="showError"
      color="error"
      timeout="4000"
      location="bottom right"
    >
      {{ store.error }}
      <template #actions>
        <v-btn variant="text" @click="showError = false">Close</v-btn>
      </template>
    </v-snackbar>

    <!-- Loading overlay -->
    <v-overlay v-model="store.loading" class="align-center justify-center" persistent>
      <v-progress-circular indeterminate color="primary" size="64" />
    </v-overlay>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useTheme } from 'vuetify';
import { useTaskStore } from './store';
import { QUADRANTS } from './types';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from './types';
import QuadrantColumn from './components/QuadrantColumn.vue';
import TaskCard from './components/TaskCard.vue';
import TaskDialog from './components/TaskDialog.vue';
import AiSuggestDialog from './components/AiSuggestDialog.vue';

const store = useTaskStore();
const theme = useTheme();

const showCreate = ref(false);
const showCompleted = ref(false);
const showError = ref(false);
const editingTask = ref<Task | null>(null);

const isDark = ref(theme.global.current.value.dark);

function toggleTheme() {
  theme.global.name.value = isDark.value ? 'light' : 'dark';
  isDark.value = !isDark.value;
}

watch(
  () => store.error,
  (err) => {
    if (err) showError.value = true;
  }
);

onMounted(async () => {
  await store.fetchTasks();
  await store.fetchArchived();
});

function openEdit(task: Task) {
  editingTask.value = { ...task };
  showCreate.value = true;
}

function closeDialog() {
  editingTask.value = null;
  showCreate.value = false;
}

async function quickAdd(data: CreateTaskDTO) {
  await store.createTask(data);
}

async function handleSave(data: CreateTaskDTO & { id?: string }) {
  if (data.id) {
    const { id, ...dto } = data;
    await store.updateTask(id, dto as UpdateTaskDTO);
  } else {
    await store.createTask(data);
  }
  closeDialog();
}

async function handleDelete(id: string) {
  await store.deleteTask(id);
  closeDialog();
}
</script>

<style>
/* Global Reset */
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

#app {
  height: 100%;
}

.v-application {
  font-family: 'Inter', 'Prompt', sans-serif !important;
}

.matrix-main {
  position: relative;
  overflow-y: auto;
  background-color: #f0f4f7;
}

/* Axis Labels */
.axis-labels {
  position: relative;
  pointer-events: none;
  margin-top: 16px;
}

.axis-top {
  display: flex;
  justify-content: center;
  gap: 0;
  padding: 8px 0 8px 48px;
}

.axis-top .axis-label {
  flex: 1;
  text-align: center;
  max-width: calc(50% - 24px);
}

.axis-left {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 60px;
  z-index: 5;
  padding-left: 8px;
}

.axis-label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #0b3d91;
  opacity: 0.6;
}

.important-label,
.not-important-label {
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  padding: 8px 4px;
}

/* Matrix Grid */
.matrix-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 24px;
  padding: 8px 40px 40px 64px;
  min-height: calc(100vh - 120px);
}

/* Completed Section */
.completed-section {
  padding: 24px 64px 48px;
  max-width: 1200px;
  margin: 0 auto;
}

.completed-toggle {
  text-transform: none !important;
  font-weight: 700;
  border-radius: 12px !important;
}

.completed-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  padding: 24px 0;
}

.archive-item {
  border-radius: 8px;
}

/* Scrollbar styling */
.matrix-main::-webkit-scrollbar {
  width: 8px;
}

.matrix-main::-webkit-scrollbar-track {
  background: transparent;
}

.matrix-main::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 4px;
}

.matrix-main::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.5);
}
</style>
