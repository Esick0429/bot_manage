<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :action-column="actionColumn"
        :fetch-data-api="fetchHostedOrderList"
        :showAddButton="false"
        ref="searchTableRef"
        @search="onSearch"
      >
        <!-- 自定义搜索按钮 -->
        <template #searchButtons>
          <BaseButton @click="handleExport">导出订单</BaseButton>
        </template>
      </SearchTable>

      <!-- 托管详情弹窗 -->
      <Dialog v-model="dialogVisible" :title="'托管详情'" width="1000px">
        <Descriptions :schema="hostedDetailSchema" :data="orderDetail" :column="2" border />
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
  getHostedOrderListApi,
  getHostedOrderDetailApi,
  exportHostedOrderApi,
  getTransactionDetailApi
} from '@/api/hosted_order'

// const { t } = useI18n()
const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 订单详情相关
const dialogVisible = ref(false)
const orderDetail = ref<any>({})

// 交易详情相关
const transactionDialogVisible = ref(false)
const transactionDetail = ref<any>({})

// 托管详情Schema
const hostedDetailSchema = computed(() => {
  const schema: DescriptionsSchema[] = [
    { field: 'order_id', label: '订单号' },
    { field: 'tg_name', label: 'TG用户名' },
    { field: 'nickname', label: 'TG用户昵称' },
    { field: 'tg_bot_id', label: '机器人ID' },
    { field: 'bot_name', label: '机器人名称' },
    {
      field: 'order_amount',
      label: '订单金额',
      slots: {
        default: (row: any) => {
          if (!row || !row.order_amount) return h('span', '-')
          return h('span', row.order_amount + row.pay_unit)
        }
      }
    },
    {
      field: 'status',
      label: '订单状态',
      slots: {
        default: (row: any) => {
          if (!row) return h('span', '-')
          return h(
            ElTag,
            { type: getStatusType(row.status), size: 'small' },
            () => row.statusText || getStatusText(row.status)
          )
        }
      }
    },
    {
      field: 'pay_amount',
      label: '支付金额',
      slots: {
        default: (row: any) => {
          if (!row || !row.pay_amount) return h('span', '-')
          return h('span', row.pay_amount + row.pay_unit)
        }
      }
    },
    {
      field: 'payType',
      label: '支付类型',
      slots: {
        default: (row: any) => {
          // if (!row || !row.payType) return h('span', '-')
          return h('span', '余额支付')
        }
      }
    },
    {
      field: 'energy_num',
      label: '能量数量',
      slots: {
        default: (row: any) => {
          if (!row || !row.energy_num) return h('span', '-')
          return h(
            'span',
            row.energy_num >= 10000 ? (row.energy_num / 10000).toFixed(1) + 'w' : row.energy_num
          )
        }
      }
    },
    { field: 'energy_rent_text', label: '能量有效期' },
    { field: 'energyCount', label: '笔数' },
    {
      field: 'txid',
      label: '交易hash',
      span: 24,
      slots: {
        default: (row: any) => {
          if (!row || !row.txid) return h('span', '-')
          return h(
            ElLink,
            {
              href: `https://tronscan.org/#/transaction/${row.txid}`,
              type: 'primary',
              target: '_blank'
            },
            () => row.txid
          )
        }
      }
    },
    { field: 'address', label: '钱包地址', span: 24 },
    {
      field: 'create_time',
      label: '创建时间',
      slots: {
        default: (row: any) => {
          if (!row || !row.create_time) return h('span', '-')
          return h('span', formatToDateTime(row.create_time))
        }
      }
    },
    {
      field: 'finish_time',
      label: '完成时间',
      slots: {
        default: (row: any) => {
          if (!row || !row.finish_time) return h('span', '-')
          return h('span', formatToDateTime(row.finish_time))
        }
      }
    }
    // {
    //   field: 'payTime',
    //   label: '支付时间',
    //   slots: {
    //     default: (row: any) => {
    //       if (!row || !row.payTime) return h('span', '-')
    //       return h('span', formatToDateTime(row.payTime))
    //     }
    //   }
    // }
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
    { field: 'from_address', label: '发送地址', span: 24 },
    { field: 'to_address', label: '接收地址', span: 24 },
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
    { field: 'validity_period', label: '有效期' },
    { field: 'energy_amount', label: '能量数量' },
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
    label: '订单号'
  },
  {
    field: 'tg_name',
    label: 'TG用户名',
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
    label: 'TG用户昵称'
  },
  {
    field: 'bot_name',
    label: '机器人名称',
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
    field: 'pay_amount',
    label: '支付金额'
  },
  {
    field: 'energy_num',
    label: '能量数量'
  },
  {
    field: 'energy_rent_text',
    label: '能量有效期'
  },
  {
    field: 'status',
    label: '订单状态',
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
    field: 'finish_time',
    label: '完成时间',
    width: 180,
    formatter: (row) => (row.finish_time ? formatToDateTime(row.finish_time) : '-')
  }
]

const actionColumn: TableColumn = {
  field: 'action',
  label: '操作',
  minWidth: 150,
  fixed: 'right',
  slots: {
    default: ({ row }) => {
      return (
        <div>
          <BaseButton type="primary" onClick={() => handleViewDetail(row)}>
            托管详情
          </BaseButton>
          <BaseButton type="success" onClick={() => handleTransactionDetail(row)}>
            交易详情
          </BaseButton>
        </div>
      )
    }
  }
}

// 搜索表单配置
const searchSchema = [
  {
    field: 'orderNo',
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
        { label: '待支付', value: 0 },
        { label: '支付中', value: 1 },
        { label: '已完成', value: 2 },
        { label: '支付失败', value: 3 },
        { label: '已取消', value: 4 }
      ],
      placeholder: '请选择订单状态'
    }
  }
]

// 获取订单状态显示类型
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const statusMap: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    0: 'warning',
    1: 'info',
    2: 'success',
    3: 'danger',
    4: 'info'
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: number): string => {
  const statusMap = {
    0: '待支付',
    1: '支付中',
    2: '已完成',
    3: '支付失败',
    4: '已取消'
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
const fetchHostedOrderList = async (params: any) => {
  try {
    const response = await getHostedOrderListApi(params)
    return response.data
  } catch (error) {
    console.error('获取托管订单列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 查看托管详情
const handleViewDetail = async (row: any) => {
  try {
    const response = await getHostedOrderDetailApi(row.id)
    orderDetail.value = response.data
    dialogVisible.value = true
  } catch (error) {
    console.error('获取托管详情失败:', error)
    ElMessage.error('获取托管详情失败')
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
    await exportHostedOrderApi(params)
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
