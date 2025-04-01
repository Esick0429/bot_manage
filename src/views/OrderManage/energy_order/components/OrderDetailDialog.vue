<script setup lang="ts">
import { ref, computed, h, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElTabs, ElTabPane, ElTag, ElLink, ElButton, ElTable, ElTableColumn } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { formatToDateTime } from '@/utils/dateUtil'
import { getBatchActiveDetailApi } from '@/api/energy_order'
import { Table } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import formatEnergyNum from '@/views/OrderManage/helpers/formatEnergyNum'
const props = defineProps({
  modelValue: {
    // for v-model:visible
    type: Boolean,
    default: false
  },
  orderData: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const localVisible = ref(props.modelValue)
const activeTab = ref('order')
const orderDetail = ref<any>({})

// Watch for prop changes
watch(
  () => props.modelValue,
  (newVal) => {
    localVisible.value = newVal
  }
)

watch(
  () => props.orderData,
  (newData) => {
    if (newData) {
      orderDetail.value = newData
      // Reset tab based on new data
      activeTab.value = 'order' // Default to order tab
      // Optionally pre-select tab based on type if needed when dialog opens
      // const orderType = newData.order_type;
      // if (orderType === 1) activeTab.value = 'byCount';
      // else if (orderType === 2) activeTab.value = 'byTime';
      // // ... etc.
    } else {
      orderDetail.value = {}
    }
  },
  { immediate: true, deep: true }
)

const handleClose = () => {
  emit('update:modelValue', false)
}

// --- Helper Functions (Simplified) ---

const getStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    1: '已完成',
    2: '待支付',
    3: '已取消'
  }
  return statusMap[status] || '未知状态'
}

const navigateToUserList = (userId: string | number) => {
  if (!userId) return
  router.push({
    path: '/user_group/user_list',
    query: { tg_id: userId }
  })
}

const navigateToBotList = (botId: string | number) => {
  if (!botId) return
  router.push({
    path: '/bot_manage/bot_list',
    query: { tg_bot_id: botId }
  })
}

// --- Schemas (Adjusted field names and simplified tag logic) ---

