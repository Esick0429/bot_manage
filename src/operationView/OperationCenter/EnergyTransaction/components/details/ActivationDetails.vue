<script setup lang="ts">
import { ref, computed, watch, h, onMounted } from 'vue'
import { ElTag, ElLink, ElButton, ElTable, ElTableColumn, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { getBatchActiveListApi } from '@/api/energy_transaction' // 复用批量接口
import isEmpty from 'lodash-es/isEmpty'

// Helper function for formatting date/time
const formatDisplayDateTime = (dateValue) => {
  if (!dateValue || dateValue === 0) return '-'
  const timestamp = Number(dateValue)
  if (!isNaN(timestamp) && timestamp > 0) {
    const dateToFormat = String(timestamp).length === 10 ? timestamp * 1000 : timestamp
    try {
      return formatToDateTime(dateToFormat)
    } catch (e) {
      console.error('Error formatting date:', dateValue, e)
      return '日期无效'
    }
  }
  return '-'
}

const props = defineProps({
  orderData: {
    type: Object as () => any | null,
    default: () => null
  },
  orderId: {
    type: [String, Number],
    required: true
  }
})

// --- Component State ---
const activationDetails = ref<any[]>([])
const activationLoading = ref(false)
const activationCurrentPage = ref(1)
const activationPageSize = ref(10)
const activationTotal = ref(0)
const activationTransactionDialogVisible = ref(false)
const selectedActivationTransaction = ref<any>(null)

// --- Top-Level Description Schema with slots returning VNodes via h() ---
const activationSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'active_price', // Confirm field name in props.orderData
    label: '激活单价',
    slots: {
      default: (data) => {
        // Use h() to create VNode
        return h('span', `${data?.active_price ?? '-'} TRX`)
      }
    }
  },
  {
    field: 'total',
    label: '激活笔数',
    slots: {
      default: () => {
        // Use h() to create VNode
        return h('span', `${activationTotal.value} 笔`)
      }
    }
  }
])

// --- Status Maps for Table (Using handle_status based on screenshot) ---
const handleStatusMap: Record<number, string> = { 1: '已完成', 2: '待处理', 3: '已取消' /* other? */ }
const handleStatusColorMap: Record<number, string> = { 1: 'success', 2: 'warning', 3: 'danger' /* other? */ }
const dialogStatusMap: Record<number, string> = {
  1: '已完成' /* Other statuses from screenshot/data? */
}
const dialogStatusColorMap: Record<number, string> = {
  1: 'success' /* Other statuses from screenshot/data? */
}

const getStatusTag = (field: string, value: number) => {
  let text = '未知'
  let type: any = 'info'
  const numValue = Number(value)
  if (isNaN(numValue)) return h(ElTag, { type, size: 'small' }, () => text)

  switch (field) {
    case 'handle_status': // Use handle_status for the "状态" column
      text = handleStatusMap[numValue] || text
      type = handleStatusColorMap[numValue] || type
      break
    case 'status': // For the dialog, using 'status' field
      text = dialogStatusMap[numValue] || text
      type = dialogStatusColorMap[numValue] || type
      break
    // Add other cases if needed
  }
  // Combine statuses if needed, e.g., "已完成/待处理"
  // For simplicity now, just showing handle_status
  return h(ElTag, { type, size: 'small' }, () => text)
}

// --- Fetch Activation Details ---
const fetchActivationDetails = async () => {
  if (!props.orderId) {
    activationDetails.value = []
    activationTotal.value = 0
    console.warn('ActivationDetails (operationView): orderId prop is missing.')
    return
  }
  activationLoading.value = true
  activationDetails.value = []
  try {
    const params = {
      current_page: activationCurrentPage.value,
      page_size: activationPageSize.value
    }
    const response: any = await getBatchActiveListApi(props.orderId, params as any)
    console.log('ActivationDetails (operationView) API response:', response)

    if (response && response.code === '000000' && response.data) {
      const data: any = response.data
      const list = data.list || []
      const total =
        data.total !== undefined ? data.total : data.totalCount !== undefined ? data.totalCount : 0

      activationDetails.value = Array.isArray(list) ? list : []
      activationTotal.value = Number(total) || 0

      if (!Array.isArray(list)) {
        console.warn(
          'getBatchActiveListApi (for activation) response.data.list is not an array',
          response
        )
      }
    } else {
      const errorMessage = response?.msg || '获取激活列表失败'
      console.error('Failed to fetch activation list:', errorMessage, response)
      activationDetails.value = []
      activationTotal.value = 0
    }
  } catch (error: any) {
    console.error('Error during fetchActivationDetails:', error)
    ElMessage.error(error?.message || '获取激活列表请求失败')
    activationDetails.value = []
    activationTotal.value = 0
  } finally {
    activationLoading.value = false
  }
}

