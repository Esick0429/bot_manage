<template>
  <Dialog v-model="dialogVisible" title="账户扣款记录" width="80%">
    <div class="mb-4">
      <h3 class="text-lg font-bold">{{
        accountName ? `账户：${accountName}` : `账户ID：${props.accountId}`
      }}</h3>
    </div>

    <SearchTable
      :columns="columns"
      :search-schema="searchSchema"
      :fetch-data-api="fetchDeductionRecords"
      ref="searchTableRef"
      @search="onSearch"
    />

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, onMounted } from 'vue'
import { ElButton, ElTag, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { dateUtil } from '@/utils/dateUtil'
import { getAccountDeductionRecordsApi } from '@/api/account'
import type { TableColumn } from '@/components/Table'

const props = defineProps({
  accountId: {
    type: Number,
    default: 0
  }
})

// 账户信息
const accountName = ref('')
const dialogVisible = ref(false)
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'transaction_id',
    label: '交易ID',
    minWidth: 120
  },
  {
    field: 'transaction_type',
    label: '交易类型',
    minWidth: 120
  },
  {
    field: 'bot_name',
    label: '所属机器人',
    minWidth: 120
  },
  {
    field: 'amount',
    label: '交易金额',
    minWidth: 120,
    formatter: (row) => `${row.amount} USDT`
  },
  {
    field: 'before_trx',
    label: '交易前TRX',
    minWidth: 120,
    formatter: (row) => `${row.before_trx} T`
  },
  {
    field: 'after_trx',
    label: '交易后TRX',
    minWidth: 120,
    formatter: (row) => `${row.after_trx} T`
  },
  {
    field: 'status',
    label: '交易状态',
    minWidth: 100,
    slots: {
      default: ({ row }) => {
        return <ElTag type="success">成功</ElTag>
      }
    }
  },
  {
    field: 'transaction_time',
    label: '交易时间',
    minWidth: 160,
    formatter: (row) => row.transaction_time
  },
  {
    field: 'order_id',
    label: '关联订单ID',
    minWidth: 120
  }
]

// 搜索表单配置，添加订单号查询
const searchSchema = [
  {
    field: 'transaction_type',
    component: 'Select' as const,
    label: '交易类型',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '智能托管', value: '智能托管' },
        { label: '闪兑', value: '闪兑' },
        { label: '能量租赁', value: '能量租赁' }
      ],
      placeholder: '请选择交易类型'
    }
  },
  {
    field: 'order_id',
    component: 'Input' as const,
    label: '订单号',
    componentProps: {
      placeholder: '请输入订单号'
    }
  },
  {
    field: 'transaction_time',
    component: 'DatePicker' as const,
    label: '交易时间',
    componentProps: {
      type: 'datetime',
      placeholder: '请选择交易时间'
    }
  }
]

// 获取扣款记录数据
const fetchDeductionRecords = async (params: any) => {
  if (!props.accountId) return { list: [], total: 0 }

  try {
    const response = await getAccountDeductionRecordsApi({
      accountId: props.accountId,
      transaction_type: params.transaction_type,
      order_id: params.order_id,
      pageSize: params.pageSize,
      currentPage: params.currentPage
    })

    if (response && response.data) {
      // 如果有记录且没有保存账户名，就从第一条记录获取
      if (response.data.list && response.data.list.length > 0 && !accountName.value) {
        // 假设记录中包含账户名字段，实际情况可能需要调整
        // accountName.value = response.data.list[0].account_name
      }

      return response.data
    }

    return { list: [], total: 0 }
  } catch (error) {
    console.error('获取扣款记录失败:', error)
    ElMessage.error('获取扣款记录失败')
    return { list: [], total: 0 }
  }
}

// 处理搜索
const onSearch = (params: any) => {
  console.log('搜索参数:', params)
}

// 打开弹窗
const open = (accountId: number, name: string = '') => {
  dialogVisible.value = true
  accountName.value = name

  // 重新加载列表
  setTimeout(() => {
    searchTableRef.value?.reload()
  }, 100)
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
