<template>
  <div class="preview-panel">
    <div class="resume-paper" :style="{ '--section-color': store.themeColor }">
      <!-- 个人信息 -->
      <section v-if="store.basicEnabled" class="p-section p-basic-sec">
        <h2 class="p-basic-title">个人信息</h2>
        <div class="p-basic-body">
          <div class="p-basic-grid">
            <div v-for="f in store.basicFields" :key="f.key" class="p-basic-item">
              <span class="p-basic-label">{{ f.label }}</span>
              <span class="p-basic-colon">:</span>
              <span class="p-basic-value">{{ f.value }}</span>
            </div>
            <!-- 自定义字段草稿：输入时实时预览 -->
            <div
              v-if="store.customDraft && (store.customDraft.key || store.customDraft.value)"
              class="p-basic-item p-basic-draft"
            >
              <span class="p-basic-label">{{ store.customDraft.key }}</span>
              <span class="p-basic-colon">:</span>
              <span class="p-basic-value">{{ store.customDraft.value }}</span>
            </div>
          </div>
          <img v-if="store.photo.show && store.photo.url" class="p-photo" :src="store.photo.url" alt="照片" />
        </div>
      </section>

      <!-- 模块 -->
      <template v-for="sec in enabledSections" :key="sec.id">
        <section class="p-section">
          <h2 class="p-sec-title">{{ sec.title }}</h2>

          <div class="p-sec-body">
            <div v-if="sec.type !== 'skills' && subItems(sec).length" class="p-subtitle" :style="{ gridTemplateColumns: `repeat(${subItems(sec).length}, 1fr)` }">
              <span v-for="item in subItems(sec)" :key="item.key" class="p-sub-item" :class="'align-' + item.key">{{ item.text }}</span>
            </div>

            <div class="p-lines">
              <p v-for="line in sec.lines" :key="line.id" class="p-line" v-html="line.html"></p>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../store.js'

const enabledSections = computed(() => store.sections.filter((s) => s.enabled))

// 副标题分段：按配置顺序，每段带标识用于对齐（时间左、主体中、其它右）
function subItems(section) {
  const s = section.subtitle
  const st = section.settings
  const map = {
    time: st.showTime && s.start ? `${s.start} ~ ${s.toNow ? '至今' : s.end}` : '',
    subject: st.showSubject ? s.subject : '',
    other: st.showOther ? s.other : ''
  }
  return st.order.split('-').map((k) => ({ key: k, text: map[k] })).filter((x) => x.text)
}
</script>

<style scoped>
.preview-panel {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 60px;
  background: #f0f2f5;
}
.resume-paper {
  width: 720px;
  min-height: 980px;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 40px 44px;
}

.p-basic-sec {
  padding-top: 0;
}
/* 模块标题：深青色文字 + 下方横线 */
.p-basic-title,
.p-sec-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--section-color);
  margin: 0 0 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--section-color);
}
.p-basic-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.p-basic-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}
.p-basic-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}
.p-basic-label {
  flex: none;
  width: 64px;
  text-align: justify;
  text-align-last: justify;
  color: #333;
}
.p-basic-colon {
  margin: 0 10px 0 6px;
  color: #333;
}
.p-basic-value {
  color: #333;
}
.p-photo {
  flex: none;
  width: 90px;
  height: 120px;
  object-fit: cover;
  border: 1px solid #eef0f3;
  border-radius: 2px;
}

.p-section {
  padding-top: 18px;
}

.p-sec-body {
  position: relative;
  /* 与标题左对齐，无缩进 */
}

.p-subtitle {
  display: grid;
  align-items: center;
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
}
/* 三段各占一等分：时间左、主体中、其它右，主体位置不受时间长度影响 */
.p-sub-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.align-time {
  text-align: left;
}
.align-subject {
  text-align: center;
  font-weight: 700;
  color: #333;
}
.align-other {
  text-align: right;
  font-weight: 700;
  color: #333;
}

.p-lines {
  font-size: 13px;
}
.p-line {
  margin: 0 0 8px;
  line-height: 1.9;
  min-height: 1.9em; /* 空行也占位，保证回车新增行在预览中同步可见 */
  word-break: break-all;
}
.p-line:last-child {
  margin-bottom: 0;
}
</style>