// --- Pagination Handlers ---
const handleActivationPageChange = (newPage: number) => {
  if (activationCurrentPage.value !== newPage) {
    activationCurrentPage.value = newPage
    fetchActivationDetails()
  }
}

const handleActivationSizeChange = (newSize: number) => {
  if (activationPageSize.value !== newSize) {
    activationPageSize.value = newSize
    if (activationCurrentPage.value !== 1) {
      activationCurrentPage.value = 1
    }
    fetchActivationDetails()
  }
}

// --- Action Handler ---
const handleViewActivationTransaction = (row: any) => {
  selectedActivationTransaction.value = row
  activationTransactionDialogVisible.value = true
}

// --- Table Columns Definition (Aligned with Screenshot) ---
const activationTableColumns = ref<TableColumn[]>([
  { type: 'index', label: '序号', width: 60, align: 'center', field: 'index' },
  {
    prop: 'to_address',
    field: 'to_address',
    label: '地址',
    minWidth: 180
  },
  {
    // Use handle_status based on screenshot "已完成/待处理"
    prop: 'status',
    field: 'status',
    label: '状态',
    width: 120,
    align: 'center',
    slots: { default: ({ row }) => getStatusTag('status', row.status) }
  },
  {
    // Assuming "激活时间" corresponds to create_time
    prop: 'create_time',
    field: 'create_time',
    label: '激活时间',
    width: 160,
    formatter: (row) => formatDisplayDateTime(row.create_time)
  },
  {
    prop: 'finish_time',
    field: 'finish_time',
    label: '完成时间',
    width: 160,
    formatter: (row) => formatDisplayDateTime(row.finish_time)
  },
  {
    prop: 'action',
    field: 'action',
    label: '操作',
    width: 120,
    align: 'center',
    fixed: 'right',
    slots: {
      default: ({ row }) => {
        return h(
          ElButton,
          {
            link: true,
            type: 'primary',
            size: 'small',
            onClick: () => handleViewActivationTransaction(row)
          },
          () => '交易详情'
        )
      }
    }
  }
])

// --- Schema for Activation Transaction Detail Dialog (New) ---
const activationTransactionSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'txid',
    label: '交易hash',
    span: 24,
    slots: { default: (data) => renderTxidLink(data?.txid) }
  },
  {
    field: 'from_address',
    label: '发起地址',
    span: 24
  },
  {
    field: 'to_address',
    label: '接收地址',
    span: 24
  },
  {
    field: 'status',
    label: '交易状态',
    span: 24,
    slots: { default: (data) => getStatusTag('status', data?.status) }
  },
  {
    field: 'finish_time',
    label: '完成时间',
    span: 24,
    slots: {
      default: (data) => {
        return h('span', formatDisplayDateTime(data?.finish_time))
      }
    }
  }
])

// --- Re-introduce renderTxidLink for the dialog
const renderTxidLink = (txid: string | null | undefined) => {
  if (isEmpty(txid)) return h('span', '-')
  return h(
    ElLink,
    {
      href: `https://tronscan.org/#/transaction/${txid}`, // Use mainnet for example
      type: 'primary',
      target: '_blank'
    },
    () => txid
  )
}

// --- Watchers and Lifecycle Hooks ---
watch(
  () => props.orderId,
  (newId, oldId) => {
    if (newId !== oldId && newId) {
      console.log(
        'ActivationDetails (operationView): orderId changed, fetching list for ID:',
        newId
      )
      if (activationCurrentPage.value !== 1) {
        activationCurrentPage.value = 1
      }
      fetchActivationDetails()
    }
  }
)

onMounted(() => {
  fetchActivationDetails()
})
</script>

<template>
  <div>
    <!-- Removed Top-Level Descriptions -->

    <!-- Display Activation Sub-Items Table -->
    <Table
      :columns="activationTableColumns"
      :data="activationDetails"
      :loading="activationLoading"
      :border="true"
      :showOverflowTooltip="true"
      :pagination="{
        total: activationTotal,
        currentPage: activationCurrentPage,
        pageSize: activationPageSize
      }"
      @update:current-page="handleActivationPageChange"
      @update:page-size="handleActivationSizeChange"
      :style="{ width: '100%' }"
    />

    <!-- Add Activation Transaction Detail Dialog -->
    <Dialog v-model="activationTransactionDialogVisible" title="交易详情">
      <Descriptions
        v-if="selectedActivationTransaction"
        :schema="activationTransactionSchema"
        :data="selectedActivationTransaction"
        :column="1"
        border
      />
      <div v-else>加载详情中...</div>
      <template #footer>
        <ElButton @click="activationTransactionDialogVisible = false">关闭</ElButton>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Add styles if needed, mb-20px added via class */
.mb-20px {
  margin-bottom: 20px;
}
</style>
