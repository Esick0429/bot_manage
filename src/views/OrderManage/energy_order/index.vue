<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :action-column="actionColumn"
        :fetch-data-api="fetchEnergyOrderList"
        :showAddButton="false"
        :pagination="{
          total: totalCount
        }"
        ref="searchTableRef"
        @search="onSearch"
      >
        <!-- 自定义搜索按钮 -->
        <template #searchButtons>
          <BaseButton @click="handleExport">导出订单</BaseButton>
        </template>
      </SearchTable>

      <!-- 详情弹窗 -->
      <Dialog v-model="dialogVisible" :title="'订单详情'" width="1000px">
        <ElTabs v-model="activeTab">
          <ElTabPane label="订单详情" name="order">
            <Descriptions :schema="orderDetailSchema" :data="orderDetail" :column="2" border />
          </ElTabPane>

          <!-- 按笔数详情标签页 -->
          <ElTabPane v-if="getOrderTypeId(orderDetail) === 1" label="笔数详情" name="byCount">
            <Descriptions :schema="byCountDetailSchema" :data="energyDetail" :column="2" border />
          </ElTabPane>

          <!-- 按时间详情标签页 -->
          <ElTabPane v-if="getOrderTypeId(orderDetail) === 2" label="时间详情" name="byTime">
            <Descriptions :schema="byTimeDetailSchema" :data="energyDetail" :column="2" border />
          </ElTabPane>

          <!-- 闪租详情标签页 -->
          <ElTabPane v-if="getOrderTypeId(orderDetail) === 3" label="闪租详情" name="flashRent">
            <Descriptions :schema="flashRentDetailSchema" :data="energyDetail" :column="2" border />
          </ElTabPane>

          <!-- 批量下单详情标签页 -->
          <ElTabPane
            v-if="getOrderTypeId(orderDetail) === 4 || getOrderTypeId(orderDetail) === 0"
            label="批量订单详情"
            name="batchOrder"
          >
            <Descriptions :schema="energyDetailSchema" :data="energyDetail" :column="2" border />
          </ElTabPane>
        </ElTabs>
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>

      <!-- 交易详情弹窗 -->
      <Dialog v-model="transactionDialogVisible" :title="'交易详情'" width="1000px">
        <Descriptions
          :schema="transactionDetailSchema"
          :data="transactionDetail"
          :column="2"
          border
        />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="transactionDialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { useRouter } from 'vue-router'
import { ElButton, ElTag, ElMessage, ElTabs, ElTabPane, ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Descriptions } from '@/components/Descriptions'
// import { useI18n } from '@/hooks/web/useI18n'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import {
  getEnergyOrderListApi,
  getEnergyOrderDetailApi,
  exportEnergyOrderApi,
  getTransactionDetailApi
} from '@/api/energy_order'

// const { t } = useI18n()
const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const totalCount = ref(0)

// 订单详情相关
const dialogVisible = ref(false)
const activeTab = ref('order')
const orderDetail = ref<any>({})
const energyDetail = ref<any>({})

// 交易详情相关
const transactionDialogVisible = ref(false)
const transactionDetail = ref<any>({})

// 订单详情schema
const orderDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'orderNo', label: '订单号' },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(ElTag, { type: getStatusType(row.status), size: 'small' }, () => row.statusText)
        }
      }
    },
    { field: 'orderType', label: '订单类型' },
    { field: 'tgUserId', label: 'TG用户ID' },
    {
      field: 'tgUsername',
      label: 'TG用户名',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(
            ElLink,
            {
              type: 'primary',
              onClick: () => navigateToUserList(row.tgUserId)
            },
            () => row.tgUsername
          )
        }
      }
    },
    { field: 'tgNickname', label: 'TG用户昵称' },
    {
      field: 'botName',
      label: '机器人名称',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(
            ElLink,
            {
              type: 'primary',
              onClick: () => navigateToBotList(row.bot_id)
            },
            () => row.bot_name
          )
        }
      }
    },
    { field: 'botId', label: '机器人ID' },
    {
      field: 'createTime',
      label: '创建时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.createTime) return h('span', '-')
          return h('span', formatToDateTime(row.createTime))
        }
      }
    },
    {
      field: 'payTime',
      label: '支付时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.payTime) return h('span', '-')
          return h('span', formatToDateTime(row.payTime))
        }
      }
    },
    {
      field: 'finishTime',
      label: '完成时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.finishTime) return h('span', '-')
          return h('span', formatToDateTime(row.finishTime))
        }
      }
    },
    { field: 'remark', label: '备注', span: 24 }
  ]
  return schema
})

