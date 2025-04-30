<template>
  <ElCard>
    <SearchTable
      ref="searchTableRef"
      :columns="tableColumns"
      :action-column="actionColumn"
      :search-schema="searchSchema"
      :fetch-data-api="getListApi"
      :show-add-button="false"
    />
  </ElCard>

  <!-- Use the new DetailDialog component -->
  <DetailDialog v-model="dialogVisible" :row-data="selectedRow" />
</template>

<script setup lang="tsx">
import { ref, computed, onActivated } from 'vue'
import { ElTag, ElCard, ElMessage } from 'element-plus'
import { SearchTable } from '@/components/SearchTable' // Adjust path if needed
import { BaseButton } from '@/components/Button'
import DetailDialog from './components/DetailDialog.vue'
import { Table, TableColumn } from '@/components/Table'
import { getUserBatchRecordListApi } from '@/api/credit/record'
import type { UserBatchRecordListParams } from '@/api/credit/record/types' // 导入参数类型
import { formatToDateTime } from '@/utils/dateUtil' // 导入格式化工具
// 导入共享的映射函数
import { getProductTypeText, getPaymentMethodText, getStatusInfo } from '@/utils/mappers'

// 定义 ref
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// --- Dialog State ---
const dialogVisible = ref(false)
const selectedRow = ref<any>(null)

// --- 定义新的状态选项 (基于映射) ---
const searchStatusOptions = ref([
  { label: '全部', value: '' },
  { label: getStatusInfo(1).text, value: 1 },
  { label: getStatusInfo(2).text, value: 2 },
  { label: getStatusInfo(3).text, value: 3 }
])

// --- Search Schema ---
const searchSchema = ref([
  {
    field: 'status',
    label: '状态:',
    component: 'Select' as const,
    componentProps: {
      placeholder: '请选择状态',
      options: searchStatusOptions.value,
      style: { width: '150px' }
    }
  },
  {
    field: 'createTime',
    label: '时间:',
    component: 'DatePicker' as const,
    componentProps: {
      type: 'daterange',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      valueFormat: 'YYYY-MM-DD'
    }
  }
])

// --- Table Columns ---
const tableColumns = ref<TableColumn[]>([
  { field: 'order_num', label: '订单号', width: 150 },
  { field: 'product_id', label: '产品ID', minWidth: 150 },
  {
    field: 'price',
    label: '售价',
    width: 100,
    formatter: (_, __, cellValue) => `${cellValue} USDT`
  },
  {
    field: 'agent_active_cost',
    label: '成本价',
    width: 100,
    formatter: (_, __, cellValue) => `${cellValue} USDT`
  },
  {
    field: 'sale_amount',
    label: '支付金额',
    width: 100,
    formatter: (_, __, cellValue) => `${cellValue} USDT`
  },
  {
    field: 'agent_profit',
    label: '利润',
    width: 100,
    formatter: (_, __, cellValue) => `${cellValue} USDT`
  },
  {
    field: 'product_type',
    label: '充值类型',
    width: 100,
    formatter: (_, __, cellValue) => getProductTypeText(cellValue)
  },
  { field: 'total_num', label: '号码数量', width: 100 },
  { field: 'success_num', label: '成功数量', width: 100 },
  { field: 'tg_name', label: 'TG用户名', width: 120 },
  {
    field: 'pay_type',
    label: '支付方式',
    width: 100,
    formatter: (_, __, cellValue) => getPaymentMethodText(cellValue)
  },
  {
    field: 'status',
    label: '状态',
    width: 100,
    formatter: (_, __, cellValue) => getStatusInfo(cellValue).text
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (_, __, cellValue) => formatToDateTime(cellValue)
  }
])

const actionColumn = computed(() => ({
  field: 'action',
  label: '操作',
  width: 180,
  fixed: 'right' as const,
  slots: {
    default: (data: any) => {
      const row = data.row
      return (
        <>
          <BaseButton type="primary" onClick={() => handleView(row)} class="mr-2">
            查看
          </BaseButton>
          <BaseButton type="success" onClick={() => handleExport(row)}>
            导出
          </BaseButton>
        </>
      )
    }
  }
}))

// 包装 API 调用以适配 SearchTable
const getListApi = async (params: any) => {
  // 直接使用 SearchTable 传递的参数，内部 hook 会处理转换
  const apiParams = {
    ...params,
    start_date: params.createTime?.[0],
    end_date: params.createTime?.[1]
  }
  // 删除多余的 createTime 数组
  delete apiParams.createTime

  try {
    // getUserBatchRecordListApi 现在应该能接收包含 page, pageSize 的对象
    const res = await getUserBatchRecordListApi(apiParams)
    // 从响应中提取 list 和 total，根据实际响应结构调整 total 的路径
    return {
      list: res.data?.list || [],
      total: res.data?.totalCount || 0 // 使用 res.data?.totalCount
    }
  } catch (error) {
    console.error('获取充值记录失败:', error)
    ElMessage.error('获取充值记录失败')
    return { list: [], total: 0 } // 出错时返回空数据
  }
}

// --- Action Handlers ---
function handleView(row: any) {
  console.log('View row:', row)
  selectedRow.value = row
  dialogVisible.value = true
}

function handleExport(row: any) {
  console.log('Export row:', row)
  ElMessage.info('导出功能待实现')
}

// --- 使用 onActivated 钩子 ---
onActivated(() => {
  // 当组件从缓存中激活时，调用 SearchTable 的 reload 方法
  // TODO: 标记修改 - 确认 SearchTable 实例暴露了 reload 方法
  searchTableRef.value?.reload() // 修改为调用 reload
})
</script>

<style lang="less" scoped>
.topup-data-container {
  // Using p-5 from template for padding
}

:deep(.el-link) {
  font-size: 12px;
}
</style>
