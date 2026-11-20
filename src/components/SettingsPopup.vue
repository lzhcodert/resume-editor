<template>
  <div ref="popRef" class="settings-pop" @click.stop>
    <div class="pop-title">
      副标题：
      <span class="pop-title-tip">显示/隐藏/调整顺序</span>
    </div>

    <div class="pop-checks">
      <label class="check-item">
        <input type="checkbox" v-model="settings.showTime" /> 时间
      </label>
      <label class="check-item">
        <input type="checkbox" v-model="settings.showSubject" /> 主体
      </label>
      <label class="check-item">
        <input type="checkbox" v-model="settings.showOther" /> 其它
      </label>
    </div>

    <div class="pop-radios">
      <label v-for="opt in ORDER_OPTIONS" :key="opt.value" class="radio-item">
        <input type="radio" :value="opt.value" v-model="settings.order" />
        {{ opt.label }}
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ORDER_OPTIONS } from '../store.js'

const props = defineProps({
  settings: { type: Object, required: true }
})
const emit = defineEmits(['close'])

const popRef = ref(null)

function onDocClick(e) {
  if (popRef.value && !popRef.value.contains(e.target)) {
    emit('close')
  }
}

onMounted(() => {
  // 延迟绑定，避免打开弹窗的那次点击立刻触发关闭
  setTimeout(() => document.addEventListener('click', onDocClick), 0)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
.settings-pop {
  position: absolute;
  top: 34px;
  right: 0;
  width: 240px;
  background: #fff;
  border: 1px solid #e3e6eb;
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  padding: 12px 14px;
  z-index: 50;
}
.pop-title {
  font-weight: 600;
  margin-bottom: 10px;
}
.pop-title-tip {
  font-weight: 400;
  color: #999;
  font-size: 12px;
}
.pop-checks {
  display: flex;
  gap: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 10px;
}
.check-item,
.radio-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}
.pop-radios {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
