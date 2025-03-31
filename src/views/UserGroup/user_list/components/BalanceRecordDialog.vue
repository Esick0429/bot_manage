<template>
  <Dialog v-model="dialogVisible" title="余额日志" width="70%">
    <!-- 筛选区域 -->
    <Search
      :schema="searchSchema"
      @search="handleSearch"
      @reset="handleReset"
      class="mb-4"
    />

    <!-- 表格区域 -->
    <Table
      :columns="tableColumns"
      :data="recordList"
      :loading="loading"
      max-height="500px"
    />

    <!-- 弹窗底部按钮 -->
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="closeDialog">关闭</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, h } from 'vue'
import { ElButton, ElMessage, ElTag } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Table, TableColumn } from '@/components/Table'
import { Search } from '@/components/Search'
import type { FormSchema } from '@/components/Form'
import { getUserBalanceRecordsApi } from '@/api/tgUser'
import { formatToDateTime } from '@/utils/dateUtil'

// ----------- Props and Emits -----------
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  accountId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['update:visible'])

// ----------- Dialog Visibility -----------
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const closeDialog = () => {
  dialogVisible.value = false
}

// ----------- State -----------
const loading = ref(false)
const recordList = ref<any[]>([])
const searchParams = ref<Recordable>({})

// ----------- Search Schema -----------
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'unit',
    label: '余额类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: 'TRX', value: 'TRX' },
        { label: 'USDT', value: 'USDT' }
      ],
      placeholder: '请选择余额类型'
    }
  },
  {
    field: 'change_type',
    label: '变更类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '收入', value: 'in' },
        { label: '支出', value: 'out' }
      ],
      placeholder: '请选择变更类型'
    }
  }
])

// ----------- Table Columns -----------
const tableColumns = ref<TableColumn[]>([
  {
    field: 'unit',
    label: '余额类型',
    width: 100
  },
  {
    field: 'change_type',
    label: '变更类型',
    width: 100,
    formatter: ( row ) => {
      if (row?.change_type === 'in') return h(ElTag, { type: 'success' }, () => '收入')
      if (row?.change_type === 'out') return h(ElTag, { type: 'danger' }, () => '支出')
      return row?.change_type
    }
  },
  {
    field: 'amount',
    label: '金额',
    width: 120,
    formatter: ( row ) => {
      const amountStr = row.amount || '0';
       if (row.change_type === 'in') {
           return h('span', { style: 'color: var(--el-color-success); font-weight: bold;' }, amountStr);
       } else if (row.change_type === 'out') {
           return h('span', { style: 'color: var(--el-color-danger); font-weight: bold;' }, amountStr);
       }
       return amountStr;
    }
  },
  {
    field: 'after_amount',
    label: '剩余金额',
    width: 150,
  },
  {
    field: 'describe',
    label: '备注',
    minWidth: 180,
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row ) => {
      return row.create_time ? formatToDateTime(row.create_time * 1000) : '-'
    }
  }
])

// ----------- Data Fetching (后端筛选) -----------
const fetchData = async () => {
  if (!props.accountId) {
    recordList.value = [];
    return;
  }

  loading.value = true

  // --- 准备 API 参数 ---
  const apiParams: { unit?: string; change_type?: string } = {};
  // 直接使用 searchParams 中的字段名，因为 API 定义中使用了它们
  if (searchParams.value?.unit) {
    apiParams.unit = searchParams.value.unit;
  }
  if (searchParams.value?.change_type) {
    apiParams.change_type = searchParams.value.change_type;
  }

  try {
    // 调用更新后的 API 函数
    const res = await getUserBalanceRecordsApi(props.accountId, apiParams);

    // 直接使用 API 返回的列表 (假设已筛选)
    if (res && res.data?.list) {
      recordList.value = res.data.list;
    } else {
      recordList.value = [];
    }

  } catch(error) {
      console.error("Error fetching balance records (global handler should show message):", error);
      recordList.value = [];
  } finally {
      loading.value = false;
  }
}

// ----------- Event Handlers for Search (调用 fetchData) -----------
const handleSearch = (data: Recordable) => {
  searchParams.value = data
  fetchData() // 重新获取数据
}

const handleReset = (data: Recordable) => {
  searchParams.value = data // data 通常是空对象或初始值
  fetchData() // 重新获取数据 (无筛选条件)
}

// ----------- Watchers (调用 fetchData) -----------
watch(
  () => [props.visible, props.accountId],
  ([visible, accountId], [prevVisible]) => {
    if (visible && !prevVisible && accountId) {
      handleReset({}) // 打开时重置筛选参数并获取初始数据
    } else if (!visible && prevVisible) {
      recordList.value = [];
      searchParams.value = {};
    }
  }
);

</script>

<style scoped>
/* Styles if needed */
</style> 