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

<script setup lang="tsx">
import { ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { Table } from '@/components/Table'
import { getBotConsumptionRecordApi } from '@/api/botlist'
import { formatToDateTime } from '@/utils/dateUtil'

interface ConsumptionRecord {
  tg_bot_id: number
  firstname: string
  charge_type: number
  mount: number
  describe: string
  create_time: string
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
  { field: 'firstname', label: '机器人昵称' },
  {
    field: 'charge_type',
    label: '类型',
    slots: {
      default: ({ row }: { row: ConsumptionRecord }) => (
        <span style={{ color: row.charge_type === 1 ? 'red' : 'green' }}>
          {row.charge_type === 1 ? '支出' : '收入'}
        </span>
      )
    }
  },
  {
    field: 'mount',
    label: '费用',
    slots: {
      default: ({ row }: { row: ConsumptionRecord }) => (
        <span style={{ color: row.charge_type === 1 ? 'red' : 'green' }}>
          {row.charge_type === 1 ? `-${row.mount}TRX` : `${row.mount}TRX`}
        </span>
      )
    }
  },
  { field: 'describe', label: '描述' },
  {
    field: 'create_time',
    label: '创建时间',
    minWidth: 120,
    formatter: (row: ConsumptionRecord) => formatToDateTime(row.create_time)
  }
]

// 获取列表数据
const getList = async () => {
  loading.value = true
  try {
    const params = {
      page_size: pageSize.value,
      current_page: currentPage.value
    }
    const res = await getBotConsumptionRecordApi(params)
    if (res?.data) {
      dataList.value = res.data.list || []
      total.value = res.data.totalCount || 0
    }
  } finally {
    loading.value = false
  }
}

// Watch for pagination changes
watch(currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    getList()
  }
})

watch(pageSize, (newPageSize, oldPageSize) => {
  if (newPageSize !== oldPageSize) {
    if (currentPage.value !== 1) {
      currentPage.value = 1
    } else {
      getList()
    }
  }
})

// 打开弹窗方法
const open = (botId?: number) => {
  currentPage.value = 1
  pageSize.value = 10
  dialogVisible.value = true
  dataList.value = []
  total.value = 0
  getList()
}

// 对外暴露方法
defineExpose({
  open
})
</script>
