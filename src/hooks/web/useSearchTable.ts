import { useTable } from './useTable'
import { useSearch } from './useSearch'
import { ref, unref, onMounted } from 'vue'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'

interface UseSearchTableConfig {
  searchSchema?: FormSchema[] // 查询表单配置
  tableColumns: TableColumn[] // 表格列配置
  fetchDataApi: (params?: any) => Promise<{
    list: any[]
    total?: number
  }>
  fetchDelApi?: () => Promise<boolean>
  immediate?: boolean
  defaultParams?: Recordable // 默认参数
  handleSearchInfoFn?: (info: Recordable) => Recordable // 处理搜索参数
  actionColumn?: TableColumn // 操作列配置
}

export const useSearchTable = (config: UseSearchTableConfig) => {
  // 查询参数
  const searchParams = ref(config.defaultParams || {})
  // 当前选中行
  const currentRow = ref<Recordable | null>(null)

  // 表格配置
  const { tableRegister, tableMethods, tableState } = useTable({
    immediate: config.immediate,
    fetchDataApi: async () => {
      // 处理查询参数
      let params = unref(searchParams)
      if (config.handleSearchInfoFn) {
        params = config.handleSearchInfoFn(params)
      }
      // 合并查询参数
      return await config.fetchDataApi(params)
    },
    fetchDelApi: config.fetchDelApi
  })

  // 查询配置
  const { searchRegister, searchMethods } = useSearch()

  // 查询方法
  const search = async () => {
    const form = await searchMethods.getFormData()
    searchParams.value = form
    await tableMethods.getList()
    return form
  }

  // 重置方法
  const reset = async () => {
    searchParams.value = config.defaultParams || {}
    await tableMethods.getList()
    return searchParams.value
  }

  // 添加操作列
  const setupActionColumn = () => {
    if (config.actionColumn) {
      const columns = [...config.tableColumns]
      // 检查是否已经有操作列
      const hasActionColumn = columns.some((col) => col.field === 'action')
      if (!hasActionColumn) {
        columns.push(config.actionColumn)
      }
      return columns
    }
    return config.tableColumns
  }

  // 初始化
  const init = async () => {
    // 设置查询表单
    if (config.searchSchema && config.searchSchema.length > 0) {
      await searchMethods.setProps({
        schema: config.searchSchema
      })
    }

    // 设置表格列
    await tableMethods.setProps({
      columns: setupActionColumn()
    })
  }

  // 删除行
  const handleDelete = (row: Recordable) => {
    currentRow.value = row
    if (config.fetchDelApi) {
      return tableMethods.delList(1)
    }
    return Promise.resolve(false)
  }

  // 设置参数
  const setSearchParams = (params: Recordable) => {
    searchParams.value = { ...searchParams.value, ...params }
    return searchParams.value
  }

  // 自动初始化
  onMounted(() => {
    init()
  })

  return {
    searchRegister,
    tableRegister,
    searchMethods,
    tableMethods,
    tableState,
    search,
    reset,
    init,
    currentRow,
    handleDelete,
    searchParams,
    setSearchParams
  }
}
