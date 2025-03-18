<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchEnergyOrderList"
        :showAddButton="false"
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
          <ElTabPane label="能量详情" name="energy">
            <Descriptions :schema="energyDetailSchema" :data="energyDetail" :column="2" border />
          </ElTabPane>
        </ElTabs>
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">关闭</ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed } from 'vue'
import { dateUtil } from '@/utils/dateUtil'
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
  exportEnergyOrderApi
} from '@/api/energy_order'

// const { t } = useI18n()
const router = useRouter()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 订单详情相关
const dialogVisible = ref(false)
const activeTab = ref('order')
const orderDetail = ref<any>({})
const energyDetail = ref<any>({})

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
              onClick: () => navigateToBotList(row.botId)
            },
            () => row.botName
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
          return h('span', dateUtil(row.createTime).format('YYYY-MM-DD HH:mm:ss'))
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
          return h('span', dateUtil(row.payTime).format('YYYY-MM-DD HH:mm:ss'))
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
          return h('span', dateUtil(row.finishTime).format('YYYY-MM-DD HH:mm:ss'))
        }
      }
    },
    { field: 'remark', label: '备注', span: 24 }
  ]
  return schema
})

// 能量详情schema
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

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'orderNo',
    label: '订单号',
    width: 180
  },
  {
    field: 'tgUsername',
    label: 'TG用户名',
    width: 120,
    slots: {
      default: ({ row }) => {
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
  {
    field: 'tgNickname',
    label: 'TG用户昵称',
    width: 120
  },
  {
    field: 'botName',
    label: '机器人名称',
    width: 120,
    slots: {
      default: ({ row }) => {
        return h(
          ElLink,
          {
            type: 'primary',
            onClick: () => navigateToBotList(row.botId)
          },
          () => row.botName
        )
      }
    }
  },
  {
    field: 'orderType',
    label: '订单类型',
    width: 120
  },
  {
    field: 'energyAmount',
    label: '能量数量',
    width: 100
  },
  {
    field: 'energyValidDays',
    label: '能量有效期',
    width: 100,
    formatter: (row) => `${row.energyValidDays}天`
  },
  {
    field: 'energyCount',
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
    field: 'createTime',
    label: '创建时间',
    width: 180,
    formatter: (row) =>
      row.createTime ? dateUtil(row.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'
  },
  {
    field: 'payTime',
    label: '支付时间',
    width: 180,
    formatter: (row) => (row.payTime ? dateUtil(row.payTime).format('YYYY-MM-DD HH:mm:ss') : '-')
  },
  {
    field: 'finishTime',
    label: '完成时间',
    width: 180,
    formatter: (row) =>
      row.finishTime ? dateUtil(row.finishTime).format('YYYY-MM-DD HH:mm:ss') : '-'
  },
  {
    field: 'action',
    label: '操作',
    width: 100,
    slots: {
      default: ({ row }) => {
        return (
          <BaseButton type="primary" onClick={() => handleViewDetail(row)}>
            详情
          </BaseButton>
        )
      }
    }
  }
]

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
    field: 'orderType',
    component: 'Select' as const,
    label: '订单类型',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '标准能量包', value: 1 },
        { label: '高级能量包', value: 2 },
        { label: '超级能量包', value: 3 },
        { label: '特别定制包', value: 4 }
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
        { label: '待支付', value: 0 },
        { label: '支付中', value: 1 },
        { label: '支付成功', value: 2 },
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
    2: '支付成功',
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
const fetchEnergyOrderList = async (params: any) => {
  try {
    const response = await getEnergyOrderListApi(params)
    return response.data
  } catch (error) {
    console.error('获取能量订单列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 查看订单详情
const handleViewDetail = async (row: any) => {
  try {
    const response = await getEnergyOrderDetailApi(row.id)
    orderDetail.value = response.data.orderDetail
    energyDetail.value = response.data.energyDetail
    dialogVisible.value = true
    activeTab.value = 'order'
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
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
