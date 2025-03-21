<template>
  <Dialog v-model="dialogVisible" title="群发记录" width="1200px">
    <SearchTable
      :columns="tableColumns"
      :search-schema="searchSchema"
      :fetch-data-api="fetchMassSendRecords"
      ref="searchTableRef"
      :default-params="defaultParams"
      :pagination="{ total: 0 }"
      :show-add-button="false"
    >
      <!-- 不需要添加按钮，可以根据需要添加其他工具栏内容 -->
      <template #searchButtons>
        <!-- 可以在这里添加额外按钮 -->
      </template>
      
      <!-- 自定义发送类型列 -->
      <template #send_type="{ row }">
        <ElTag :type="row.send_type === 'all' ? 'success' : row.send_type === 'active' ? 'warning' : 'info'">
          {{ formatSendType(row.send_type) }}
        </ElTag>
      </template>
      
      <!-- 自定义消息类型列 -->
      <template #message_type="{ row }">
        <ElTag :type="row.message_type === 'text' ? 'primary' : row.message_type === 'image' ? 'success' : 'warning'">
          {{ formatMessageType(row.message_type) }}
        </ElTag>
      </template>
      
      <!-- 自定义操作列 -->
      <template #action="{ row }">
        <ElButton type="primary" link @click="viewDetail(row)">查看详情</ElButton>
      </template>
    </SearchTable>

    <!-- 详情弹窗 -->
    <Dialog v-model="detailDialogVisible" title="群发详情" width="600px" append-to-body>
      <Descriptions :schema="detailSchema" :data="currentRecord" :column="1" border />
      <ElDivider content-position="center">发送结果统计</ElDivider>
      <div class="flex justify-around">
        <div class="text-center">
          <div class="text-xl font-bold">{{ currentRecord.total_count || 0 }}</div>
          <div class="text-gray-500">总数量</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-success">{{ currentRecord.success_count || 0 }}</div>
          <div class="text-gray-500">成功数量</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-danger">{{ currentRecord.total_count - currentRecord.success_count || 0 }}</div>
          <div class="text-gray-500">失败数量</div>
        </div>
      </div>
      <ElDivider content-position="center">消息内容</ElDivider>
      <div class="bg-gray-100 p-4 rounded">
        <div v-if="currentRecord.message_type === 'text'">{{ currentRecord.content }}</div>
        <div v-else-if="currentRecord.message_type === 'image'" class="text-center">
          <ElImage :src="currentRecord.content" style="max-width: 100%; max-height: 300px" />
        </div>
        <div v-else>{{ currentRecord.content }}</div>
      </div>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits, defineExpose, onMounted } from 'vue'
import { ElTag, ElButton, ElDivider, ElImage, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Descriptions } from '@/components/Descriptions'
import { SearchTable } from '@/components/SearchTable'
import type { DescriptionsSchema } from '@/components/Descriptions'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { formatToDateTime } from '@/utils/dateUtil'
import { getMassSendRecordsApi, getMassSendRecordDetailApi } from '@/api/tgUser'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  botList: {
    type: Array as () => Array<{label: string, value: number|string}>,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 机器人选项
const botOptions = computed<Array<{label: string, value: number|string}>>(() => props.botList)

// SearchTable引用
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)

// 默认查询参数
const defaultParams = reactive({
  bot_id: undefined,
  date_range: []
})

// 搜索表单配置
const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'bot_id',
    component: 'Select',
    label: '机器人',
    colProps: { span: 6 },
    componentProps: {
      options: botOptions.value,
      placeholder: '请选择机器人',
      clearable: true
    }
  },
  {
    field: 'date_range',
    component: 'DatePicker',
    label: '发送时间',
    colProps: { span: 8 },
    componentProps: {
      type: 'daterange',
      rangeSeparator: '至',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      valueFormat: 'YYYY-MM-DD'
    }
  }
])

// 表格列配置
const tableColumns: TableColumn[] = [
  {
    field: 'id',
    label: 'ID',
    width: 80
  },
  {
    field: 'bot_name',
    label: '机器人',
    width: 120
  },
  {
    field: 'send_type',
    label: '发送类型',
    width: 100,
    slots: { default: 'send_type' as any }
  },
  {
    field: 'message_type',
    label: '消息类型',
    width: 100,
    slots: { default: 'message_type' as any }
  },
  {
    field: 'content',
    label: '消息内容',
    showOverflowTooltip: true
  },
  {
    field: 'status',
    label: '状态',
    width: 80,
    formatter: (row) => row.status === 'success' ? '成功' : '失败'
  },
  {
    field: 'total_count',
    label: '总数量',
    width: 90
  },
  {
    field: 'success_count',
    label: '成功数量',
    width: 90
  },
  {
    field: 'created_at',
    label: '发送时间',
    width: 180
  },
  {
    field: 'action',
    label: '操作',
    width: 120,
    fixed: 'right',
    slots: { default: 'action' as any }
  }
]

// 详情相关
const detailDialogVisible = ref(false)
const currentRecord = ref<Record<string, any>>({})
const detailSchema = computed<DescriptionsSchema[]>(() => [
  { field: 'id', label: '记录ID' },
  { field: 'bot_name', label: '机器人' },
  { field: 'send_type_text', label: '发送类型' },
  { field: 'message_type_text', label: '消息类型' },
  { field: 'created_at', label: '发送时间' },
  { field: 'sender', label: '发送人' }
])

// 格式化发送类型
const formatSendType = (type: string) => {
  const typeMap: Record<string, string> = {
    all: '全部用户',
    active: '活跃用户',
    new: '新用户'
  }
  return typeMap[type] || type
}

// 格式化消息类型
const formatMessageType = (type: string) => {
  const typeMap: Record<string, string> = {
    text: '文本消息',
    image: '图片消息',
    video: '视频消息'
  }
  return typeMap[type] || type
}

// API封装 - 获取群发记录
const fetchMassSendRecords = async (params: any) => {
  try {
    // 处理查询参数
    const queryParams: any = {
      ...params,
      pageSize: params.pageSize || 10,
      currentPage: params.currentPage || 1
    }
    
    // 处理日期范围
    if (params.date_range && params.date_range.length === 2) {
      queryParams.start_date = params.date_range[0]
      queryParams.end_date = params.date_range[1]
      // 删除日期范围参数，避免传递给后端API
      delete queryParams.date_range
    }
    
    // 调用API
    const response = await getMassSendRecordsApi(queryParams)
    return {
      list: response.data.list || [],
      total: response.data.total || 0
    }
  } catch (error) {
    console.error('获取群发记录失败:', error)
    ElMessage.error('获取记录失败')
    return { list: [], total: 0 }
  }
}

// 查看详情
const viewDetail = async (row: any) => {
  try {
    const response = await getMassSendRecordDetailApi(row.id)
    currentRecord.value = {
      ...response.data,
      send_type_text: formatSendType(response.data.send_type),
      message_type_text: formatMessageType(response.data.message_type)
    }
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取详情失败')
    console.error('获取群发记录详情失败:', error)
  }
}

// 打开弹窗方法
const open = () => {
  dialogVisible.value = true
  // 在下一个事件循环中重新加载数据，确保组件已经完全挂载
  setTimeout(() => {
    searchTableRef.value?.reload()
  }, 0)
}

// 暴露方法给父组件
defineExpose({
  open
})
</script> 