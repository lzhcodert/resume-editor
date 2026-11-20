<template>
  <div
    class="rte-line-wrap"
    :class="{ selecting: selectMode, 'wrap-selected': selectMode && selected }"
    @click="onWrapClick"
  >
    <!-- 多选模式：左侧复选框 -->
    <label v-if="selectMode" class="line-check">
      <input type="checkbox" :checked="selected" @change="$emit('toggle-select')" />
    </label>
    <div
      ref="lineRef"
      class="rte-line"
      :class="{ 'line-selected': selectMode && selected }"
      :contenteditable="!selectMode ? 'true' : 'false'"
      :data-line-id="lineId"
      @input="onInput"
      @keydown.enter.prevent="onEnter"
      @keydown.backspace="onBackspace"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  html: { type: String, default: '' },
  lineId: { type: [String, Number], required: true },
  selectMode: { type: Boolean, default: false },
  selected: { type: Boolean, default: false }
})
const emit = defineEmits(['input', 'enter', 'remove', 'merge', 'toggle-select'])
const lineRef = ref(null)

// 只在挂载时写入一次初始内容，之后完全由 DOM 驱动，避免输入时光标跳动
onMounted(() => {
  if (lineRef.value) lineRef.value.innerHTML = props.html || ''
})

function onInput(e) {
  emit('input', e.target.innerHTML)
}

// 多选模式下点击整行切换选中（点击复选框本身已由 @change 处理，避免重复触发）
function onWrapClick(e) {
  if (props.selectMode && e.target.tagName !== 'INPUT') emit('toggle-select')
}

// 回车：从光标处把当前行切成前后两段 HTML，交给父组件拆成两行
function onEnter() {
  const el = lineRef.value
  if (!el) return
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount || !el.contains(sel.anchorNode)) return
  const range = sel.getRangeAt(0)

  // 光标前段：内容开头 → 光标
  const beforeRange = document.createRange()
  beforeRange.selectNodeContents(el)
  beforeRange.setEnd(range.startContainer, range.startOffset)
  // 光标后段：光标 → 内容末尾
  const afterRange = document.createRange()
  afterRange.selectNodeContents(el)
  afterRange.setStart(range.endContainer, range.endOffset)

  emit('enter', { before: rangeToHtml(beforeRange), after: rangeToHtml(afterRange) })
}

// 把 Range 内容克隆成 HTML 字符串（保留加粗/斜体等标签）
function rangeToHtml(range) {
  const wrap = document.createElement('div')
  wrap.appendChild(range.cloneContents())
  return wrap.innerHTML
}

// 退格处理：
// - 空行：删除该行
// - 有内容且光标在行首：与上一行合并（内容不丢失）
// - 其它：普通删字符，不干预
function onBackspace(e) {
  const el = lineRef.value
  if (!el) return
  const sel = window.getSelection()
  const text = el.textContent || ''
  if (text.trim() === '') {
    e.preventDefault()
    emit('remove')
    return
  }
  if (sel && sel.isCollapsed && isCaretAtStart(el, sel.anchorNode, sel.anchorOffset)) {
    e.preventDefault()
    emit('merge')
  }
}

function isCaretAtStart(root, node, offset) {
  try {
    const range = document.createRange()
    range.selectNodeContents(root)
    range.setEnd(node, offset)
    return range.toString().length === 0
  } catch (err) {
    return false
  }
}
</script>

<style scoped>
.rte-line-wrap {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.rte-line-wrap + .rte-line-wrap {
  margin-top: 6px;
}
.line-check {
  flex: none;
  display: flex;
  align-items: center;
  height: 24px;
  cursor: pointer;
}
.line-check input {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: #4096ff;
}
.rte-line {
  flex: 1;
  min-height: 24px;
  line-height: 1.9;
  outline: none;
  font-size: 13px;
  word-break: break-all;
}
.rte-line:focus {
  background: #fafcff;
}
/* 多选模式下的行：整行可点、hover 高亮、选中高亮 */
.rte-line-wrap.selecting {
  cursor: pointer;
  border-radius: 4px;
  padding: 1px 4px;
  margin-left: -4px;
  margin-right: -4px;
}
.rte-line-wrap.selecting:hover {
  background: #f2f7ff;
}
.rte-line-wrap.selecting.wrap-selected {
  background: #e8f1ff;
}
.rte-line-wrap.selecting.wrap-selected .rte-line:focus {
  background: transparent;
}
</style>
