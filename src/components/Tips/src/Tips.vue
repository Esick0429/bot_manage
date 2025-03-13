<template>
  <span class="tips-wrapper">
    <ElTooltip :content="content" placement="top" effect="light">
      <span class="tips-icon">
        <Icon :icon="icon" :size="Number(size)" />
      </span>
    </ElTooltip>
  </span>
</template>

<script setup lang="ts">
import { Icon } from '@/components/Icon'
import { ElTooltip } from 'element-plus'

defineProps({
  /**
   * 提示内容
   */
  content: {
    type: String,
    default: ''
  },
  /**
   * 图标名称
   */
  icon: {
    type: String,
    default: 'vi-ep:question-filled'
  },
  /**
   * 图标大小
   */
  size: {
    type: [String, Number],
    default: 12
  }
})
</script>

<style scoped>
.tips-wrapper {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  cursor: pointer;
}

.tips-icon {
  display: inline-flex;
  color: var(--el-color-info);
}
</style>
