<template>
  <div>
    <h1>关键词回复</h1>
    <!-- <canvas ref="canvas" id="canvas" width="1000" height="1000"></canvas> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const canvas = ref<HTMLCanvasElement>()

onMounted(() => {
  const ctx = canvas.value?.getContext('2d') || ({} as any)
  // 绘制一段圆弧
  ctx.arc(100, 100, 50, 0, Math.PI * 2, false)
  ctx.stroke()
})
</script>
<style scoped>
canvas {
  border-radius: 10px;
  box-shadow: 0 0 10px #ccc;
}
</style>
