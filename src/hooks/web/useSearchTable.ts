import { useTable } from './useTable'
import { useSearch } from './useSearch'
import { ref, unref, onMounted, watch } from 'vue'
import { FormSchema } from '@/components/Form'
import { TableColumn } from '@/components/Table'
import { ElMessage } from 'element-plus'

export interface SearchTableState {
  loading: boolean
  dataList: any[]
  pageSize: number
  currentPage: number
  totalCount: number
}

interface UseSearchTableConfig {
  searchSchema?: FormSchema[] // 查询表单配置
  tableColumns: TableColumn[] // 表格列配置
  fetchDataApi: (params?: any) => Promise<{ list: any[]; total?: number; totalCount?: number }>
  fetchDelApi?: () => Promise<boolean>
  immediate?: boolean
  defaultParams?: Recordable // 默认参数
  handleSearchInfoFn?: (info: Recordable) => Recordable // 处理搜索参数
  actionColumn?: TableColumn // 操作列配置
}

export const useSearchTable = (config: UseSearchTableConfig) => {
  const searchParams = ref<Recordable>(config.defaultParams || {})
  const currentRow = ref<Recordable | null>(null)

  const adaptRequestParams = (params: Recordable): Recordable => {
    const adaptedParams = { ...params }
    if (adaptedParams.currentPage !== undefined) {
      adaptedParams.current_page = adaptedParams.currentPage
      delete adaptedParams.currentPage
    }
    if (adaptedParams.pageSize !== undefined) {
      adaptedParams.page_size = adaptedParams.pageSize
      delete adaptedParams.pageSize
    }
    return adaptedParams
  }

  const adaptResponseData = (result: any): { list: any[]; total: number } => {
    const list = result.list || []
    const total = result.totalCount || result.total || 0
    return { list, total }
  }

  const { tableRegister, tableMethods, tableState } = useTable({
    immediate: false,
    fetchDataApi: async () => {
      try {
        const apiParams = buildApiParams()
        const result = await config.fetchDataApi(apiParams)
        return adaptResponseData(result)
      } catch (error) {
        console.error('Data fetch failed:', error)
        return { list: [], total: 0 }
      }
    },
    fetchDelApi: config.fetchDelApi
  })
  const { dataList, loading, total } = tableState

  const { searchRegister, searchMethods } = useSearch()

  const buildApiParams = (): Recordable => {
    const baseSearchParams = { ...unref(searchParams) }
    const currentPage = unref(tableState.currentPage)
    const pageSize = unref(tableState.pageSize)

    const searchFilters = { ...baseSearchParams }
    delete searchFilters.currentPage
    delete searchFilters.pageSize
    delete searchFilters.current_page
    delete searchFilters.page_size

    let processedFilters = searchFilters
    if (config.handleSearchInfoFn) {
      processedFilters = config.handleSearchInfoFn(searchFilters) as Recordable
    }

    const finalParams = {
      ...processedFilters,
      currentPage: currentPage,
      pageSize: pageSize
    }

    const adaptedParams = adaptRequestParams(finalParams)
    return adaptedParams
  }

  const search = async () => {
    try {
      const form = await searchMethods.getFormData()
      searchParams.value = { ...(config.defaultParams || {}), ...form }
      if (tableState.currentPage.value !== 1) {
        tableState.currentPage.value = 1
      } else {
        await tableMethods.getList()
      }
      return form
    } catch (error) {
      console.error('Search failed:', error)
      ElMessage.error('Search failed, please try again')
      return unref(searchParams)
    }
  }

  const reset = async () => {
    try {
      searchParams.value = { ...(config.defaultParams || {}) }
      await searchMethods.setValues(searchParams.value)
      if (tableState.currentPage.value !== 1) {
        tableState.currentPage.value = 1
      } else {
        await tableMethods.getList()
      }
      return unref(searchParams)
    } catch (error) {
      console.error('Reset failed:', error)
      ElMessage.error('Reset failed, please try again')
      return unref(searchParams)
    }
  }

  const loadData = () => {
    return tableMethods.getList()
  }

  const setupActionColumn = () => {
    if (config.actionColumn) {
      const columns = [...config.tableColumns]
      const hasActionColumn = columns.some((col) => col.field === 'action')
      if (!hasActionColumn) {
        columns.push(config.actionColumn)
      }
      return columns
    }
    return config.tableColumns
  }

  const init = async () => {
    try {
      if (config.searchSchema && config.searchSchema.length > 0) {
        await searchMethods.setProps({ schema: config.searchSchema })
      }
      await tableMethods.setProps({ columns: setupActionColumn() })
      if (config.immediate !== false) {
        setTimeout(() => {
          loadData()
        }, 0)
      }
    } catch (error) {
      console.error('SearchTable initialization failed:', error)
    }
  }

  const handleDelete = (row: Recordable) => {
    currentRow.value = row
    if (config.fetchDelApi) {
      return tableMethods.delList(1)
    }
    return Promise.resolve(false)
  }

  const setSearchParams = (params: Recordable) => {
    searchParams.value = { ...unref(searchParams), ...params }
    searchMethods.setValues(searchParams.value)
    return unref(searchParams)
  }

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
    currentRow,
    handleDelete,
    searchParams,
    setSearchParams,
    loading,
    dataList,
    total,
    loadData
  }
}
