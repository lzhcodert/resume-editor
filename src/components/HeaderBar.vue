<template>
  <header class="app-header">
    <div class="logo">
      <span class="logo-icon">CV</span>
      <span class="logo-text">CV</span>
    </div>

    <ColorPicker v-model="store.themeColor" />

    <div class="header-actions">
      <button class="abtn" title="保存到本地" @click="onSave">
        <svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v6h8V4"/><path d="M8 20v-6h8v6"/></svg>保存
      </button>
      <button class="abtn" title="重置为默认数据" @click="onReset">
        <svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 6.7"/><path d="M20 5v6h-6"/></svg>重置
      </button>
      <button class="abtn" title="备份：把全部数据导出成 JSON 文件保存到电脑" @click="onBackup">
        <svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>备份
      </button>
      <button class="abtn" title="恢复：导入之前备份的 JSON 文件，找回数据" @click="onRestore">
        <svg viewBox="0 0 24 24"><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M5 3h14"/></svg>恢复
      </button>
      <button
        class="help-icon"
        :class="{ active: helpOpen }"
        title="为什么要备份 / 恢复？"
        @click="helpOpen = !helpOpen"
      >?</button>
      <button class="abtn abtn-primary" :style="{ background: store.themeColor }" title="导出 PDF" @click="onExport">
        <svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>导出 PDF
      </button>
      <input ref="fileInputRef" class="file-input" type="file" accept="application/json,.json" @change="onFileChange" />

      <div v-if="helpOpen" class="help-popover" @click.stop>
        <div class="help-title">为什么要「备份 / 恢复」？</div>
        <p>你的简历数据默认只保存在<strong>当前浏览器</strong>里。一旦清理浏览器缓存、更换电脑或换浏览器，之前填的内容就会丢失。</p>
        <p><strong>备份</strong>：把全部内容导出成一个 JSON 文件存到电脑，长期保存。</p>
        <p><strong>恢复</strong>：清了缓存或换设备后，导入这个备份文件，即可找回全部内容。</p>
        <div class="help-foot">提示：重要节点手动备份一次，数据就不怕丢了。</div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { store, saveResume, resetResume, exportBackup, importBackup } from '../store.js'
import { exportResumePdf } from '../utils/print.js'
import ColorPicker from './ColorPicker.vue'
const toast = ref('')
const fileInputRef = ref(null)
const helpOpen = ref(false)
let timer = null

// 点击页面其它地方时关闭说明气泡
function onDocClick(e) {
  if (helpOpen.value && !e.target.closest('.help-popover') && !e.target.closest('.help-icon')) {
    helpOpen.value = false
  }
}
if (typeof document !== 'undefined') document.addEventListener('click', onDocClick)

function showToast(msg, duration = 1600) {
  toast.value = msg
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), duration)
}

function onSave() {
  saveResume()
  showToast('已保存')
}

function onReset() {
  resetResume()
  showToast('已重置为默认数据')
}

function onBackup() {
  try {
    exportBackup()
  } catch (e) {
    showToast('备份失败：' + (e.message || '未知错误'), 2600)
  }
}

function onRestore() {
  // 先清空 value，保证连续选择同一个文件也能触发 change
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

async function onFileChange(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  try {
    await importBackup(file)
    showToast('恢复成功，已载入备份内容', 2200)
  } catch (err) {
    showToast('恢复失败：' + (err.message || '文件格式错误'), 3000)
  }
}

function onExport() {
  exportResumePdf()
}
</script>

<style scoped>
.app-header {
  position: relative;
  height: 52px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaee;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, #ff7a45, #e8642c);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: #2b2f36;
}
.header-actions {
  display: flex;
  gap: 10px;
  margin-left: 12px;
}
/* 简约操作按钮 */
.abtn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #e2e5ea;
  border-radius: 6px;
  background: #fff;
  color: #4a4f57;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.abtn svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.abtn:not(.abtn-primary):hover {
  border-color: #c8cdd4;
  background: #f7f8fa;
  color: #1f2d3d;
}
.abtn-primary {
  border-color: transparent;
  color: #fff;
}
.abtn-primary:hover {
  filter: brightness(1.08);
}
.file-input {
  display: none;
}
/* 用途说明 */
.help-icon {
  width: 18px;
  height: 18px;
  flex: none;
  padding: 0;
  border: 1px solid #c8cdd4;
  border-radius: 50%;
  background: #fff;
  color: #8a9099;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s;
}
.help-icon:hover,
.help-icon.active {
  border-color: #4096ff;
  color: #4096ff;
}
.help-popover {
  position: absolute;
  top: 46px;
  right: 130px;
  width: 320px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e2e5ea;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  color: #4a4f57;
  font-size: 12px;
  line-height: 1.7;
  z-index: 30;
}
.help-popover::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 146px;
  width: 10px;
  height: 10px;
  background: #fff;
  border-left: 1px solid #e2e5ea;
  border-top: 1px solid #e2e5ea;
  transform: rotate(45deg);
}
.help-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2d3d;
  margin-bottom: 8px;
}
.help-popover p {
  margin: 0 0 8px;
}
.help-popover strong {
  color: #1f2d3d;
}
.help-foot {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #e2e5ea;
  color: #8a9099;
}
.toast {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  padding: 8px 18px;
  border-radius: 4px;
  font-size: 13px;
}
</style>
