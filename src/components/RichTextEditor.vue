<template>
  <div class="rte" ref="rootRef">
    <!-- 工具栏 -->
    <div class="rte-toolbar">
      <select class="tb-select" @change="exec('formatBlock', $event.target.value)">
        <option value="p">正文</option>
        <option value="h3">小标题</option>
      </select>
      <button class="tb-btn" title="加粗" @mousedown.prevent="exec('bold')"><b>B</b></button>
      <button class="tb-btn" title="下划线" @mousedown.prevent="exec('underline')"><u>U</u></button>
      <button class="tb-btn" title="斜体" @mousedown.prevent="exec('italic')"><i>I</i></button>
      <label class="tb-btn" title="字体颜色">
        A<input type="color" class="color-input" @input="exec('foreColor', $event.target.value)" />
      </label>
      <select class="tb-select" @change="exec('fontSize', $event.target.value)">
        <option value="" disabled selected>默认字号</option>
        <option value="2">小</option>
        <option value="3">正常</option>
        <option value="4">大</option>
        <option value="5">特大</option>
      </select>
      <select class="tb-select" @change="exec('fontName', $event.target.value)">
        <option value="" disabled selected>默认字体</option>
        <option value="Microsoft YaHei">微软雅黑</option>
        <option value="SimSun">宋体</option>
        <option value="SimHei">黑体</option>
        <option value="KaiTi">楷体</option>
      </select>
      <select class="tb-select" title="行高（MVP 暂不生效）">
        <option>默认行高</option>
        <option>1.5</option>
        <option>2.0</option>
      </select>
      <button class="tb-btn" title="左对齐" @mousedown.prevent="exec('justifyLeft')">≡</button>
      <button class="tb-btn" title="居中" @mousedown.prevent="exec('justifyCenter')">≣</button>
      <button class="tb-btn" title="右对齐" @mousedown.prevent="exec('justifyRight')">≡</button>
      <button class="tb-btn" title="无序列表" @mousedown.prevent="exec('insertUnorderedList')">•≡</button>
      <button class="tb-btn" title="清除格式" @mousedown.prevent="exec('removeFormat')">⌫</button>
      <span class="tb-gap"></span>
      <button
        class="tb-btn tb-multi"
        :class="{ active: selectMode }"
        :title="selectMode ? '退出多选' : '多选行：勾选后可批量删除'"
        @click="toggleSelectMode"
      >
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 5-6"/></svg>
        {{ selectMode ? '退出多选' : '多选' }}
      </button>
      <template v-if="selectMode">
        <button class="tb-btn" title="全选/取消全选" @click="toggleSelectAll">
          {{ allSelected ? '取消全选' : '全选' }}
        </button>
        <button class="tb-btn tb-delete" :disabled="selectedIds.length === 0" title="删除选中的行" @click="deleteSelected">
          🗑 删除选中{{ selectedIds.length ? `(${selectedIds.length})` : '' }}
        </button>
      </template>
      <!-- 鼠标跨行框选后的操作入口（也可直接按 Delete / Ctrl+C） -->
      <template v-if="crossSel">
        <button class="tb-btn tb-delete" title="删除鼠标框选的跨行内容（也可按 Delete 键）" @mousedown.prevent @click="deleteCrossSelection">
          删除框选({{ crossCount }})
        </button>
        <span class="tb-tip">已框选 {{ crossCount }} 行 · Delete 删除 / Ctrl+C 复制</span>
      </template>
    </div>

    <!-- 内容行：每行仍是独立 contenteditable，编辑手感与数据同步完全不变 -->
    <div
      class="rte-lines"
      :class="{ 'cross-dragging': dragging }"
      @mousedown="onMouseDown"
      @keydown.capture="onKeydown"
      @copy="onCopy"
    >
      <RichLine
        v-for="(line, i) in lines"
        :key="line.id"
        :html="line.html"
        :line-id="line.id"
        :select-mode="selectMode"
        :selected="selectedIds.includes(line.id)"
        @input="line.html = $event"
        @enter="insertLine(i, $event)"
        @remove="removeLine(i)"
        @merge="mergeLine(i)"
        @toggle-select="toggleSelect(line.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import RichLine from './RichLine.vue'
import {
  clearCrossHighlight,
  applyCrossHighlight,
  takeOverCrossSelection,
  releaseCrossSelection
} from '../utils/crossSelect.js'

const props = defineProps({
  lines: { type: Array, required: true }
})
const rootRef = ref(null)

