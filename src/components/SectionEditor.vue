<template>
  <div class="module-card">
    <div class="module-header">
      <span class="chevron" :class="{ collapsed: section.collapsed }" @click="section.collapsed = !section.collapsed">⌄</span>

      <template v-if="editingTitle">
        <input
          class="title-input"
          v-model="section.title"
          @blur="editingTitle = false"
          @keydown.enter="editingTitle = false"
          ref="titleInputRef"
        />
      </template>
      <template v-else>
        <span class="module-title">{{ section.title }}</span>
        <span class="op-icon" title="编辑模块名" @click="editTitle">✎</span>
      </template>

      <div class="module-ops">
        <span class="op-icon" title="上移" @click="moveSection(index, -1)">↑</span>
        <span class="op-icon" title="下移" @click="moveSection(index, 1)">↓</span>
        <span class="op-icon" title="添加一条内容" @click="onAddLine">＋</span>
        <span class="op-icon" title="删除模块" @click="removeSection(index)">🗑</span>
        <ToggleSwitch v-model="section.enabled" />
      </div>
    </div>

    <div v-show="!section.collapsed && section.enabled" class="module-body">
      <!-- 副标题行：技能清单不需要时间/主体/其它，整行置灰禁用 -->
      <div class="subtitle-row" :class="{ 'subtitle-disabled': section.type === 'skills' }">
        <span class="sb-label">时间:</span>
        <input class="sb-input sb-date" v-model="section.subtitle.start" :disabled="section.type === 'skills'" placeholder="2022-01" />
        <span class="sb-sep">~</span>
        <input class="sb-input sb-date" v-model="section.subtitle.end" :disabled="section.type === 'skills' || section.subtitle.toNow" placeholder="2022-01" />
        <label class="sb-now">
          <input type="checkbox" v-model="section.subtitle.toNow" :disabled="section.type === 'skills'" />
          至今
        </label>

        <span class="sb-label">主体:</span>
        <input class="sb-input sb-flex" v-model="section.subtitle.subject" :disabled="section.type === 'skills'" placeholder="公司/组织名称" />

        <span class="sb-label">其它:</span>
        <input class="sb-input sb-flex" v-model="section.subtitle.other" :disabled="section.type === 'skills'" placeholder="职位/其它信息" />

        <!-- 设置齿轮 + 弹窗（技能清单不显示）-->
        <span class="gear-wrap" v-if="section.type !== 'skills'">
          <span class="gear" :class="{ active: settingsOpen }" title="副标题设置" @click.stop="settingsOpen = !settingsOpen">⚙</span>
          <SettingsPopup v-if="settingsOpen" :settings="section.settings" @close="settingsOpen = false" />
        </span>
      </div>

      <!-- 富文本内容 -->
      <RichTextEditor ref="rteRef" :lines="section.lines" />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { moveSection, removeSection } from '../store.js'
import ToggleSwitch from './ToggleSwitch.vue'
import SettingsPopup from './SettingsPopup.vue'
import RichTextEditor from './RichTextEditor.vue'

const props = defineProps({
  section: { type: Object, required: true },
  index: { type: Number, required: true }
})

const settingsOpen = ref(false)
const editingTitle = ref(false)
const titleInputRef = ref(null)
const rteRef = ref(null)

function editTitle() {
  editingTitle.value = true
  nextTick(() => titleInputRef.value && titleInputRef.value.focus())
}

function onAddLine() {
  // 若模块折叠/关闭，先展开，再让富文本组件在末尾追加一行
  // 注意：script setup 中必须通过 props 访问，直接写 section 会抛 ReferenceError
  props.section.collapsed = false
  props.section.enabled = true
  nextTick(() => rteRef.value && rteRef.value.addLineAtEnd())
}
</script>

<style scoped>
.module-card {
  background: #fff;
  border: 1px solid #e8eaee;
  border-radius: 6px;
  margin-bottom: 12px;
}
.module-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  gap: 8px;
}
.chevron {
  cursor: pointer;
  color: #999;
  font-size: 14px;
  transition: transform 0.2s;
  user-select: none;
}
.chevron.collapsed {
  transform: rotate(-90deg);
}
.module-title {
  font-weight: 600;
  font-size: 14px;
}
.title-input {
  height: 26px;
  border: 1px solid #4096ff;
  border-radius: 4px;
  padding: 0 6px;
  width: 120px;
}
.module-ops {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.op-icon {
  cursor: pointer;
  color: #999;
  font-size: 13px;
  user-select: none;
}
.op-icon:hover {
  color: #4096ff;
}
.module-body {
  padding: 4px 14px 14px;
  border-top: 1px solid #f2f3f5;
}

.subtitle-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 12px 0;
}
/* 技能清单：副标题三要素置灰禁用 */
.subtitle-row.subtitle-disabled {
  opacity: 0.45;
  user-select: none;
}
.subtitle-disabled .sb-input {
  background: #f5f6f8;
  cursor: not-allowed;
  color: #999;
}
.subtitle-disabled .sb-label,
.subtitle-disabled .sb-now,
.subtitle-disabled .sb-sep {
  color: #aaa;
}
.subtitle-disabled input:disabled {
  cursor: not-allowed;
}
.sb-label {
  color: #666;
  font-size: 13px;
  flex: none;
}
.sb-input {
  height: 30px;
  border: 1px solid #e0e3e8;
  border-radius: 4px;
  padding: 0 8px;
  background: #fff;
}
.sb-input:focus {
  border-color: #4096ff;
}
.sb-date {
  width: 96px;
}
.sb-flex {
  flex: 1;
  min-width: 110px;
}
.sb-sep {
  color: #999;
}
.sb-now {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 13px;
  flex: none;
}

.gear-wrap {
  position: relative;
  flex: none;
}
.gear {
  cursor: pointer;
  font-size: 16px;
  color: #8a8f99;
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.gear:hover,
.gear.active {
  color: #4096ff;
  background: #eef4ff;
}
</style>
