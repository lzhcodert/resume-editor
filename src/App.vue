<template>
  <div class="app-root">
    <HeaderBar />

    <main class="app-main">
      <!-- 左侧编辑区 -->
      <div class="editor-panel">
        <div class="resume-name-row">
          <span class="rn-label" :style="{ color: store.themeColor }">简历名称:</span>
          <template v-if="editingName">
            <input
              class="rn-input"
              :style="{ color: store.themeColor }"
              v-model="store.resumeName"
              @blur="editingName = false"
              @keydown.enter="editingName = false"
              ref="nameInputRef"
            />
          </template>
          <template v-else>
            <span class="rn-text" :style="{ color: store.themeColor }">{{ store.resumeName }}</span>
            <span class="rn-edit" title="编辑简历名称" @click="editName">✎</span>
          </template>
        </div>

        <BasicInfoEditor />

        <SectionEditor
          v-for="(sec, i) in store.sections"
          :key="sec.id"
          :section="sec"
          :index="i"
        />

        <div class="add-module" @click="addSection">＋ 添加自定义模块</div>
      </div>

      <!-- 右侧预览区 -->
      <ResumePreview />
    </main>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { store } from './store.js'
import HeaderBar from './components/HeaderBar.vue'
import BasicInfoEditor from './components/BasicInfoEditor.vue'
import SectionEditor from './components/SectionEditor.vue'
import ResumePreview from './components/ResumePreview.vue'

const editingName = ref(false)
const nameInputRef = ref(null)

function editName() {
  editingName.value = true
  nextTick(() => nameInputRef.value && nameInputRef.value.focus())
}

function addSection() {
  store.sections.push({
    id: Date.now(),
    type: 'custom',
    title: '自定义模块',
    collapsed: false,
    enabled: true,
    subtitle: { start: '', end: '', toNow: false, subject: '', other: '' },
    settings: { showTime: true, showSubject: true, showOther: true, order: 'time-subject-other' },
    lines: [{ id: Date.now() + 1, html: '请填写内容' }]
  })
}
</script>

<style scoped>
.app-root {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.editor-panel {
  width: 52%;
  min-width: 480px;
  overflow-y: auto;
  padding: 16px;
  background: #f5f6f8;
  border-right: 1px solid #e8eaee;
}

.resume-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e8eaee;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 12px;
}
.rn-label {
  color: #666;
  font-size: 14px;
  font-weight: 700;
}
.rn-text {
  font-weight: 700;
  font-size: 14px;
}
.rn-input {
  height: 26px;
  border: 1px solid #4096ff;
  border-radius: 4px;
  padding: 0 6px;
  width: 200px;
  font-weight: 700;
  font-size: 14px;
}
.rn-edit {
  cursor: pointer;
  color: #999;
}
.rn-edit:hover {
  color: #4096ff;
}

.add-module {
  border: 1px dashed #c8cdd5;
  border-radius: 6px;
  text-align: center;
  padding: 12px;
  color: #8a8f99;
  cursor: pointer;
  background: #fff;
}
.add-module:hover {
  color: #4096ff;
  border-color: #4096ff;
}
</style>