// ===== 多选模式：勾选行 → 批量删除 =====
const selectMode = ref(false)
// 勾选行的 id 数组，每次重新赋值保证响应式可靠
const selectedIds = ref([])
const allSelected = computed(() => props.lines.length > 0 && props.lines.every((l) => selectedIds.value.includes(l.id)))

function toggleSelectMode() {
  selectMode.value = !selectMode.value
  if (!selectMode.value) selectedIds.value = [] // 退出时清空勾选
}

function toggleSelect(id) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((x) => x !== id)
    : [...selectedIds.value, id]
}

function toggleSelectAll() {
  selectedIds.value = allSelected.value ? [] : props.lines.map((l) => l.id)
}

function deleteSelected() {
  if (selectedIds.value.length === 0) return
  // 收集被勾选行的索引
  let indices = props.lines.map((l, i) => (selectedIds.value.includes(l.id) ? i : -1)).filter((i) => i >= 0)
  // 至少保留一行：若勾选了全部行，则保留最后一个被勾选的行
  if (indices.length >= props.lines.length) indices = indices.slice(0, -1)
  // 从后往前 splice，避免索引错位
  for (let k = indices.length - 1; k >= 0; k--) props.lines.splice(indices[k], 1)
  selectedIds.value = []
}

function exec(cmd, arg = null) {
  document.execCommand(cmd, false, arg)
}

// 生成唯一行 id
function newId() {
  return 'line_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
}

// ============================================================
// 鼠标跨行框选（方案 A）
// 每行仍是独立 contenteditable，浏览器原生 selection 无法跨宿主，
// 所以自己按鼠标坐标计算跨行范围，用 CSS Highlight 画高亮，不改动 DOM 与逐行同步。
// ============================================================
const dragging = ref(false)
const crossSel = ref(null)
const crossCount = computed(() => (crossSel.value ? crossSel.value.endLine - crossSel.value.startLine + 1 : 0))

let dragStart = null
let dragActive = false

function lineEls() {
  return rootRef.value ? Array.from(rootRef.value.querySelectorAll('.rte-line')) : []
}

// 鼠标坐标 → 所在行 + 行内字符偏移
function pointToPos(x, y) {
  let range = null
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y)
  } else if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(x, y)
    if (p) {
      range = document.createRange()
      range.setStart(p.offsetNode, p.offset)
      range.collapse(true)
    }
  }
  if (!range) return null
  const n = range.startContainer
  const el = n && n.nodeType === 1 ? n : n && n.parentElement
  const lineEl = el && el.closest ? el.closest('.rte-line') : null
  if (!lineEl || !rootRef.value || !rootRef.value.contains(lineEl)) return null
  const idx = lineEls().indexOf(lineEl)
  if (idx < 0) return null
  return { lineIndex: idx, offset: textOffsetInLine(lineEl, range.startContainer, range.startOffset) }
}

// 行内某个 DOM 位置之前的字符数
function textOffsetInLine(lineEl, node, nodeOffset) {
  const r = document.createRange()
  r.selectNodeContents(lineEl)
  try {
    r.setEnd(node, nodeOffset)
    return r.toString().length
  } catch (e) {
    return 0
  }
}

// 行内第 offset 个字符处的折叠 Range
function caretAtOffset(lineEl, offset) {
  const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT)
  let node
  let remaining = offset
  let targetNode = null
  let targetOffset = 0
  while ((node = walker.nextNode())) {
    const len = (node.textContent || '').length
    if (remaining <= len) {
      targetNode = node
      targetOffset = remaining
      break
    }
    remaining -= len
  }
  const r = document.createRange()
  if (targetNode) {
    r.setStart(targetNode, targetOffset)
    r.collapse(true)
  } else {
    r.selectNodeContents(lineEl)
    r.collapse(false)
  }
  return r
}

// 归一化选区：保证 startLine <= endLine，且同一行时 startOffset <= endOffset
function normalizeSel(a, b) {
  if (a.lineIndex < b.lineIndex || (a.lineIndex === b.lineIndex && a.offset <= b.offset)) {
    return { startLine: a.lineIndex, startOffset: a.offset, endLine: b.lineIndex, endOffset: b.offset }
  }
  return { startLine: b.lineIndex, startOffset: b.offset, endLine: a.lineIndex, endOffset: a.offset }
}

