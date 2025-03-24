<template>
  <Dialog v-model="dialogVisible" title="账户充值记录" :width="width">
    <div class="mb-4">
      <h3 class="text-lg font-bold">{{
        accountName ? `账户：${accountName}` : `账户ID：${props.accountId}`
      }}</h3>
    </div>

    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :pagination="{
        total: total
      }"
      @pagination-change="getList"
    />

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, computed, onMounted } from 'vue'
import { ElButton, ElTag, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Table } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { getAccountRechargeRecordsApi } from '@/api/account'
import type { TableColumn } from '@/components/Table'

const props = defineProps({
  accountId: {
    type: Number,
    default: 0
  },
  width: {
    type: String,
    default: '900px'
  }
})

// 账户信息
const accountName = ref('')

// 弹窗可见状态
const dialogVisible = ref(false)

// 表格数据
const loading = ref(false)
const dataList = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'account_id',
    label: '账户ID',
    minWidth: 100
  },
  {
    field: 'account_name',
    label: '账户名',
    minWidth: 150
  },
  {
    field: 'after_balance',
    label: 'TRX余额',
    minWidth: 120,
    formatter: (row) => `${row.after_balance} TRX`
  },
  {
    field: 'amount',
    label: '充值金额',
    minWidth: 120,
    formatter: (row) => `+${row.amount} TRX`
  },
  {
    field: 'create_time',
    label: '创建时间',
    minWidth: 160,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'create_time',
    label: '完成时间',
    minWidth: 160,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  }
]

// 获取充值记录列表
const getList = async () => {
  if (!props.accountId) return

  loading.value = true
  try {
    const res = await getAccountRechargeRecordsApi({
      accountId: props.accountId,
      pageSize: pageSize.value,
      currentPage: currentPage.value
    })

    if (res.data) {
      dataList.value = res.data.list || []
      total.value = res.data.total || 0

      // 更新账户名称（如果记录中包含）
      if (dataList.value.length > 0) {
        accountName.value = dataList.value[0].account_name || ''
      }
    }
  } catch (error) {
    console.error('获取充值记录失败:', error)
    ElMessage.error('获取充值记录失败')
  } finally {
    loading.value = false
  }
}

// 打开弹窗
const open = (id: number) => {
  dialogVisible.value = true
  // 重置分页
  currentPage.value = 1

  if (id !== props.accountId) {
    // 清空上一次的数据
    dataList.value = []
    total.value = 0
    accountName.value = ''
  }

  // 请求数据
  getList()
}

// 暴露方法
defineExpose({
  open
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
</style>
