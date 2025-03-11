<template>
  <div class="search-table-container">
    <!-- 搜索表单 -->
    <Search
      v-if="searchSchema && searchSchema.length > 0"
      :schema="searchSchema"
      @search="handleSearch"
      @reset="handleReset"
      @register="searchRegister"
      v-bind="searchProps"
    />

    <!-- 工具栏 -->
    <div class="mb-10px" v-if="$slots.toolbar || showAddButton">
      <slot name="toolbar">
        <BaseButton v-if="showAddButton" type="primary" @click="$emit('add')">
          {{ t('common.add') }}
        </BaseButton>
      </slot>
    </div>

    <!-- 表格 -->
    <Table
      v-model:pageSize="tableState.pageSize"
      v-model:currentPage="tableState.currentPage"
      :data="tableState.dataList"
      :loading="tableState.loading"
      :pagination="pagination"
      @register="tableRegister"
      v-bind="tableProps"
    >
      <template v-for="item in slotKeys" :key="item" #[item]="data">
        <slot :name="item" v-bind="data"></slot>
      </template>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useSlots, PropType, watch } from 'vue'
import { useSearchTable } from '@/hooks/web/useSearchTable'
import { useI18n } from '@/hooks/web/useI18n'
import { Search } from '@/components/Search'
import { Table } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'

const { t } = useI18n()
const slots = useSlots()

const props = defineProps({
  // 表格列配置
  columns: {
    type: Array as PropType<TableColumn[]>,
    required: true
  },
  // 搜索表单配置
  searchSchema: {
    type: Array as PropType<FormSchema[]>,
    default: () => []
  },
  // 数据加载API
  fetchDataApi: {
    type: Function as PropType<
      (params?: any) => Promise<{
        list: any[]
        total?: number
      }>
    >,
    required: true
  },
  // 删除API
  fetchDelApi: {
    type: Function as PropType<() => Promise<boolean>>,
    default: undefined
  },
  // 是否立即加载数据
  immediate: {
    type: Boolean,
    default: true
  },
  // 是否显示添加按钮
  showAddButton: {
    type: Boolean,
    default: true
  },
  // 默认查询参数
  defaultParams: {
    type: Object,
    default: () => ({})
  },
  // 分页配置
  pagination: {
    type: Object,
    default: () => ({ total: 0 })
  },
  // Search组件额外属性
  searchProps: {
    type: Object,
    default: () => ({})
  },
  // Table组件额外属性
  tableProps: {
    type: Object,
    default: () => ({})
  },
  // 操作列配置
  actionColumn: {
    type: Object as PropType<TableColumn>,
    default: undefined
  }
})

const emit = defineEmits(['add', 'search', 'reset', 'delete', 'update:searchParams'])

// 使用hook
const {
  searchRegister,
  tableRegister,
  searchMethods,
  tableMethods,
  tableState,
  search,
  reset,
  currentRow,
  handleDelete,
  searchParams,
  setSearchParams
} = useSearchTable({
  searchSchema: props.searchSchema,
  tableColumns: props.columns,
  fetchDataApi: props.fetchDataApi,
  fetchDelApi: props.fetchDelApi,
  immediate: props.immediate,
  defaultParams: props.defaultParams,
  actionColumn: props.actionColumn
})

// 搜索
const handleSearch = async () => {
  const params = await search()
  emit('search', params)
  emit('update:searchParams', params)
}

// 重置
const handleReset = async () => {
  const params = await reset()
  emit('reset', params)
  emit('update:searchParams', params)
}

// 删除
const doDelete = async (row: Recordable) => {
  const result = await handleDelete(row)
  emit('delete', row, result)
  return result
}

// 计算所有插槽名
const slotKeys = computed(() => {
  return Object.keys(slots).filter((key) => key !== 'toolbar')
})

watch(
  () => tableState.dataList,
  (val) => {
    if (val && !Array.isArray(val)) {
      console.warn('表格数据不是数组，修复中...')
      tableState.dataList = []
    }
  },
  { immediate: true, deep: true }
)


// 暴露方法
defineExpose({
  reload: tableMethods.getList,
  reset: handleReset,
  search: handleSearch,
  delete: doDelete,
  currentRow,
  tableMethods,
  searchMethods,
  tableState,
  searchParams,
  setSearchParams
})
</script>