// 按选区构造每一行需要高亮的 Range，以及取文本/取 HTML 用的片段范围
function eachLineRange(sel, cb) {
  const els = lineEls()
  for (let i = sel.startLine; i <= sel.endLine; i++) {
    const el = els[i]
    if (!el) continue
    const full = document.createRange()
    full.selectNodeContents(el)
    const r = document.createRange()
    if (i === sel.startLine && i === sel.endLine) {
      const a = caretAtOffset(el, sel.startOffset)
      const b = caretAtOffset(el, sel.endOffset)
      r.setStart(a.startContainer, a.startOffset)
      r.setEnd(b.startContainer, b.startOffset)
    } else if (i === sel.startLine) {
      const a = caretAtOffset(el, sel.startOffset)
      r.setStart(a.startContainer, a.startOffset)
      r.setEnd(full.endContainer, full.endOffset)
    } else if (i === sel.endLine) {
      const b = caretAtOffset(el, sel.endOffset)
      r.setStart(full.startContainer, full.startOffset)
      r.setEnd(b.startContainer, b.startOffset)
    } else {
      r.selectNodeContents(el)
    }
    cb(r, el, i)
  }
}

function highlightSel(sel) {
  const ranges = []
  const els = []
  eachLineRange(sel, (r, el) => {
    if (!r.collapsed) {
      ranges.push(r)
      els.push(el)
    }
  })
  applyCrossHighlight(ranges, els)
}

function selectedText(sel) {
  const parts = []
  eachLineRange(sel, (r) => parts.push(r.toString()))
  return parts.join('\n')
}

// 取行内 [from, to) 区间的 HTML（to 为 null 表示到行末），保留富文本标签
function htmlSlice(lineEl, from, to) {
  if (!lineEl) return ''
  const full = document.createRange()
  full.selectNodeContents(lineEl)
  const a = caretAtOffset(lineEl, from)
  const b = to == null ? null : caretAtOffset(lineEl, to)
  const r = document.createRange()
  try {
    r.setStart(a.startContainer, a.startOffset)
    if (b) r.setEnd(b.startContainer, b.startOffset)
    else r.setEnd(full.endContainer, full.endOffset)
    const wrap = document.createElement('div')
    wrap.appendChild(r.cloneContents())
    return wrap.innerHTML
  } catch (e) {
    return ''
  }
}

function clearCrossSelection() {
  crossSel.value = null
  dragging.value = false
  clearCrossHighlight()
  releaseCrossSelection(clearCrossSelection)
}

function onMouseDown(e) {
  if (selectMode.value || e.button !== 0) return
  clearCrossSelection()
  takeOverCrossSelection(clearCrossSelection)
  const pos = pointToPos(e.clientX, e.clientY)
  if (!pos) return
  dragStart = pos
  dragActive = false
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  if (!dragStart) return
  const pos = pointToPos(e.clientX, e.clientY)
  if (!pos) return
  // 同一行内的选择完全交给浏览器原生（保留单击定位、行内拖选、双击选词）
  if (pos.lineIndex === dragStart.lineIndex) return
  if (!dragActive) {
    dragActive = true
    dragging.value = true
  }
  e.preventDefault()
  const sel = normalizeSel(dragStart, pos)
  crossSel.value = sel
  // 清掉浏览器被钳制在起始行内的原生选区，避免与自定义高亮叠加
  const bs = window.getSelection()
  if (bs && !bs.isCollapsed) bs.removeAllRanges()
  highlightSel(sel)
}

function onMouseUp(e) {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  if (dragActive) {
    e.preventDefault()
    const bs = window.getSelection()
    if (bs && !bs.isCollapsed) bs.removeAllRanges()
    const s = crossSel.value
    if (s && s.startLine === s.endLine && s.startOffset === s.endOffset) clearCrossSelection()
    dragging.value = false
    const el = lineEls()[dragStart ? dragStart.lineIndex : -1]
    if (el) el.focus()
  }
  dragStart = null
  dragActive = false
}

// 删除框选内容：首行保留前段、末行保留后段、中间行整行删除
function deleteCrossSelection() {
  const s = crossSel.value
  if (!s) return
  const els = lineEls()
  const startEl = els[s.startLine]
  const endEl = els[s.endLine]
  const lines = props.lines
  const first = lines[s.startLine]
  const last = lines[s.endLine]
  if (!startEl || !endEl || !first || !last) {
    clearCrossSelection()
    return
  }
  const before = htmlSlice(startEl, 0, s.startOffset)
  const after = htmlSlice(endEl, s.endOffset, null)
  if (s.startLine === s.endLine) {
    first.html = before + after
    first.id = newId()
  } else {
    first.html = before
    first.id = newId()
    last.html = after
    last.id = newId()
    for (let i = s.endLine - 1; i > s.startLine; i--) lines.splice(i, 1)
  }
  const focusId = first.id
  clearCrossSelection()
  focusLineAtEnd(focusId)
}