// 能量详情schema (适用于批量下单)
const energyDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'energyPackName', label: '能量包名称' },
    { field: 'energyAmount', label: '能量数量' },
    { field: 'energyValidDays', label: '能量有效期' },
    { field: 'energyCount', label: '笔数' },
    { field: 'unitPrice', label: '单价' },
    { field: 'totalPrice', label: '总价' },
    { field: 'paymentAddress', label: '支付地址', span: 24 },
    {
      field: 'transactionHash',
      label: '交易哈希',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.transactionHash) return h('span', '-')
          return h(
            ElLink,
            {
              href: `https://tronscan.org/#/transaction/${row.transactionHash}`,
              type: 'primary',
              target: '_blank'
            },
            () => row.transactionHash
          )
        }
      }
    }
  ]
  return schema
})

// 按笔数详情schema
const byCountDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'rentCount', label: '租用笔数' },
    { field: 'energyTrxPrice', label: '【1笔】能量TRX价格' },
    { field: 'energyUsdtPrice', label: '【1笔】能量USDT价格' }
  ]
  return schema
})

// 闪租详情schema
const flashRentDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'flashRentCount', label: '闪租笔数' },
    { field: 'flashRentPrice', label: '闪租能量价格' },
    { field: 'receivingAddress', label: '接收地址', span: 24 },
    { field: 'paymentAddress', label: '收款地址', span: 24 },
    {
      field: 'transactionHash',
      label: '交易hash',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.transactionHash) return h('span', '-')
          return h(
            ElLink,
            {
              href: `https://tronscan.org/#/transaction/${row.transactionHash}`,
              type: 'primary',
              target: '_blank'
            },
            () => row.transactionHash
          )
        }
      }
    }
  ]
  return schema
})

// 按时间详情schema
const byTimeDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'energyAmount', label: '能量数量' },
    { field: 'validityPeriod', label: '能量有效期' },
    { field: 'receivingAddress', label: '接收地址', span: 24 },
    {
      field: 'transactionHash',
      label: '能量转账hash',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.transactionHash) return h('span', '-')
          return h(
            ElLink,
            {
              href: `https://tronscan.org/#/transaction/${row.transactionHash}`,
              type: 'primary',
              target: '_blank'
            },
            () => row.transactionHash
          )
        }
      }
    }
  ]
  return schema
})