const orderDetailSchema = computed((): DescriptionsSchema[] => {
  let schema = [
    { field: 'order_num', label: '订单号' },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (data: any) => {
          if (!data || data.status === undefined) return h('span', '-')
          // Simplified status color mapping
          const statusColorMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
            1: 'success', // 已完成
            2: 'warning', // 待支付
            3: 'danger' // 已取消
          }
          const tagType = statusColorMap[data.status] || 'info'
          return h(ElTag, { type: tagType, size: 'small' }, () => getStatusText(data.status)) // Keep text helper
        }
      }
    },
    {
      field: 'order_type',
      label: '订单类型',
      slots: {
        default: (data: any) => {
          if (!data || data.order_type === undefined) return h('span', '-')
          const typeTextMap: Record<number, string> = {
            1: '按笔数',
            2: '按时间',
            3: '批量下单',
            4: '闪租',
            5: '激活'
          }
          // Fixed color types
          const typeColorMap: Record<
            number,
            'primary' | 'success' | 'warning' | 'danger' | 'info'
          > = {
            1: 'primary',
            2: 'success',
            3: 'warning',
            4: 'danger',
            5: 'info'
          }
          const orderTypeNum =
            typeof data.order_type === 'string' ? parseInt(data.order_type, 10) : data.order_type

          if (isNaN(orderTypeNum) || !(orderTypeNum in typeTextMap)) {
            return h(ElTag, { type: 'info', size: 'small' }, () => '未知类型')
          }

          const tagType = typeColorMap[orderTypeNum] || 'info'
          const text = typeTextMap[orderTypeNum]
          return h(ElTag, { type: tagType, size: 'small' }, () => text)
        }
      }
    },
    // { field: 'tg_id', label: 'TG用户ID' },
    {
      field: 'tg_name',
      label: 'TG用户名',
      slots: {
        default: (data: any) => {
          if (!data || !data.tg_name) return h('span', '-')
          return h(
            ElLink,
            { type: 'primary', onClick: () => navigateToUserList(data.tg_id) },
            () => data.tg_name || '-' // Use tg_name from API
          )
        }
      }
    },
    // Assuming API provides nickname, if not remove or adjust
    { field: 'nickname', label: 'TG用户昵称' },
    {
      field: 'bot_name',
      label: '机器人名称',
      slots: {
        default: (data: any) => {
          if (!data || !data.bot_name) return h('span', '-')
          return h(
            ElLink,
            { type: 'primary', onClick: () => navigateToBotList(data.bot_id) },
            () => data.bot_name || '-' // Use bot_name from API
          )
        }
      }
    },
    { field: 'bot_id', label: '机器人ID' },
    {
      field: 'create_time',
      label: '创建时间',
      slots: {
        default: (data: any) =>
          h('span', {}, data.create_time ? formatToDateTime(data.create_time) : '-')
      }
    },
    {
      field: 'order_amount',
      label: '订单金额',
      slots: {
        default: (data: any) => h('span', {}, data.order_amount + ' ' + data.pay_unit)
      }
    },
    {
      field: 'pay_amount',
      label: '支付金额',
      slots: {
        default: (data: any) => h('span', {}, data.pay_amount + ' ' + data.pay_unit)
      }
    },
    {
      field: 'pay_type',
      label: '支付类型',
      slots: {
        default: (data: any) => h('span', {}, data.pay_type ?? '余额支付')
      }
    },
    {
      field: 'energy_num',
      label: '能量数量',
      slots: {
        default: (data: any) => h('span', {}, formatEnergyNum(data.energy_num) ?? '-')
      }
    },
    {
      field: 'energy_rent_text',
      label: '能量有效期',
      slots: {
        default: (data: any) => h('span', {}, data.energy_rent_text ?? '-')
      }
    },
    {
      field: 'stroke_num',
      label: '笔数',
      slots: {
        default: (data: any) => h('span', {}, data.stroke_num ?? '-')
      }
    },
    // {
    //   field: 'recycle_energy_num',
    //   label: '能量回收数',

    //   slots: {
    //     default: (data: any) => h('span', {}, data.recycle_energy_num ?? '-')
    //   }
    // },
    {
      field: 'pay_time',
      label: '支付时间',
      slots: {
        default: (data: any) => h('span', {}, data.pay_time ? formatToDateTime(data.pay_time) : '-')
      }
    },
    {
      field: 'finish_time',
      label: '完成时间',
      slots: {
        default: (data: any) =>
          h('span', {}, data.finish_time ? formatToDateTime(data.finish_time) : '-')
      }
    },
    { field: 'describe', label: '描述', span: 24 } // Use 'describe' from API example
    // { field: 'remark', label: '备注', span: 24 } // Removed remark as it wasn't in API example
  ]
  return schema
})

// 按笔数详情 schema
const byCountDetailSchema = computed((): DescriptionsSchema[] => [
  { field: 'stroke_num', label: '租用笔数' },
  {
    field: 'order_amount',
    label: '订单金额',
    slots: {
      default: (data: any) => h('span', {}, data.order_amount + ' ' + data.pay_unit)
    }
  }
])

//按笔数详情 tableSchema
const byCountDetailTableSchema = computed((): TableColumn[] => [
  {
    field: 'index', // 字段名，通常用于标识数据
    label: '序号', // 表头显示的名称
    type: 'index', // 指定为索引列，会自动显示行号
    width: '60px' // 列宽
  },
  {
    field: 'amount', // 对应数据中的能量数量字段
    label: '能量数量'
  },
  {
    field: 'expiryDate', // 对应数据中的有效期字段
    label: '有效期'
  },
  {
    field: 'status', // 对应数据中的状态字段
    label: '状态'
    // 可以根据需要添加 formatter 或 slot 来自定义状态显示
    // e.g., formatter: (row) => row.status === 1 ? '已使用' : '未使用'
  },
  {
    field: 'usageTime', // 对应数据中的使用时间字段
    label: '使用时间'
  }
  // {
  //   field: 'recoveryTime', // 对应数据中的能量回收时间字段
  //   label: '能量回收时间'
  // }
])

