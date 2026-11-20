// 跨行框选的模块级单例：同一时刻只允许一个编辑器持有跨行选区。
// 用 CSS Highlight API 绘制高亮（不修改 DOM），因此不会破坏逐行 contenteditable 的数据同步。

const HL_NAME = 'rte-cross-select'
const FALLBACK_CLASS = 'rte-line-cross-sel'

let activeHighlight = null
let fallbackEls = []
let activeClear = null

export function clearCrossHighlight() {
  if (activeHighlight) {
    try {
      if (typeof CSS !== 'undefined' && CSS.highlights) CSS.highlights.delete(HL_NAME)
    } catch (e) {
      /* 忽略 */
    }
    activeHighlight = null
  }
  fallbackEls.forEach((el) => el.classList.remove(FALLBACK_CLASS))
  fallbackEls = []
}

// ranges: 需要高亮的 Range 数组；els: 降级时整行高亮用的元素数组
export function applyCrossHighlight(ranges, els) {
  clearCrossHighlight()
  if (typeof Highlight !== 'undefined' && typeof CSS !== 'undefined' && CSS.highlights) {
    const hl = new Highlight()
    ranges.forEach((r) => hl.add(r))
    CSS.highlights.set(HL_NAME, hl)
    activeHighlight = hl
  } else {
    // 老浏览器降级：整行加背景类
    els.forEach((el) => {
      el.classList.add(FALLBACK_CLASS)
      fallbackEls.push(el)
    })
  }
}

// 新拖拽开始时调用：先让上一个实例的选区自行清理，再登记本实例
export function takeOverCrossSelection(clearFn) {
  if (activeClear && activeClear !== clearFn) {
    try {
      activeClear()
    } catch (e) {
      /* 忽略 */
    }
  }
  activeClear = clearFn
}

export function releaseCrossSelection(clearFn) {
  if (activeClear === clearFn) activeClear = null
}