function onCopy(e) {
  const s = crossSel.value
  if (!s) return
  const text = selectedText(s)
  if (e.clipboardData) {
    e.clipboardData.setData('text/plain', text)
    e.preventDefault()
  }
}

// 捕获阶段处理：有跨行选区时 Delete/Backspace 删除框选内容（并挡住 RichLine 的退格逻辑）
function onKeydown(e) {
  if (crossSel.value && (e.key === 'Delete' || e.key === 'Backspace')) {
    e.preventDefault()
    e.stopPropagation()
    deleteCrossSelection()
    return
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') onArrowVertical(e)
}

// 上下箭头：独立 contenteditable 下浏览器会把光标甩到行首/行尾。
// 判断光标是否已在当前行的第一/最后一个视觉行，是则手动跨到相邻行并保持水平位置。
function onArrowVertical(e) {
  if (crossSel.value) {
    clearCrossSelection()
    return
  }
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount || !sel.isCollapsed) return
  const anchor = sel.anchorNode
  const anchorEl = anchor && anchor.nodeType === 3 ? anchor.parentElement : anchor
  const lineEl = anchorEl && anchorEl.closest ? anchorEl.closest('.rte-line') : null
  if (!lineEl || !rootRef.value || !rootRef.value.contains(lineEl)) return
  const els = lineEls()
  const idx = els.indexOf(lineEl)
  if (idx < 0) return
  const dir = e.key === 'ArrowUp' ? -1 : 1

  const r = sel.getRangeAt(0)
  let rect = r.getClientRects()[0] || r.getBoundingClientRect()
  const lineH = parseFloat(window.getComputedStyle(lineEl).lineHeight) || 24
  const lr = lineEl.getBoundingClientRect()
  if (!rect || !rect.height) rect = { left: lr.left, top: lr.top, height: lineH }
  const caretY = rect.top + rect.height / 2
  const rowIndex = Math.max(0, Math.round((caretY - lr.top - lineH / 2) / lineH))
  const rowCount = Math.max(1, Math.round(lr.height / lineH))
  // 行内还有上/下一视觉行，交给浏览器原生处理
  if (dir === -1 && rowIndex > 0) return
  if (dir === 1 && rowIndex < rowCount - 1) return

  e.preventDefault()
  const targetEl = els[idx + dir]
  if (!targetEl) return // 已到首行/末行，保持原位，不再被甩到行首/行尾
  const tlr = targetEl.getBoundingClientRect()
  const tLineH = parseFloat(window.getComputedStyle(targetEl).lineHeight) || 24
  const tRowCount = Math.max(1, Math.round(tlr.height / tLineH))
  const tRow = dir === 1 ? 0 : tRowCount - 1
  const x = rect.left
  const y = tlr.top + (tRow + 0.5) * tLineH
  targetEl.focus()
  const out = window.getSelection()
  out.removeAllRanges()
  let cr = null
  try {
    cr = document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null
  } catch (err) {
    cr = null
  }
  if (cr && targetEl.contains(cr.startContainer)) {
    out.addRange(cr)
  } else {
    const rr = document.createRange()
    rr.selectNodeContents(targetEl)
    rr.collapse(dir === 1) // 向下到行首，向上到行尾
    out.addRange(rr)
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  clearCrossHighlight()
  releaseCrossSelection(clearCrossSelection)
})

// ===== 原有的逐行编辑逻辑（不变） =====

// 回车切行：当前行保留光标前段，新行放光标后段，光标定位到新行开头
function insertLine(i, parts) {
  const cur = props.lines[i]
  if (!cur) return
  if (!parts) {
    // 兜底：无切分信息时，在当前行后插入空行
    const id = newId()
    props.lines.splice(i + 1, 0, { id, html: '' })
    focusLine(id)
    return
  }
  const before = parts.before || ''
  const after = parts.after || ''
  // 当前行只保留光标前段；RichLine 只在挂载时写 HTML，换 id 强制重渲染
  cur.html = before
  cur.id = newId()
  const newLineId = newId()
  props.lines.splice(i + 1, 0, { id: newLineId, html: after })
  focusAtTextOffset(newLineId, 0)
}

// 模块头部 ＋ 按钮调用：末尾追加一行并聚焦
function addLineAtEnd() {
  const id = newId()
  props.lines.push({ id, html: '' })
  focusLine(id)
}

