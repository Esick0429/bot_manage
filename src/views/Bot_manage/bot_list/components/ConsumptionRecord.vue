<template>
  <Dialog v-model="dialogVisible" title="消费记录">
    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :pagination="{
        total: total
      }"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Dialog } from '@/components/Dialog'
import { Table } from '@/components/Table'

interface ConsumptionRecord {
  tg_bot_id: number
  name: string
  type: number
  amount: number
  createTime: string
}

const dialogVisible = ref(false)
const loading = ref(false)
const dataList = ref<ConsumptionRecord[]>([])
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)

// 表格列配置
const columns = [
  { field: 'tg_bot_id', label: '机器人ID', width: 120 },
  { field: 'name', label: '机器人昵称' },
  {
    field: 'type',
    label: '类型',
    formatter: (row) => {
      const typeMap = {
        1: '充值',
        2: '消费',
        3: '退款'
      }
      return typeMap[row.type] || '-'
    }
  },
  {
    field: 'amount',
    label: '费用',
    formatter: (row) => `￥${row.amount?.toFixed(2) || '0.00'}`
  },
  { field: 'createTime', label: '创建时间', width: 160 }
]

// 获取列表数据
const getList = async () => {
  loading.value = true
  try {
    // 模拟数据
    const list = Array.from({ length: 10 }).map((_, index) => ({
      tg_bot_id: Number(`BOT_${Math.floor(Math.random() * 1000)}`),
      name: `机器人${index + 1}`,
      type: Math.floor(Math.random() * 3) + 1,
      amount: Math.random() * 1000,
      createTime: new Date().toLocaleString()
    }))
    dataList.value = list
    total.value = 100
  } finally {
    loading.value = false
  }
}

// 打开弹窗方法
const open = () => {
  dialogVisible.value = true
  getList()
}

// 对外暴露方法
defineExpose({
  open
})
</script>
