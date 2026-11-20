<template>
  <span
    class="switch"
    :class="{ on: modelValue }"
    :style="modelValue ? { background: store.themeColor } : {}"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="dot"></span>
  </span>
</template>

<script setup>
import { store } from '../store.js'
defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue'])
</script>

<style scoped>
.switch {
  display: inline-block;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: #c8ccd4;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  vertical-align: middle;
}
.switch.on {
  /* 开启态背景由内联 style 绑定 store.themeColor，此处不设固定色 */
}
.dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.2s;
}
.switch.on .dot {
  left: 18px;
}
</style>