// 交易详情schema
const transactionDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    {
      field: 'transaction_hash',
      label: '交易哈希',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.transaction_hash) return h('span', '-')
          return h(
            ElLink,
            {
              href: `https://tronscan.org/#/transaction/${row.transaction_hash}`,
              type: 'primary',
              target: '_blank'
            },
            () => row.transaction_hash
          )
        }
      }
    },
    { field: 'from_address', label: '发起地址', span: 24 },
    { field: 'to_address', label: '接收地址', span: 24 },
    {
      field: 'block_details',
      label: '区块详情'
    },
    {
      field: 'transaction_status',
      label: '交易状态',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(ElTag, { type: 'success', size: 'small' }, () => row.transaction_status)
        }
      }
    },
    { field: 'validity_period', label: '有效期' },
    { field: 'energy_amount', label: '能源数量' },
    {
      field: 'create_time',
      label: '创建时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.create_time) return h('span', '-')
          return h('span', row.create_time)
        }
      }
    },
    {
      field: 'complete_time',
      label: '完成时间',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.complete_time) return h('span', '-')
          return h('span', row.complete_time)
        }
      }
    }
  ]
  return schema
})

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'order_id',
    label: '订单号',
    width: 180
  },
  {
    field: 'tg_name',
    label: 'TG用户名',
    width: 120,
    slots: {
      default: ({ row }) => {
        return h(
          ElLink,
          {
            type: 'primary',
            onClick: () => navigateToUserList(row.tg_id)
          },
          () => row.tg_name
        )
      }
    }
  },
  {
    field: 'nickname',
    label: 'TG用户昵称',
    width: 120
  },
  {
    field: 'bot_name',
    label: '机器人名称',
    minWidth: 160,
    slots: {
      default: ({ row }) => {
        return h(
          ElLink,
          {
            type: 'primary',
            onClick: () => navigateToBotList(row.bot_id)
          },
          () => row.bot_name
        )
      }
    }
  },
  {
    field: 'order_type',
    label: '订单类型',
    width: 120,
    formatter: (row) => {
      const typeMap = {
        1: '按笔数',
        2: '按时间',
        3: '闪租',
        4: '批量下单'
      }
      return typeMap[row.order_type] || '-'
    }
  },
  {
    field: 'order_amount',
    label: '订单金额',
    width: 100,
    formatter: (row) => {
      return row.order_amount + row.pay_unit
    }
  },

  {
    field: 'energy_num',
    label: '能量数量',
    width: 100,
    formatter: (row) => {
      if (!row.energy_num || row.order_type === 1) return '-'
      return row.energy_num >= 10000 ? (row.energy_num / 10000).toFixed(1) + 'w' : row.energy_num
    }
  },
  {
    field: 'energy_rent_text',
    label: '能量有效期',
    width: 100
    // formatter: (row) => `${row.energyValidDays}天`
  },
  {
    field: 'stroke_num',
    label: '笔数',
    width: 80
  },
  {
    field: 'status',
    label: '订单状态',
    width: 100,
    slots: {
      default: ({ row }) => {
        const type = getStatusType(row.status)
        const text = getStatusText(row.status)
        return h(ElTag, { type }, () => text)
      }
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'pay_time',
    label: '支付时间',
    width: 180,
    formatter: (row) => (row.pay_time ? formatToDateTime(row.pay_time) : '-')
  },
  {
    field: 'finish_time',
    label: '完成时间',
    width: 180,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time) : '-')
  }
]

const actionColumn = {
  field: 'action',
  label: '操作',
  width: 240,
  fixed: 'right',
  slots: {
    default: (data: any) => {
      const row = data.row
      return (
        <>
          <BaseButton type="primary" onClick={() => handleViewDetail(row)}>
            订单详情
          </BaseButton>
          <BaseButton type="primary" onClick={() => handleTransactionDetail(row)}>
            交易详情
          </BaseButton>
        </>
      )
    }
  }
}

// 搜索表单配置
const searchSchema = [
  {
    field: 'order_id',
    component: 'Input' as const,
    label: '订单号',
    componentProps: {
      placeholder: '请输入订单号'
    }
  },
  {
    field: 'order_type',
    component: 'Select' as const,
    label: '订单类型',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '按笔数', value: 1 },
        { label: '按时间', value: 2 },
        { label: '批量下单', value: 3 },
        { label: '闪租', value: 4 }
      ],
      placeholder: '请选择订单类型'
    }
  },
  {
    field: 'status',
    component: 'Select' as const,
    label: '订单状态',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '已完成', value: 1 },
        { label: '待支付', value: 2 },
        { label: '已取消', value: 3 }
      ],
      placeholder: '请选择订单状态'
    }
  }
]

