<script setup lang="ts">
import { ref, computed, watch, h, onMounted } from 'vue'
import { ElTag, ElLink, ElButton, ElTable, ElTableColumn } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { getBatchActiveDetailApi } from '@/api/energy_order' // Keep API import
import isEmpty from 'lodash-es/isEmpty'

const props = defineProps({
  orderData: {
    // Not strictly needed if orderId is passed, but useful for context
    type: Object,
    default: () => ({})
  },
  orderId: {
    type: [String, Number],
    required: true
  }
})

// --- 激活详情 (Type 5) 状态 ---
const activationDetails = ref<any[]>([]) // 存储激活详情列表
const activationLoading = ref(false) // 控制激活详情表格加载状态
const activationCurrentPage = ref(1) // 激活详情 - 当前页码
const activationPageSize = ref(10) // 激活详情 - 每页条数
const activationTotal = ref(0) // 激活详情 - 总条数
const activationTransactionDialogVisible = ref(false) // 激活交易详情弹窗
const selectedActivationTransaction = ref<any>(null) // 选中的激活交易

// Helper function for TRANSACTION status text (1: 已完成, 2: 待处理)
const getTransactionStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: '-',
    1: '已完成',
    2: '待处理'
  }
  return statusMap[status] ?? '未知' // Default to '未知' if status is unexpected
}

// Helper function for TRANSACTION status tag type
const getTransactionStatusTagType = (status: number): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<number, 'success' | 'warning' | 'info' | 'danger'> = {
    1: 'success', // 已完成
    2: 'warning' // 待处理 (Using warning, adjust if needed)
  }
  return typeMap[status] ?? 'info' // Default to 'info'
}

// --- 获取激活详情 (Type 5) 的函数 ---
const fetchActivationDetails = async () => {
  if (!props.orderId) {
    activationDetails.value = []
    activationTotal.value = 0
    return
  }

  activationLoading.value = true
  activationDetails.value = []
  try {
    const params = {
      current_page: activationCurrentPage.value,
      page_size: activationPageSize.value
    }
    // Assuming getBatchActiveDetailApi works for type 5 with these params
    const response = await getBatchActiveDetailApi(props.orderId, params) // Pass params
    activationDetails.value = response?.data?.list || []
    if (!Array.isArray(activationDetails.value)) {
      console.warn('激活详情API (Type 5) 未返回预期的数组格式', response)
      activationDetails.value = []
    }
    activationTotal.value = response?.data?.totalCount || 0
  } catch (error) {
    console.error('获取激活详情 (Type 5) 失败:', error)
    activationDetails.value = []
    activationTotal.value = 0
  } finally {
    activationLoading.value = false
  }
}

// --- 激活详情 (Type 5) 分页处理函数 ---
const handleActivationPageChange = (newPage: number) => {
  activationCurrentPage.value = newPage
  fetchActivationDetails()
}

const handleActivationSizeChange = (newSize: number) => {
  activationPageSize.value = newSize
  activationCurrentPage.value = 1
  fetchActivationDetails()
}

// --- 激活详情 (Type 5) 查看交易详情 ---
const handleViewActivationTransaction = (row: any) => {
  selectedActivationTransaction.value = row
  activationTransactionDialogVisible.value = true
}

