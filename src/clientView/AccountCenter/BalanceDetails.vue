<template>
  <div class="balance-details-container p-5">
    <ElCard class="box-card">
      <SearchTable
        ref="searchTableRef"
        :columns="tableColumns"
        :search-schema="searchSchema"
        :fetch-data-api="getListApi"
        :immediate="true"
      >
        <!-- Slot for Type column rendering -->
        <template #type="{ row }">
          <ElTag :type="getRecordTypeTagType(row.describe)">
            {{ row.describe }}
          </ElTag>
        </template>

        <!-- Optional: Slot for Amount column if needed for complex styling -->
        <!--
        <template #amount="{ row }">
          <span :class="row.change_type === 'in' ? 'text-green-600' : 'text-red-600'">
            {{ row.change_type === 'in' ? '+' : '-' }}{{ row.amount }} {{ row.unit }}
          </span>
        </template>
        -->
      </SearchTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElCard, ElTag } from 'element-plus'
import { SearchTable } from '@/components/SearchTable'
import { getBalanceDetailListApi } from '@/api/credit/record'
import { useSearchTable } from '@/hooks/web/useSearchTable'
// import { formatTime } from '@/utils/time'; // TODO: 确认 formatTime 函数路径和用法, 暂时移除

// --- Status/Type Options ---
// These options are for the search filter, map them to your actual data types
const recordTypeOptions = ref([
  { label: '全部', value: '' },
  { label: '系统退款', value: 'refund' }, // TODO: 根据后端实际接受的查询值调整 value
  { label: '充值消费', value: 'expense' }, // TODO: 根据后端实际接受的查询值调整 value
  { label: '充值', value: 'recharge' } // TODO: 根据后端实际接受的查询值调整 value
  // Add other types as needed
])

// --- Search Schema ---
const searchSchema = ref([
  {
    field: 'describe', // TODO: 确认搜索字段是否为 describe
    label: '状态查询:',
    component: 'Select' as const,
    componentProps: {
      placeholder: '请选择状态',
      options: recordTypeOptions.value,
      style: { width: '150px' }
    }
  },
  {
    field: 'createTimeRange', // TODO: 确认后端接收的时间范围参数名
    label: '时间:',
    component: 'DatePicker' as const,
    componentProps: {
      type: 'daterange',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      valueFormat: 'YYYY-MM-DD' // TODO: 确认后端需要的时间格式
    }
  }
])

// --- Table Columns ---
const tableColumns = ref([
  { field: 'order_num', label: '订单号' },
  {
    field: 'describe', // 对应 describe
    label: '类型'
  },
  { field: 'product_name', label: '产品' }, // TODO: 确认接口是否返回 product 字段
  { field: 'username', label: '用户名' },
  {
    field: 'amount',
    label: '金额',

    formatter: (row: any) => {
      // TODO: 根据 change_type 决定符号，并添加单位
      const sign = row.change_type === 'out' ? '-' : '+'
      return `${sign}${row.amount} ${row.unit || ''}`
    }
  },
  {
    field: 'after_amount',
    label: '余额',
    formatter: (row: any) => `${row.after_amount} ${row.unit || ''}`
  },
  {
    field: 'create_time',
    label: '创建时间',
    formatter: (row: any) => {
      // 格式化时间戳 (秒 -> 毫秒)
      // TODO: 替换为项目统一的时间格式化工具函数
      try {
        return new Date(row.create_time * 1000).toLocaleString()
      } catch (e) {
        return row.create_time // Fallback
      }
    }
  }
])

// --- Helper function for Tag Type ---
// TODO: 确认 describe 字段的所有可能值
function getRecordTypeTagType(type: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (type) {
    case '系统退款': // TODO: 确认值
      return 'danger'
    case '充值消费': // 确认值
      return 'warning'
    case '充值': // TODO: 确认值
      return 'success'
    default:
      return 'info'
  }
}

// --- API Fetch Function ---
const getListApi = async (params: any) => {
  const backendParams = { ...params }
  console.log('Request Params:', backendParams)

  try {
    const res = await getBalanceDetailListApi(backendParams)
    console.log('API Response:', res)

    const responseData = res as any // Keep assertion for now

    // Check and access data inside the 'data' property
    if (responseData && responseData.data && responseData.data.list) {
      return {
        list: responseData.data.list, // Access data.list
        total:
          responseData.data.totalCount ||
          (responseData.data.pager ? responseData.data.pager.totalCount : 0) // Access data.totalCount / data.pager
      }
    } else {
      // Handle cases where 'data' or 'data.list' is missing
      console.error('Invalid API response structure or missing data.list:', responseData)
      return { list: [], total: 0 }
    }
  } catch (error) {
    console.error('Failed to fetch balance details:', error)
    return { list: [], total: 0 }
  }
}

const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// Initialize useSearchTable hook
useSearchTable({
  fetchDataApi: getListApi,
  tableColumns: tableColumns.value, // Pass .value here as config
  searchSchema: searchSchema.value, // Pass .value here as config
  immediate: true
})
</script>

<style lang="less" scoped>
.balance-details-container {
  // Use p-5 from template
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

// Optional: Add styles for amount coloring if using the slot

/*
.text-green-600 {
    color: #059669;
}
.text-red-600 {
    color: #dc2626;
}
*/
</style>