// 按时间详情 schema
const byTimeDetailSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'energy_num',
    label: '能量数量',
    slots: {
      default: (data: any) => h('span', {}, formatEnergyNum(data.energy_num) ?? '-')
    }
  },
  { field: 'energy_rent_text', label: '能量有效期' },
  { field: 'receive_address', label: '接收地址', span: 24 },
  {
    field: 'txid',
    label: '能量转账hash',
    span: 24,
    slots: {
      default: (data: any) => {
        if (!data || !data.txid) return h('span', '-')
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
  }
  // Commented out fields already present in the main orderDetailSchema
])

// 闪租详情 schema
const flashRentDetailSchema = computed((): DescriptionsSchema[] => [
  { field: 'stroke_num', label: '闪租笔数' }, // Assuming 'stroke_num' applies
  {
    field: 'flash_price',
    label: '闪租能量价格',
    slots: {
      default: (data: any) =>
        h('span', {}, data.flash_price + ' ' + data.pay_unit + '/' + data.energy_rent_text)
    }
  },
  { field: 'receive_address', label: '接收地址', span: 24 },
  { field: 'from_address', label: '收款地址', span: 24 },
  {
    field: 'txid',
    label: '交易hash',
    span: 24,
    slots: {
      default: (data: any) => {
        if (!data || !data.txid) return h('span', '-')
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
  }
])

// 批量下单详情 schema
const batchOrderDetailSchema = computed((): DescriptionsSchema[] => [
  { field: 'energy_num', label: '总能量数量' },
  { field: 'energy_rent_text', label: '能量有效期' },
  { field: 'stroke_num', label: '总笔数' },
  { field: 'order_amount', label: '总价' },
  { field: 'pay_unit', label: '支付单位' },
  {
    field: 'txid',
    label: '交易哈希',
    span: 24,
    slots: {
      default: (data: any) => {
        if (!data || !data.txid) return h('span', '-')
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
  }
])

// --- 新增状态 ---
const activationDetails = ref<any[]>([]) // 存储激活详情列表
const activationLoading = ref(false) // 控制激活详情表格加载状态
const activationCurrentPage = ref(1) // 激活详情 - 当前页码
const activationPageSize = ref(10) // 激活详情 - 每页条数
const activationTotal = ref(0) // 激活详情 - 总条数

// --- 新增获取激活详情的函数 ---
const fetchActivationDetails = async () => {
  // 确保有订单数据和 ID
  const id = props.orderData?.id
  if (!id) {
    console.warn('无法获取订单ID以加载激活详情')
    activationDetails.value = [] // 清空以防万一
    return
  }

  activationLoading.value = true
  activationDetails.value = [] // 清空旧数据
  try {
    // --- 假设 API 已更新，支持分页参数 ---
    const params = {
      page: activationCurrentPage.value,
      pageSize: activationPageSize.value
    }
    // TODO: 确认 getBatchActiveDetailApi 是否已修改以接受 params
    // const response = await getBatchActiveDetailApi(orderId, params); // 期望的调用方式
    const response = await getBatchActiveDetailApi(id) // 临时保持旧调用，需要后端配合修改
    // --- 假设 API 返回结构为 { data: { list: [], total: number } } ---
    activationDetails.value = response?.data?.list || [] // 使用 list
    if (!Array.isArray(activationDetails.value)) {
      console.warn('激活详情API未返回预期的数组格式', response)
      activationDetails.value = [] // 确保是数组
    }
    activationTotal.value = response?.data?.total || 0 // 更新总条数
  } catch (error) {
    console.error('获取激活详情失败:', error)
    activationDetails.value = [] // 出错时确保为空数组
  } finally {
    activationLoading.value = false
  }
}

// --- 修改 Watcher ---
watch(
  () => props.modelValue,
  (isVisible) => {
    // 当弹窗变为可见，并且是激活类型订单时，获取数据
    if (isVisible && props.orderData?.order_type === 5) {
      // 重置分页到第一页再加载
      activationCurrentPage.value = 1
      fetchActivationDetails()
    }
    // 可选：当弹窗关闭时清空数据和重置分页
    if (!isVisible) {
      activationDetails.value = []
      activationTotal.value = 0
      activationCurrentPage.value = 1
      // pageSize 通常不需要重置
    }
  },
  { immediate: false }
) // 不需要立即执行

// --- 新增分页处理函数 ---
const handleActivationPageChange = (newPage: number) => {
  activationCurrentPage.value = newPage
  fetchActivationDetails() // 重新获取数据
}

const handleActivationSizeChange = (newSize: number) => {
  activationPageSize.value = newSize
  activationCurrentPage.value = 1 // 页大小改变时，通常返回第一页
  fetchActivationDetails() // 重新获取数据
}

// --- 新增状态：用于激活表格的交易详情弹窗 ---
const activationTransactionDialogVisible = ref(false)
const selectedActivationTransaction = ref<any>(null) // 存储选中的行数据

// --- 新增函数：处理查看激活交易详情 ---
const handleViewActivationTransaction = (row: any) => {
  selectedActivationTransaction.value = row // 存储行数据
  activationTransactionDialogVisible.value = true // 打开弹窗
}

// --- 激活详情表格列定义 (更新操作列) ---
const activationTableColumns = ref<TableColumn[]>([
  { type: 'index', label: '序号', width: 80, align: 'center', field: 'index' },
  { prop: 'to_address', field: 'to_address', label: '地址', minWidth: 280 },
  {
    prop: 'status',
    field: 'status',
    label: '状态',
    width: 100,
    align: 'center',
    slots: { default: () => h(ElTag, { type: 'success' }, () => '已激活') }
  },
  {
    prop: 'create_time',
    field: 'create_time',
    label: '激活时间',
    width: 180,
    formatter: (row: any) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    prop: 'action',
    field: 'action',
    label: '操作',
    width: 120,
    align: 'center',
    slots: {
      default: ({ row }) => {
        // 修改为按钮或链接，并绑定点击事件
        return h(
          ElButton, // 或者用 ElLink 并添加 type='primary'
          {
            link: true, // 使按钮看起来像链接
            type: 'primary',
            size: 'small',
            onClick: () => handleViewActivationTransaction(row) // 调用处理函数
          },
          () => '交易详情'
        )
        // 注意：不再需要检查 row.txid，因为弹窗会显示行内的所有信息
      }
    }
  }
])

// --- 新增 Schema：用于激活表格的交易详情弹窗 ---
const activationTransactionSchema = computed((): DescriptionsSchema[] => [
  {
    field: 'txid', // 对应 row.txid
    label: '交易hash',
    span: 24,
    slots: {
      default: (data: any) => {
        if (!data || !data.txid) return h('span', '-')
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
      default: () => h(ElTag, { type: 'success' }, () => '已完成')
    }
  },
  {
    field: 'order_amount', // 对应 row.order_amount
    label: 'TRX数量',
    // 使用 slots 替代 formatter
    slots: {
      default: (data: any) => {
        if (data.order_amount === undefined || data.order_amount === null) return h('span', '-')
        const num = Number(data.order_amount)
        // 直接显示数字
        const displayText = isNaN(num) ? '-' : num.toString()
        // 如果需要 'w' 格式:
        // const displayText = isNaN(num) ? '-' : (num >= 10000 ? (num / 10000).toFixed(1) + 'w' : num.toString());
        return h('span', displayText) // 返回包含文本的 span
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

const loading = ref(false) // 表格加载状态
const byCountCurrentPage = ref(1)
const byCountPageSize = ref(10)

// 计算总条数 (从 orderDetail 获取)
const byCountTotal = computed(() => {
  // 如果后端直接给了总数用这个: return orderDetail.value?.countDetailsTotal || 0
  // 如果后端只给了完整列表，用列表长度:
  return orderDetail.value?.countDetailsList?.length || 0
})

// 计算当前页显示的笔数详情数据 (前端分页)
const byCountDetailDataPaginated = computed(() => {
  const list = orderDetail.value?.countDetailsList || []
  const start = (byCountCurrentPage.value - 1) * byCountPageSize.value
  const end = start + byCountPageSize.value
  return list.slice(start, end)
})

// 笔数详情分页改变处理 (不再调用 API)
const handleByCountPageChange = (page: number) => {
  byCountCurrentPage.value = page
}

// 笔数详情每页条数改变处理 (不再调用 API)
const handleByCountSizeChange = (size: number) => {
  // 如果改变每页条数时需要回到第一页
  if (byCountPageSize.value !== size) {
    byCountCurrentPage.value = 1
  }
  byCountPageSize.value = size
}

// 监听 orderDetail 变化，重置分页到第一页
watch(
  orderDetail,
  (newDetail) => {
    if (newDetail?.order_type === 1) {
      byCountCurrentPage.value = 1 // 切换订单时回到第一页
    }
    // 如果需要，可以在这里清空旧分页状态，但通常重置页码就够了
  },
  { deep: true }
)
</script>

<template>
  <Dialog v-model="localVisible" :title="'订单详情'" @close="handleClose">
    <ElTabs v-if="orderDetail && orderDetail.order_num" v-model="activeTab">
      <!-- 基础订单详情页 -->
      <ElTabPane label="订单详情" name="order">
        <Descriptions :schema="orderDetailSchema" :data="orderDetail" :column="2" border />
      </ElTabPane>

      <!-- 按笔数详情标签页 (Type 1) -->
      <ElTabPane v-if="orderDetail.order_type === 1" label="笔数详情" name="byCount">
        <Descriptions :schema="byCountDetailSchema" :data="orderDetail" :column="2" border />

        <div class="mt-20px">
          <Table
            :columns="byCountDetailTableSchema"
            :data="byCountDetailDataPaginated"
            :loading="loading"
            stripe
            :border="true"
          />
        </div>
      </ElTabPane>

      <!-- 按时间详情标签页 (Type 2) -->
      <ElTabPane v-if="orderDetail.order_type === 2" label="时间详情" name="byTime">
        <Descriptions :schema="byTimeDetailSchema" :data="orderDetail" :column="2" border />
      </ElTabPane>

      <!-- 批量下单详情标签页 (Type 3) -->
      <ElTabPane v-if="orderDetail.order_type === 3" label="批量订单详情" name="batchOrder">
        <Descriptions :schema="batchOrderDetailSchema" :data="orderDetail" :column="2" border />
      </ElTabPane>

      <!-- 闪租详情标签页 (Type 4) -->
      <ElTabPane v-if="orderDetail.order_type === 4" label="闪租详情" name="flashRent">
        <Descriptions :schema="flashRentDetailSchema" :data="orderDetail" :column="2" border />
      </ElTabPane>

      <!-- 激活详情标签页 (Type 5) -->
      <ElTabPane v-if="orderDetail.order_type === 5" label="激活详情" name="activate">
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
      </ElTabPane>
    </ElTabs>
    <div v-else>
      <p>加载订单详情中或无详情数据...</p>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="handleClose">关闭</ElButton>
      </div>
    </template>
  </Dialog>

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
</template>

<style scoped>
/* Remove .el-table style if not needed */
</style>