// --- 激活详情 (Type 5) 表格列定义 (Updated based on BatchOrderDetails.vue) ---
const activationTableColumns = ref<TableColumn[]>([
  { type: 'index', label: '序号', width: 60, align: 'center', field: 'index' },
  {
    prop: 'to_address',
    field: 'to_address',
    label: '地址',
    minWidth: 400, // Adjusted width
    slots: {
      default: ({ row }) => {
        // Removed the wrapping span and the ElTag for activation status
        return h('span', {}, row.to_address) // Only display the address text
      }
    }
  },
  {
    prop: 'active_price',
    field: 'active_price',
    label: '激活单价',
    width: 150,
    align: 'center',
    formatter: (row: any) => h('span', {}, `${row.active_price} TRX`) // Kept original formatting
  },
  {
    prop: 'status', // Using 'status' as the prop
    field: 'status',
    label: '交易状态',
    width: 100,
    align: 'center',
    slots: {
      default: ({ row }) => {
        // Convert status to number for reliable comparison
        const statusNum = Number(row.status)
        if (isNaN(statusNum)) {
          return h(ElTag, { type: 'info', size: 'small' }, () => '未知') // Handle invalid status
        }
        return h(
          ElTag,
          { type: getTransactionStatusTagType(statusNum), size: 'small' }, // Use helper for type
          () => getTransactionStatusText(statusNum) // Use helper for text
        )
      }
    }
  },
  {
    prop: 'create_time',
    field: 'create_time',
    label: '激活时间',
    width: 180,
    align: 'center', // Added center alignment
    formatter: (row: any) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    prop: 'action',
    field: 'action',
    label: '操作',
    width: 120,
    align: 'center',
    fixed: 'right', // Added fixed right
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

// --- 激活详情 (Type 5) 交易详情 Schema ---
const activationTransactionSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'txid', // 对应 row.txid
    label: '交易hash',
    span: 24,
    slots: {
      default: (data: any) => {
        if (isEmpty(data?.txid)) return h('span', '-')
        return h(
          ElLink,
          {
            href: `https://tronscan.org/#/transaction/${data.txid}`,
            type: 'primary',
            target: '_blank'
          },
          () => data.txid
        )
      }
    }
  },
  { field: 'from_address', label: '发起地址', span: 24 }, // 对应 row.from_address
  { field: 'to_address', label: '接收地址', span: 24 }, // 对应 row.to_address
  {
    field: 'status', // 虚拟字段，显示固定状态或根据需要调整
    label: '交易状态',
    slots: {
      // 直接显示 "已完成"，因为激活列表的交易通常是完成的
      default: () =>
        h(
          ElTag,
          {
            type: getTransactionStatusTagType(selectedActivationTransaction.value.status),
            size: 'small'
          }, // Use helper for type
          () => getTransactionStatusText(selectedActivationTransaction.value.status) // Use helper for text
        )
    }
  },
  {
    field: 'order_amount', // 对应 row.order_amount (or the relevant amount field)
    label: '激活单价',
    slots: {
      default: (data: any) => {
        if (data.order_amount === undefined || data.order_amount === null) return h('span', '-')
        const num = Number(data.order_amount)
        const displayText = isNaN(num) ? '-' : num.toString()
        // If TRX amount is expected in the activation list row, display it
        return h('span', {}, `${displayText} TRX`)
      }
    }
  },
  {
    field: 'create_time', // 对应 row.create_time
    label: '完成时间', // 使用创建时间作为完成时间
    span: 24,
    slots: {
      default: (data: any) =>
        h('span', {}, data.create_time ? formatToDateTime(data.create_time) : '-')
    }
  }
])

// Fetch data when component is mounted or orderId changes
onMounted(() => {
  fetchActivationDetails()
})

watch(
  () => props.orderId,
  (newId, oldId) => {
    if (newId !== oldId) {
      activationCurrentPage.value = 1 // Reset pagination on ID change
      fetchActivationDetails()
    }
  }
)
</script>

<template>
  <div>
    <Table
      :columns="activationTableColumns"
      :data="activationDetails"
      :loading="activationLoading"
      border
      stripe
      style="margin-top: 15px"
      :pagination="{
        total: activationTotal,
        currentPage: activationCurrentPage,
        pageSize: activationPageSize
      }"
      @update:current-page="handleActivationPageChange"
      @update:page-size="handleActivationSizeChange"
    />

    <!-- 激活详情交易弹窗 -->
    <Dialog v-model="activationTransactionDialogVisible" title="交易详情">
      <Descriptions
        :schema="activationTransactionSchema"
        :data="selectedActivationTransaction"
        :column="1"
        border
      />
      <template #footer>
        <div class="flex justify-end">
          <ElButton @click="activationTransactionDialogVisible = false">关闭</ElButton>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Add component-specific styles if needed */
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.justify-between {
  justify-content: space-between;
}
</style>
