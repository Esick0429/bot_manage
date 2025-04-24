<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用SearchTable组件 -->
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :searchSchema="searchSchema"
        :fetchDataApi="getAgentList"
        @search="handleSearch"
        :show-add-button="false"
      />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref } from 'vue'
import { ElTag, ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@/components/Icon'
import { SearchTable } from '@/components/SearchTable'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import {
  getAgentListApi,
  updateAgentStatusApi,
  AgentQueryParams,
  AgentItem,
  UpdateAgentStatusPayload
} from '@/api/agent/list'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'

// 引用SearchTable实例
const searchTableRef = ref()

// --- API 调用封装 ---

// 获取代理列表API封装
const getAgentList = async (params?: any): Promise<{ list: AgentItem[]; total?: number }> => {
  try {
    // 直接传递 useSearchTable 处理好的参数
    const res = await getAgentListApi(params)
    // 直接返回 API 响应数据，useSearchTable 会处理 list 和 totalCount
    return res.data
  } catch (error) {
    console.error('获取代理列表失败:', error)
    ElMessage.error('获取代理列表失败')
    // 返回符合函数签名的空结构
    return { list: [], total: 0 }
  }
}

// 更新代理状态API封装
const updateAgentStatus = async (id: number | string, status: number) => {
  try {
    const payload: UpdateAgentStatusPayload = { id, status }
    await updateAgentStatusApi(payload)
    ElMessage.success(status === 1 ? '启用成功' : '禁用成功')
    searchTableRef.value?.reload()
  } catch (error) {
    console.error('更新代理状态失败:', error)
    ElMessage.error('更新代理状态失败')
  }
}

// --- SearchTable 配置 ---

// 搜索表单配置
const searchSchema = ref<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: '关键字',
    componentProps: {
      placeholder: '请输入联系方式'
    }
  },
  {
    field: 'status',
    component: 'Select',
    label: '状态',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 }
      ]
    }
  }
])

// 表格列配置
const columns = ref<TableColumn[]>([
  {
    field: 'email',
    label: '联系方式'
  },
  {
    field: 'username',
    label: '代理名称'
  },
  {
    field: 'bot_num',
    label: '机器人数量'
  },
  {
    field: 'tg_account_num',
    label: '总用户数'
  },
  {
    field: 'trx_mount',
    label: 'TRX余额'
  },
  {
    field: 'total_trx_amount',
    label: 'TRX收入'
  },
  {
    field: 'total_usdt_amount',
    label: 'USDT收入'
  },
  {
    field: 'status',
    label: '状态',
    formatter: (row: AgentItem) => {
      const status = row.status
      const isEnabled = status === 1
      const text = isEnabled ? '启用' : '禁用'
      const type: 'success' | 'danger' = isEnabled ? 'success' : 'danger'
      return <ElTag type={type}>{text}</ElTag>
    }
  },
  {
    field: 'create_time',
    label: '创建时间',
    formatter: (row: AgentItem) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    formatter: (row: AgentItem) => {
      // 检查当前状态是否为 1 (启用)
      const isEnabled = row.status === 1
      // 如果当前是启用(1)，目标状态是禁用(2)；否则目标状态是启用(1)
      const targetStatus = isEnabled ? 2 : 1
      // 根据当前状态决定按钮文字
      const buttonText = isEnabled ? '禁用' : '启用'
      // 根据当前状态决定按钮样式
      const buttonType = isEnabled ? 'danger' : 'success'
      // 根据当前状态决定确认框提示文字
      const actionText = isEnabled ? '禁用' : '启用'

      return (
        <BaseButton
          type={buttonType}
          // 点击时传递计算出的目标状态 (1 或 2)
          onClick={() => handleUpdateStatus(row.id, targetStatus, actionText)}
        >
          {buttonText}
        </BaseButton>
      )
    }
  }
])

// --- 事件处理 ---

// 处理搜索
const handleSearch = (params) => {
  console.log('搜索参数:', params)
}

// 处理状态更新按钮点击
const handleUpdateStatus = (id: number | string, status: number, actionText: string) => {
  ElMessageBox.confirm(`确定要${actionText}该代理吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await updateAgentStatus(id, status)
    })
    .catch(() => {
      ElMessage.info('操作已取消')
    })
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
