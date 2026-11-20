<template>
  <div class="cp-wrap" ref="wrapRef">
    <button class="cp-trigger" type="button" title="点击选择主题色" @click="open = !open">
      <span class="cp-swatch" :style="{ background: modelValue }"></span>
      <span>主题</span>
      <svg class="cp-arrow" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
    </button>

    <div v-if="open" class="cp-panel" @mousedown.stop>
      <div
        class="cp-sv"
        ref="svRef"
        :style="{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))` }"
        @mousedown="onSvDown"
      >
        <span class="cp-sv-cursor" :style="{ left: hsv.s + '%', top: (100 - hsv.v) + '%' }"></span>
      </div>

      <div class="cp-sliders">
        <div class="cp-slider cp-hue" ref="hueRef" @mousedown="onHueDown">
          <span class="cp-slider-cursor" :style="{ left: (hsv.h / 360 * 100) + '%' }"></span>
        </div>
        <div
          class="cp-slider cp-alpha"
          ref="alphaRef"
          :style="{ background: `linear-gradient(to right, transparent, rgb(${rgb.r}, ${rgb.g}, ${rgb.b}))` }"
          @mousedown="onAlphaDown"
        >
          <span class="cp-slider-cursor" :style="{ left: alpha + '%' }"></span>
        </div>
      </div>

      <div class="cp-readout">
        <span class="cp-preview" :style="{ background: modelValue }"></span>
        <input
          class="cp-hex"
          v-model="hexText"
          spellcheck="false"
          title="十六进制色值"
          @keyup.enter="onHexInput"
          @blur="onHexInput"
        />
      </div>

      <div class="cp-presets">
        <span
          v-for="(c, i) in presets"
          :key="i"
          class="cp-preset"
          :style="{ background: c }"
          :title="c"
          @click="pick(c)"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({ modelValue: { type: String, default: '#007AFF' } })
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const wrapRef = ref(null)
const svRef = ref(null)
const hueRef = ref(null)
const alphaRef = ref(null)
const hsv = reactive({ h: 211, s: 100, v: 100 })
const alpha = ref(100)
const hexText = ref(props.modelValue)

const presets = [
  '#FF3B30', '#FF2D55', '#AF52DE', '#5856D6', '#007AFF', '#5AC8FA', '#00C7BE', '#34C759',
  '#FFCC00', '#FF9500', '#A2845E', '#8E8E93', '#636366', '#C7C7CC', '#D1D1D6', '#E5E5EA',
  '#F2F2F7', '#FFFFFF', '#1C1C1E', '#000000'
]

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

function hexToRgb(hex) {
  let h = String(hex || '').trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length === 8) h = h.slice(0, 6)
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  }
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 }
}

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()
}

const rgb = computed(() => hsvToRgb(hsv.h, hsv.s, hsv.v))

function emitColor() {
  const { r, g, b } = rgb.value
  let hex = rgbToHex(r, g, b)
  if (alpha.value < 100) {
    hex += Math.round((alpha.value / 100) * 255).toString(16).padStart(2, '0').toUpperCase()
  }
  hexText.value = hex
  emit('update:modelValue', hex)
}

function setFromHex(value) {
  const parsed = hexToRgb(value)
  if (!parsed) return
  const h = rgbToHsv(parsed.r, parsed.g, parsed.b)
  hsv.h = h.h; hsv.s = h.s; hsv.v = h.v
  const raw = String(value).replace('#', '')
  alpha.value = raw.length === 8 ? Math.round((parseInt(raw.slice(6, 8), 16) / 255) * 100) : 100
  hexText.value = String(value).toUpperCase()
}

watch(open, (v) => { if (v) setFromHex(props.modelValue) })

function pick(c) {
  setFromHex(c)
  emit('update:modelValue', c.toUpperCase())
}

function onHexInput() {
  const raw = hexText.value.trim().replace('#', '')
  if (/^[0-9a-fA-F]{6}$/.test(raw) || /^[0-9a-fA-F]{8}$/.test(raw)) {
    const value = '#' + raw.toUpperCase()
    setFromHex(value)
    emit('update:modelValue', value)
  } else {
    setFromHex(props.modelValue)
  }
}

let dragType = null

function bindDrag() {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', unbindDrag)
}

function unbindDrag() {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', unbindDrag)
  dragType = null
}

function onSvDown(e) { dragType = 'sv'; updateSv(e); bindDrag() }
function onHueDown(e) { dragType = 'hue'; updateHue(e); bindDrag() }
function onAlphaDown(e) { dragType = 'alpha'; updateAlpha(e); bindDrag() }

function onDrag(e) {
  if (dragType === 'sv') updateSv(e)
  else if (dragType === 'hue') updateHue(e)
  else if (dragType === 'alpha') updateAlpha(e)
}

function updateSv(e) {
  const r = svRef.value.getBoundingClientRect()
  hsv.s = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100)
  hsv.v = clamp(100 - ((e.clientY - r.top) / r.height) * 100, 0, 100)
  emitColor()
}

function updateHue(e) {
  const r = hueRef.value.getBoundingClientRect()
  hsv.h = clamp(((e.clientX - r.left) / r.width) * 360, 0, 360)
  emitColor()
}

function updateAlpha(e) {
  const r = alphaRef.value.getBoundingClientRect()
  alpha.value = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100)
  emitColor()
}

function onDocDown(e) {
  if (open.value && wrapRef.value && !wrapRef.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onDocDown))
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocDown)
  unbindDrag()
})
</script>

<style scoped>
.cp-wrap {
  position: relative;
}
.cp-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #e2e5ea;
  border-radius: 6px;
  background: #fff;
  color: #4a4f57;
  font-size: 13px;
  cursor: pointer;
}
.cp-trigger:hover {
  border-color: #c8cdd4;
}
.cp-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
.cp-arrow {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}
.cp-panel {
  position: absolute;
  top: 36px;
  left: 0;
  z-index: 50;
  width: 260px;
  padding: 10px;
  background: #fff;
  border: 1px solid #e2e5ea;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}
.cp-sv {
  height: 140px;
  position: relative;
  border-radius: 4px;
  cursor: crosshair;
}
.cp-sv-cursor {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.cp-sliders {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cp-slider {
  position: relative;
  height: 12px;
  border-radius: 6px;
  cursor: pointer;
}
.cp-hue {
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}
.cp-alpha {
  background-image: linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0;
}
.cp-slider-cursor {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.cp-readout {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
}
.cp-preview {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex: none;
}
.cp-hex {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #e2e5ea;
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  color: #333;
}
.cp-presets {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
}
.cp-preset {
  height: 22px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
}
.cp-preset:hover {
  outline: 2px solid #4096ff;
  outline-offset: 1px;
}
</style>
