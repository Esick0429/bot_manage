<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchExchangeOrderList"
        :showAddButton="false"
        ref="searchTableRef"
        @search="onSearch"
      >
        <!-- 自定义搜索按钮 -->
        <template #searchButtons>
          <BaseButton @click="handleExport">导出订单</BaseButton>
        </template>
      </SearchTable>

      <!-- 兑换详情弹窗 -->
      <Dialog v-model="dialogVisible" :title="'兑换详情'" width="1000px">
        <Descriptions :schema="exchangeDetailSchema" :data="orderDetail" :column="2" border />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>

      <!-- 交易详情弹窗 -->
      <Dialog v-model="transactionDialogVisible" :title="'转出详情'" width="1000px">
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

      <!-- 转入详情弹窗 -->
      <Dialog v-model="transferInDialogVisible" :title="'转入详情'" width="1000px">
        <Descriptions
          :schema="transferInDetailSchema"
          :data="transferInDetail"
          :column="2"
          border
        />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="transferInDialogVisible = false">关闭</ElButton>
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
  getExchangeOrderListApi,
  getExchangeOrderDetailApi,
  exportExchangeOrderApi,
  getTransactionDetailApi,
  getTransferInDetailApi
} from '@/api/exchange_order'

// const { t } = useI18n()
const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 订单详情相关
const dialogVisible = ref(false)
const orderDetail = ref<any>({})

// 交易详情相关
const transactionDialogVisible = ref(false)
const transactionDetail = ref<any>({})

// 转入详情相关
const transferInDialogVisible = ref(false)
const transferInDetail = ref<any>({})

// 兑换详情Schema
const exchangeDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'order_id', label: '订单号' },
    { field: 'tg_bot_id', label: '机器人ID' },
    { field: 'tg_name', label: 'TG用户名' },
    { field: 'order_amount', label: '支付金额' },
    { field: 'trx_price', label: '兑换汇率' },
    {
      field: 'create_time',
      label: '创建时间',
      slots: {
        default: (row: any) => {
          if (!row || !row.create_time) return h('span', '-')
          return h('span', formatToDateTime(row.create_time * 1000))
        }
      }
    },
    { field: 'order_type', label: '订单类型', slots: {
      default: (row: any) => {
        if (!row) return h('span', '-')
        return h('span', row.order_type === 1 ? '兑换TRX' : '兑换USDT')
      }
    }},
    { field: 'bot_name', label: '机器人名称' },
    { field: 'nickname', label: 'TG用户昵称' },
    { field: 'exchange_amount', label: '兑换金额',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h('span', `${row.exchange_amount} ${row.exchange_unit}`)
        }
      }
    },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(ElTag, { type: getStatusType(row.status), size: 'small' }, () => getStatusText(row.status))
        }
      }
    },
    {
      field: 'pay_time',
      label: '支付时间',
      slots: {
        default: (row: any) => {
          if (!row || !row.pay_time) return h('span', '-')
          return h('span', formatToDateTime(row.pay_time * 1000))
        }
      }
    },
    { field: 'exchange_address', label: '兑换地址' },
    { field: 'receive_address', label: '收款地址' }
  ]
  return schema
})

// 交易详情schema
const transactionDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    {
      field: 'transaction_hash',
      label: '交易hash',
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
    { field: 'sender', label: '发送人', span: 24 },
    { field: 'receiver', label: '接收人', span: 24 },
    {
      field: 'block_details',
      label: '区块详情',
      slots: {
        default: (row: any) => {
          if (!row || !row.block_details) return h('span', '-')
          return h(
            ElLink,
            {
              href: `https://tronscan.org/#/block/${row.block_details}`,
              type: 'primary',
              target: '_blank'
            },
            () => row.block_details
          )
        }
      }
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
    { field: 'trx_amount', label: 'TRX数量' },
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

// 转入详情schema
const transferInDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    {
      field: 'transaction_hash',
      label: '交易hash',
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
    { field: 'sender', label: '发送人', span: 24 },
    { field: 'receiver', label: '接收人', span: 24 },
    {
      field: 'block_details',
      label: '区块详情',
      slots: {
        default: (row: any) => {
          if (!row || !row.block_details) return h('span', '-')
          return h(
            ElLink,
            {
              href: `https://tronscan.org/#/block/${row.block_details}`,
              type: 'primary',
              target: '_blank'
            },
            () => row.block_details
          )
        }
      }
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
    { field: 'usdt_amount', label: 'USDT数量' },
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
  // {
  //   field: 'tg_name',
  //   label: 'TG用户名',
  //   width: 120,
  //   slots: {
  //     default: ({ row }) => {
  //       return h(
  //         ElLink,
  //         {
  //           type: 'primary',
  //           onClick: () => navigateToUserList(row.tg_bot_id)
  //         },
  //         () => row.tg_name
  //       )
  //     }
  //   }
  // },
  // {
  //   field: 'nickname',
  //   label: 'TG用户昵称',
  //   width: 120
  // },
  {
    field: 'bot_name',
    label: '机器人名称',
    width: 120,
    slots: {
      default: ({ row }) => {
        return h(
          ElLink,
          {
            type: 'primary',
            onClick: () => navigateToBotList(row.tg_bot_id)
          },
          () => row.bot_name
        )
      }
    }
  },
  {
    field: 'order_amount',
    label: '支付金额',
    width: 100
  },
  {
    field: 'exchange_amount',
    label: '兑换金额',
    width: 100,
    formatter: (row) => (row.exchange_amount ? `${row.exchange_amount} ${row.exchange_unit}` : '-')
  },
  {
    field: 'trx_price',
    label: '兑换汇率',
    width: 100
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
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'pay_time',
    label: '支付时间',
    width: 180,
    formatter: (row) => (row.pay_time ? formatToDateTime(row.pay_time * 1000) : '-')
  },
  {
    field: 'finish_time',
    label: '完成时间',
    width: 180,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time * 1000) : '-')
  },
  {
    field: 'action',
    label: '操作',
    width: 330,
    slots: {
      default: ({ row }) => {
        return (
          <div>
            <BaseButton type="primary" onClick={() => handleViewDetail(row)}>
              兑换详情
            </BaseButton>
            <BaseButton type="success" onClick={() => handleTransactionDetail(row)}>
              转出详情
            </BaseButton>
            <BaseButton type="warning" onClick={() => handleTransferInDetail(row)}>
              转入详情
            </BaseButton>
          </div>
        )
      }
    }
  }
]

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
    field: 'status',
    component: 'Select' as const,
    label: '订单状态',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '已完成', value: 1 },
        { label: '失败', value: 2 },
        { label: '待支付', value: 3 }
      ],
      placeholder: '请选择订单状态'
    }
  }
]

