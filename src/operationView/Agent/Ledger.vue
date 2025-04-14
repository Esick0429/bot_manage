<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用SearchTable组件，提供完整功能 -->
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getAgentLedgerList"
        @search="handleSearch"
        :show-add-button="false"
      >
        <!-- 自定义搜索按钮区域 -->
        <template #searchButtons>
          <ElButton type="primary" @click="handleExport">
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </ElButton>
        </template>
      </SearchTable>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted } from 'vue'
import { ElButton, ElTag, ElMessage } from 'element-plus'
import { Icon } from '@/components/Icon'
import { SearchTable, useSearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import {
  getAgentLedgerListApi,
  exportAgentLedgerApi,
  AgentLedgerQueryParams,
  AgentLedgerItem
} from '@/api/agent/ledger'
import { ContentWrap } from '@/components/ContentWrap'
// 引用SearchTable实例
const searchTableRef = ref()

// 定义API函数调用
const getAgentLedgerList = async (params?: any): Promise<{ list: any[]; total?: number }> => {
  try {
    const res = await getAgentLedgerListApi(params)
    return {
      list: res.data.list || [],
      total: res.data.totalCount || 0
    }
  } catch (error) {
    console.error('获取代理账单列表失败:', error)
    ElMessage.error('获取代理账单列表失败')
    return {
      list: [],
      total: 0
    }
  }
}

// 导出数据API
const exportAgentLedger = async (params: AgentLedgerQueryParams) => {
  try {
    ElMessage.success('导出已开始，请稍候')
    await exportAgentLedgerApi(params)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 搜索表单配置
const searchSchema = ref<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '请输入关键字'
    }
  },
  {
    field: 'status',
    component: 'Select',
    label: '扣款状态',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: [
        { label: '全部', value: '' },
        { label: '已完成', value: 1 },
        { label: '已取消', value: 2 },
        { label: '进行中', value: 3 }
      ]
    }
  }
])

// 表格列配置
const columns = ref<TableColumn[]>([
  {
    field: 'id',
    label: '扣款ID'
  },
  // {
  //   field: 'user_id',
  //   label: '代理ID'
  // },
  {
    field: 'email',
    label: '代理信息'
  },
  {
    field: 'username',
    label: '代理名称'
  },
  {
    field: 'describe',
    label: '交易类型'
  },

  {
    field: 'amount',
    label: '金额变动',
    width: '100px',
    formatter: (row) => {
      const value = parseFloat(row.amount)
      const isOut = row.change_type === 'out'
      return (
        <span style={{ color: isOut ? 'red' : 'green' }}>
          {isOut ? '-' : '+'}
          {value} {row.unit}
        </span>
      )
    }
  },
  {
    field: 'after_amount',
    label: '交易后TRX余额'
  },
  {
    field: 'status',
    label: '扣款状态',
    formatter: (row) => {
      let type: 'success' | 'warning' | 'info' | 'danger' = 'info'
      const statusMap = {
        0: '已完成',
        1: '已完成',
        2: '已取消',
        3: '进行中'
      }
      switch (row.status) {
        case 0:
        case 1:
          type = 'success'
          break
        case 2:
          type = 'danger'
          break
        case 3:
          type = 'warning'
          break
        default:
          type = 'info'
          break
      }
      return <ElTag type={type}>{statusMap[row.status]}</ElTag>
    }
  },
  {
    field: 'order_num',
    label: '关联订单ID'
  },
  {
    field: 'create_time',
    label: '扣款时间',
    formatter: (row) => formatToDateTime(row.create_time)
  }
])

// 处理搜索
const handleSearch = (params) => {
  console.log('搜索参数:', params)
}

// 处理导出
const handleExport = async () => {
  try {
    // 获取当前搜索参数
    const params = (await searchTableRef.value?.searchMethods.getFormData()) || {}
    await exportAgentLedger(params as AgentLedgerQueryParams)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 页面加载时自动查询
onMounted(() => {
  searchTableRef.value?.reload()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