// 获取订单状态显示类型
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const statusMap: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    1: 'info',
    2: 'success',
    3: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: number): string => {
  const statusMap = {
    1: '已完成',
    2: '待支付',
    3: '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 跳转到用户列表
const navigateToUserList = (userId: string) => {
  router.push({
    path: '/user_group/user_list',
    query: { tg_id: userId }
  })
}

// 跳转到机器人列表
const navigateToBotList = (botId: string) => {
  router.push({
    path: '/bot_manage/bot_list',
    query: { tg_bot_id: botId }
  })
}

// API 封装
const fetchEnergyOrderList = async (params: any) => {
  try {
    const response = await getEnergyOrderListApi(params)
    totalCount.value = response.data.totalCount
    return response.data
  } catch (error) {
    console.error('获取能量订单列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 获取订单类型ID (处理不同的字段名和类型转换)
const getOrderTypeId = (detail: any): number => {
  if (!detail) return 0

  // 尝试从不同可能的字段名获取订单类型
  let typeValue = 0
  if (detail.orderTypeId !== undefined) {
    typeValue = detail.orderTypeId
  } else if (detail.orderType !== undefined) {
    // 如果是字符串，尝试转换
    if (typeof detail.orderType === 'string') {
      // 提取数字部分
      if (detail.orderType === '按笔数') return 1
      if (detail.orderType === '按时间') return 2
      if (detail.orderType === '闪租') return 3
      if (detail.orderType === '批量下单') return 4

      // 尝试从字符串中提取数字
      const match = detail.orderType.match(/(\d+)/)
      if (match) {
        typeValue = parseInt(match[1], 10)
      }
    } else {
      typeValue = detail.orderType
    }
  }

  return typeValue
}

// 查看订单详情
const handleViewDetail = async (row: any) => {
  try {
    const response = await getEnergyOrderDetailApi(row.id)
    orderDetail.value = response.data.orderDetail

    // 根据订单类型设置不同的详情数据
    const orderTypeId = getOrderTypeId(response.data.orderDetail)

    // 根据订单类型设置不同的详情数据
    if (orderTypeId === 1) {
      // 按笔数
      energyDetail.value = {
        rentCount: '100',
        countPerTransaction: '1笔',
        energyTrxPrice: '5.00TRX',
        energyUsdtPrice: '1.00TRX',
        paymentAddress: 'TYsJujKoFrMLC6bdRwZ7Ji6CabQ3pARnBj',
        transactionHash: 'ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c'
      }
      activeTab.value = 'byCount'
    } else if (orderTypeId === 2) {
      // 按时间
      energyDetail.value = {
        energyAmount: '6.5W',
        validityPeriod: '1小时',
        receivingAddress: 'TBAQYwDc3pDAXMUodZK67MRCF5YNJt4qnp',
        transactionHash: '705130bcea62464850a51d58f8b47bed27c0c39a560701bccee94d9fd6cd6602'
      }
      activeTab.value = 'byTime'
    } else if (orderTypeId === 3) {
      // 闪租
      energyDetail.value = {
        flashRentCount: '1',
        flashRentPrice: '3.00trx/笔',
        receivingAddress: 'TBNDqnnZVTjHZTqyZT4xdSFJYcZnYfQGNp',
        paymentAddress: 'TYsJujKoFrMLC6bdRwZ7Ji6CabQ3pARnBj',
        transactionHash: 'ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c'
      }
      activeTab.value = 'flashRent'
    } else {
      // 批量下单或者其他类型，使用原有的能量详情
      energyDetail.value = response.data.energyDetail
      activeTab.value = 'batchOrder'
    }

    dialogVisible.value = true
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 查看交易详情
const handleTransactionDetail = async (row: any) => {
  try {
    // 尝试从API获取交易详情
    if (row.transactionHash) {
      const response = await getTransactionDetailApi(row.transactionHash)
      if (response.data) {
        transactionDetail.value = response.data
        transactionDialogVisible.value = true
        return
      }
    }

    // 如果API获取失败或者没有交易哈希，则使用模拟数据
    transactionDetail.value = {
      transaction_hash: 'b33fe10cad17bed6579ac01f94891617f0111571b2c3107bb21a70499f7207d2',
      from_address: 'TTSGZF4YqWRDZ2TT23TwcrTSxSCJfxLvMR',
      block_details: '70435110',
      to_address: 'TZ5VUwCDAUrF2Bp573R1u89SQ4bj5nk7Kw',
      transaction_status: '已完成',
      validity_period: '1天',
      energy_amount: '13.1W',
      create_time: '2025-02-24 23:55:22',
      complete_time: '2025-02-24 23:55:22'
    }
    transactionDialogVisible.value = true
  } catch (error) {
    console.error('获取交易详情失败:', error)
    ElMessage.error('获取交易详情失败')
  }
}

// 导出订单
const handleExport = async () => {
  try {
    // 获取当前搜索条件
    const params = searchTableRef.value ? (searchTableRef.value.$attrs as any) : {}
    await exportEnergyOrderApi(params)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出订单失败:', error)
    ElMessage.error('导出订单失败')
  }
}

const onSearch = (params: any) => {
  console.log('搜索参数:', params)
}

onMounted(() => {
  // 组件加载后自动调用首次查询
  searchTableRef.value?.reload()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
