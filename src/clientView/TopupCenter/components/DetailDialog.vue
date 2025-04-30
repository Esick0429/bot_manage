<template>
  <Dialog v-model="showDialog" title="查看详情" width="70%">
    <Descriptions
      v-if="rowData"
      :schema="descriptionSchema"
      :data="rowData"
      :column="3"
      border
      class="mb-4"
    />

    <div class="font-bold mb-2">充值记录</div>
    <Table
      @register="tableRegister"
      @update:pageSize="handlePageSizeChange"
      @update:currentPage="handleCurrentPageChange"
      :data="detailData"
      :loading="detailLoading"
      :border="true"
      stripe
      :pagination="{
        total: total
      }"
    />
    <template #footer>
      <span class="dialog-footer">
        <BaseButton @click="closeDialog">关闭</BaseButton>
      </span>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, watch, computed } from 'vue'
import { ElMessage, ElTag } from 'element-plus'
import Dialog from '@/components/Dialog/src/Dialog.vue'
import Descriptions from '@/components/Descriptions/src/Descriptions.vue'
import { Table, TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import type { DescriptionsSchema } from '@/components/Descriptions/src/types'
import { useTable } from '@/hooks/web/useTable'
import { formatToDateTime } from '@/utils/dateUtil'
import { getProductTypeText, getPaymentMethodText, getStatusInfo } from '@/utils/mappers'
import { getUserBatchRecordDetailListApi } from '@/api/credit/record'
import type {
  UserBatchRecordDetailListParams,
  UserBatchRecordDetailItem
} from '@/api/credit/record/types'

// --- Define types ---
interface DetailRecord extends UserBatchRecordDetailItem {
  // 可以继承 UserBatchRecordDetailItem 并添加/修改
  // 或者完全重新定义
}

// --- Props ---
const props = defineProps<{
  modelValue: boolean
  rowData: any | null
}>()

// --- Emits ---
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const total = ref(0)
// --- useTable Hook Setup ---
const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const id = props.rowData?.id // 获取订单号
    if (!id) {
      console.error('订单号 (id) 缺失，无法获取详情列表')
      return { list: [], total: 0 }
    }
    // 调用真实 API
    try {
      const apiParams: UserBatchRecordDetailListParams = {
        id: id, // 将订单号作为 id 传递
        current_page: currentPage.value,
        page_size: pageSize.value
      }
      const res = await getUserBatchRecordDetailListApi(apiParams)
      total.value = res.data?.totalCount || 0 // 确认 totalCount 路径
      // TODO: 确认 list 路径，可能需要 res.data.data.list
      return {
        list: res.data?.list || [],
        total: total.value
      }
    } catch (error) {
      console.error('获取详情列表失败:', error)
      ElMessage.error('获取详情列表失败')
      return { list: [], total: 0 }
    }
  },
  immediate: false
})

// Destructure state and methods from useTable
const { loading: detailLoading, dataList: detailData } = tableState
const { setProps, refresh } = tableMethods

// --- Define Detail Table Columns ---
// 更新以匹配最新的 detail_list API 返回
const detailTableColumns = ref<TableColumn[]>([
  { field: 'mobile', label: '号码' },
  { field: 'country', label: '国家' }, // 添加
  { field: 'operator', label: '运营商' }, // 添加
  { field: 'product_name', label: '产品' }, // 添加
  {
    field: 'sale_price', // 使用 sale_price
    label: '售价',
    formatter: (_, __, v) => (v ? `${v} USDT` : '-')
  },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: ({ row }) => (
        <ElTag type={getStatusInfo(row.status).type}>{getStatusInfo(row.status).text}</ElTag>
      )
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    formatter: (_, __, v) => formatToDateTime(v)
  },
  { field: 'describe', label: '描述/结果' }
  // 移除旧的 price, rechargeInfo 列
])

// --- Computed property to manage dialog visibility ---
const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// --- Descriptions Schema ---
const descriptionSchema = computed<DescriptionsSchema[]>(() => {
  if (!props.rowData) return []
  // 将返回字符串的 slots.default 改为返回 JSX
  return [
    { field: 'order_num', label: '订单号' },
    { field: 'product_id', label: '产品ID' },
    {
      field: 'product_type',
      label: '充值类型',
      slots: {
        default: (data) => <>{getProductTypeText(data.product_type)}</> // 返回 JSX
      }
    },
    {
      field: 'price',
      label: '售价',
      slots: {
        default: (data) => <>{`${data.price} USDT`}</> // 返回 JSX
      }
    },
    {
      field: 'sale_amount',
      label: '支付金额',
      slots: {
        default: (data) => <>{`${data.sale_amount} USDT`}</> // 返回 JSX
      }
    },
    {
      field: 'agent_active_cost',
      label: '成本价',
      slots: {
        default: (data) => <>{`${data.agent_active_cost} USDT`}</> // 返回 JSX
      }
    },
    {
      field: 'agent_profit',
      label: '利润',
      slots: {
        default: (data) => <>{`${data.agent_profit} USDT`}</> // 返回 JSX
      }
    },
    { field: 'total_num', label: '号码数量' },
    { field: 'success_num', label: '成功数量' },
    {
      field: 'pay_type',
      label: '支付方式',
      slots: {
        default: (data) => <>{getPaymentMethodText(data.pay_type)}</> // 返回 JSX
      }
    },
    {
      field: 'status',
      label: '状态',
      slots: {
        // 这个已经是 JSX 了，保持不变
        default: (data) => (
          <ElTag type={getStatusInfo(data.status).type}>{getStatusInfo(data.status).text}</ElTag>
        )
      }
    },
    { field: 'tg_name', label: 'TG用户名' },
    { field: 'nickname', label: '用户昵称' },
    { field: 'bot_name', label: '机器人名称' },
    { field: 'describe', label: '备注' },
    { field: 'txid', label: '交易哈希' },
    {
      field: 'create_time',
      label: '创建时间',
      slots: {
        default: (data) => <>{formatToDateTime(data.create_time)}</> // 返回 JSX
      }
    },
    {
      field: 'finish_time',
      label: '完成时间',
      slots: {
        default: (data) => <>{data.finish_time ? formatToDateTime(data.finish_time) : '-'}</> // 返回 JSX
      }
    }
  ]
})

// --- Watch for dialog opening ---
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (newValue && !oldValue) {
      // Update detail table columns based on needs
      setProps({ columns: detailTableColumns.value })
      refresh()
    }
  },
  { immediate: false }
)

// --- Close Dialog ---
function closeDialog() {
  emit('update:modelValue', false)
}

// --- 添加分页处理函数 ---
const handlePageSizeChange = (size: number) => {
  tableState.pageSize.value = size
  tableMethods.refresh() // 或 tableMethods.getList()
}

const handleCurrentPageChange = (page: number) => {
  tableState.currentPage.value = page
  tableMethods.refresh() // 或 tableMethods.getList()
}
</script>

<style lang="less" scoped>
:deep(.el-descriptions) {
  margin-bottom: 1rem;
}

/* Add any specific styles for the dialog if needed */
</style>