// 获取订单状态显示类型
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const statusMap: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    1: 'success',
    2: 'danger',
    3: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: number): string => {
  const statusMap = {
    1: '已完成',
    2: '失败',
    3: '待支付'
  }
  return statusMap[status] || '未知状态'
}

// 跳转到用户列表
const navigateToUserList = (userId: string) => {
  router.push({
    path: '/user/list',
    query: { userId }
  })
}

// 跳转到机器人列表
const navigateToBotList = (botId: string) => {
  router.push({
    path: '/bot/list',
    query: { botId }
  })
}

// API 封装
const fetchExchangeOrderList = async (params: any) => {
  try {
    const response = await getExchangeOrderListApi(params)
    return response.data
  } catch (error) {
    console.error('获取兑换订单列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 查看兑换详情
const handleViewDetail = async (row: any) => {
  try {
    const response = await getExchangeOrderDetailApi(row.id)
    orderDetail.value = response.data
    dialogVisible.value = true
  } catch (error) {
    console.error('获取兑换详情失败:', error)
    ElMessage.error('获取兑换详情失败')
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
      transaction_hash: 'b33fe10cad17bed6579ac01f94891617f0111571b2c3107bb21a704997207d2',
      sender: 'TTSGZF4YqWRDZ2TT23TwcrTSxSCJfxLvMR',
      receiver: 'TZ5VUwCDAUrF2Bp573R1u89SQ4bj5nk7Kw',
      block_details: '70435203',
      transaction_status: '已完成',
      trx_amount: '176 TRX',
      create_time: '2025-02-24 23:55:22',
      complete_time: '2025-02-24 23:55:22'
    }
    transactionDialogVisible.value = true
  } catch (error) {
    console.error('获取转出详情失败:', error)
    ElMessage.error('获取转出详情失败')
  }
}

// 查看转入详情
const handleTransferInDetail = async (row: any) => {
  try {
    // 尝试从API获取转入详情
    if (row.transactionHash) {
      const response = await getTransferInDetailApi(row.transactionHash)
      if (response.data) {
        transferInDetail.value = response.data
        transferInDialogVisible.value = true
        return
      }
    }

    // 如果API获取失败或者没有交易哈希，则使用模拟数据
    transferInDetail.value = {
      transaction_hash: 'b33fe10cad17bed6579ac01f94891617f0111571b2c3107bb21a70499f7207d2',
      sender: 'TYqkhCsrs64vQ3DeGVM3UmZB7gUfZ5ZJEH',
      receiver: 'TAP7VvoVUTE1A3UBJh7kkWRDLUWUVrDLGc',
      block_details: '70435203',
      transaction_status: '已完成',
      usdt_amount: '176 USDT',
      create_time: '2025-02-24 23:55:22',
      complete_time: '2025-02-24 23:55:22'
    }
    transferInDialogVisible.value = true
  } catch (error) {
    console.error('获取转入详情失败:', error)
    ElMessage.error('获取转入详情失败')
  }
}

// 导出订单
const handleExport = async () => {
  try {
    // 获取当前搜索条件
    const params = searchTableRef.value ? (searchTableRef.value.$attrs as any) : {}
    await exportExchangeOrderApi(params)
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
