<template>
  <div class="module-card">
    <div class="module-header">
      <span class="chevron" :class="{ collapsed }" @click="collapsed = !collapsed">⌄</span>
      <span class="module-title">个人信息</span>
      <span class="op-icon" title="编辑模块名">✎</span>
      <div class="module-ops">
        <ToggleSwitch v-model="store.basicEnabled" />
      </div>
    </div>

    <div v-show="!collapsed && store.basicEnabled" class="module-body">
      <div class="basic-layout">
        <!-- 字段区 -->
        <div class="field-area">
          <div class="field-grid">
            <div v-for="(f, i) in store.basicFields" :key="f.key" class="field-item">
              <span class="field-label">{{ f.label }}</span>
              <select v-if="f.type === 'select'" v-model="f.value" class="field-input">
                <option value="" disabled>请选择</option>
                <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
              </select>
              <input v-else v-model="f.value" class="field-input" />
              <span class="del-icon" title="删除该字段" @click="store.basicFields.splice(i, 1)">🗑</span>
            </div>

            <!-- 自定义字段：key 对齐标签框宽、value 对齐值输入框宽、＋ 对齐删除图标位 -->
            <div class="custom-cell">
              <input class="field-input key-input" v-model="store.customDraft.key" placeholder="自定义k..." />
              <input class="field-input value-input" v-model="store.customDraft.value" placeholder="自定义value" />
              <button class="add-field-btn" title="添加自定义字段" @click="addCustomField">＋</button>
            </div>
          </div>
        </div>

        <!-- 照片上传 -->
        <div class="photo-area">
          <div class="photo-box" :class="{ filled: store.photo.url }" @click="fileRef.click()">
            <img v-if="store.photo.url" :src="store.photo.url" alt="照片" />
            <div v-else class="photo-placeholder">
              <span class="plus">＋</span>
              <span>上传照片</span>
            </div>
            <span class="photo-switch" title="是否在简历中展示照片" @click.stop>
              <ToggleSwitch v-model="store.photo.show" />
            </span>
          </div>
          <input ref="fileRef" type="file" accept="image/*" hidden @change="onFileChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { store } from '../store.js'
import ToggleSwitch from './ToggleSwitch.vue'

const collapsed = ref(false)
const fileRef = ref(null)

function addCustomField() {
  const label = store.customDraft.key.trim()
  if (!label) return
  store.basicFields.push({
    key: 'custom_' + Date.now(),
    label,
    value: store.customDraft.value.trim(),
    type: 'text'
  })
  store.customDraft.key = ''
  store.customDraft.value = ''
}

function onFileChange(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    store.photo.url = reader.result
    store.photo.show = true
  }
  reader.readAsDataURL(file)
  e.target.value = ''
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
}
.module-body {
  padding: 4px 14px 14px;
  border-top: 1px solid #f2f3f5;
}

.basic-layout {
  display: flex;
  gap: 20px;
  padding-top: 12px;
}
.field-area {
  flex: 1;
  min-width: 0;
}

/* 两列网格，列宽一致 */
.field-grid {
  --label-w: 76px;
  --del-w: 28px;
  --col-gap: 28px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px var(--col-gap);
}

/* 标签框 + 输入框连体样式 */
.field-item {
  display: flex;
  align-items: center;
}
.field-label {
  flex: none;
  width: 76px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e3e8;
  border-right: none;
  border-radius: 4px 0 0 4px;
  background: #fafbfc;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
}
.field-input {
  flex: 1;
  min-width: 0;
  height: 32px;
  border: 1px solid #e0e3e8;
  border-radius: 0 4px 4px 0;
  padding: 0 8px;
  background: #fff;
}
.field-input:focus {
  border-color: #4096ff;
  position: relative;
  z-index: 1;
}
.field-input.standalone {
  border-radius: 4px;
}
select.field-input {
  appearance: auto;
}

.del-icon {
  flex: none;
  width: 28px;
  text-align: center;
  cursor: pointer;
  color: #bbb;
  font-size: 12px;
}
.del-icon:hover {
  color: #e02020;
}

/* 自定义字段：key 宽=标签框(76)，value 宽=值输入框，＋ 宽=删除图标位(28)，三者一行 */
.custom-cell {
  display: flex;
  align-items: center;
  gap: 0;
}
.custom-cell .key-input {
  flex: none;
  width: var(--label-w);
  border-radius: 4px 0 0 4px;
  padding: 0 6px;
}
.custom-cell .value-input {
  flex: 1;
  min-width: 0;
  border-radius: 0;
}
.add-field-btn {
  flex: none;
  width: var(--del-w);
  height: 32px;
  border: 1px solid #e0e3e8;
  border-left: none;
  border-radius: 0 4px 4px 0;
  background: #fff;
  color: #666;
  font-size: 16px;
  line-height: 1;
}
.add-field-btn:hover {
  color: #4096ff;
  border-color: #4096ff;
}

.photo-area {
  flex: none;
  display: flex;
  align-items: center;
}
.photo-box {
  position: relative;
  width: 96px;
  height: 128px;
  border: 1px dashed #c8cdd5;
  border-radius: 4px;
  cursor: pointer;
  overflow: visible;
  background: #fafbfc;
}
.photo-box:hover {
  border-color: #4096ff;
}
.photo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 3px;
}
.photo-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #9aa0aa;
  font-size: 12px;
}
.photo-placeholder .plus {
  font-size: 22px;
}
.photo-switch {
  position: absolute;
  right: -10px;
  bottom: -10px;
  background: #fff;
  border-radius: 12px;
  padding: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}
</style>