function focusLine(id) {
  nextTick(() => {
    const el = rootRef.value && rootRef.value.querySelector(`.rte-line[data-line-id="${id}"]`)
    if (el) el.focus()
  })
}

// 删除某行后，自动聚焦到上一行末尾，方便接着编辑
function removeLine(i) {
  if (props.lines.length <= 1) return // 至少保留一行
  props.lines.splice(i, 1)
  const targetIdx = Math.max(0, i - 1)
  const target = props.lines[targetIdx]
  if (target) focusLineAtEnd(target.id)
}

// 聚焦到指定行并把光标置于末尾
function focusLineAtEnd(id) {
  nextTick(() => {
    const el = rootRef.value && rootRef.value.querySelector(`.rte-line[data-line-id="${id}"]`)
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  })
}

// 光标在行首退格：把本行内容并入上一行末尾，删掉本行（内容不丢失）
function mergeLine(i) {
  if (i <= 0 || props.lines.length <= 1) return // 第一行无可合并对象
  const prev = props.lines[i - 1]
  const cur = props.lines[i]
  // 合并前记录上一行的文本长度，用于把光标定位到拼接点
  const prevEl = rootRef.value && rootRef.value.querySelector(`.rte-line[data-line-id="${prev.id}"]`)
  const offset = prevEl ? (prevEl.textContent || '').length : 0
  prev.html = (prev.html || '') + (cur.html || '')
  props.lines.splice(i, 1)
  // RichLine 只在挂载时写入 HTML，换 id 强制上一行重新渲染出合并后的内容
  const mergedId = newId()
  prev.id = mergedId
  focusAtTextOffset(mergedId, offset)
}

// 聚焦到指定行，并把光标放到第 offset 个字符处（按文本节点遍历）
function focusAtTextOffset(id, offset) {
  nextTick(() => {
    const el = rootRef.value && rootRef.value.querySelector(`.rte-line[data-line-id="${id}"]`)
    if (!el) return
    el.focus()
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node
    let remaining = offset
    let targetNode = null
    let targetOffset = 0
    while ((node = walker.nextNode())) {
      const len = (node.textContent || '').length
      if (remaining <= len) {
        targetNode = node
        targetOffset = remaining
        break
      }
      remaining -= len
    }
    const range = document.createRange()
    if (targetNode) {
      range.setStart(targetNode, targetOffset)
      range.collapse(true)
    } else {
      range.selectNodeContents(el)
      range.collapse(false)
    }
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  })
}

defineExpose({ addLineAtEnd })
</script>

<style scoped>
.rte {
  border: 1px solid #eef0f3;
  border-radius: 4px;
  overflow: hidden;
}
.rte-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 8px;
  background: #fafbfc;
  border-bottom: 1px solid #eef0f3;
}
.tb-btn {
  min-width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 3px;
  font-size: 13px;
  color: #555;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}
.tb-btn:hover {
  background: #eceff3;
}
.color-input {
  width: 14px;
  height: 14px;
  padding: 0;
  border: none;
  background: none;
  vertical-align: middle;
  margin-left: 2px;
  cursor: pointer;
}
.tb-select {
  height: 26px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 3px;
  color: #555;
  padding: 0 2px;
}
.tb-select:hover {
  background: #eceff3;
}
.tb-gap {
  width: 1px;
  height: 18px;
  background: #dfe3e8;
  margin: 0 4px;
}
.tb-tip {
  font-size: 12px;
  color: #8a919c;
  margin-left: 4px;
}
.tb-multi {
  gap: 4px;
}
.tb-multi svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.tb-multi.active {
  color: #4096ff;
  background: #e8f1ff;
}
.tb-delete {
  color: #e02020;
}
.tb-delete:hover:not(:disabled) {
  background: #fdf0f0;
}
.tb-delete:disabled {
  color: #c8cdd4;
  cursor: not-allowed;
}
.rte-lines {
  padding: 10px 14px;
}
</style>

<!-- 全局样式：CSS Highlight API 绘制跨行高亮，不改动 DOM -->
<style>
::highlight(rte-cross-select) {
  background: #b4d5fe;
}
/* 跨行拖拽期间隐藏浏览器被钳制在起始行内的原生选区，避免蓝色叠加 */
.rte-lines.cross-dragging ::selection {
  background: transparent;
}
/* 老浏览器降级：整行高亮 */
.rte-line.rte-line-cross-sel {
  background: #b4d5fe;
  border-radius: 2px;
}
</style>
