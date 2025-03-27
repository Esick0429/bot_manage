import { useTable } from './useTable'
import { useSearch } from './useSearch'
import { ref, unref, onMounted, computed, watch } from 'vue'
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
  // 查询参数
  const searchParams = ref<Recordable>(config.defaultParams || {})
  // 当前选中行
  const currentRow = ref<Recordable | null>(null)
  // 错误状态
  const hasError = ref(false)
  // 是否正在加载
  const isLoading = ref(false)
  
  // 参数适配器 - 将前端分页参数转换为后端API期望的格式
  const adaptRequestParams = (params: Recordable): Recordable => {
    // 创建一个新对象来避免修改原始对象
    const adaptedParams = { ...params }
    
    // 确保当前页码和每页数量参数存在（从tableState获取）
    if (!adaptedParams.currentPage && tableState.currentPage) {
      adaptedParams.currentPage = unref(tableState.currentPage)
      console.log('从tableState添加currentPage:', adaptedParams.currentPage)
    }
    
    if (!adaptedParams.pageSize && tableState.pageSize) {
      adaptedParams.pageSize = unref(tableState.pageSize)
      console.log('从tableState添加pageSize:', adaptedParams.pageSize)
    }
    
    // 转换分页参数名称
    if (adaptedParams.currentPage !== undefined) {
      adaptedParams.current_page = adaptedParams.currentPage
      delete adaptedParams.currentPage
    }
    
    if (adaptedParams.pageSize !== undefined) {
      adaptedParams.page_size = adaptedParams.pageSize
      delete adaptedParams.pageSize
    }
    
    console.log('适配后的请求参数:', adaptedParams)
    return adaptedParams
  }

  // 响应适配器 - 将后端API返回的数据格式转换为前端组件期望的格式
  const adaptResponseData = (result: any): { list: any[]; total: number } => {
    const list = result.list || []
    // 优先使用totalCount作为总数
    const total = result.totalCount || result.total || 0
    
    console.log('适配后的响应数据:', { list, total })
    return { list, total }
  }

  // 表格配置
  const { tableRegister, tableMethods, tableState } = useTable({
    immediate: false,
    fetchDataApi: async () => {
      hasError.value = false
      isLoading.value = true
      console.log('开始加载数据...')
      try {
        let params = unref(searchParams)
        if (config.handleSearchInfoFn) {
          params = config.handleSearchInfoFn(params)
        }
        
        // 使用参数适配器转换请求参数
        const adaptedParams = adaptRequestParams(params)

        const result = await config.fetchDataApi(adaptedParams)
        console.log('API返回结果:', result)
        
        // 使用响应适配器处理返回数据
        return adaptResponseData(result)
      } catch (error) {
        console.error('搜索操作失败:', error)
        hasError.value = true
        // 添加返回值，确保即使出错也返回一个符合类型的结果
        return {
          list: [],
          total: 0
        }
      } finally {
        isLoading.value = false
      }
    },
    fetchDelApi: config.fetchDelApi
  })
  const { dataList, loading, total } = tableState
  console.log('dataList', dataList)
  console.log('loading', loading)
  console.log('total', total)
  // 查询配置
  const { searchRegister, searchMethods } = useSearch()

  // 查询方法
  const search = async () => {
    try {
      isLoading.value = true
      console.log('开始搜索...')
      const form = await searchMethods.getFormData()
      // 确保保留分页参数
      const currentPage = unref(tableState.currentPage)
      const pageSize = unref(tableState.pageSize)
      
      searchParams.value = { 
        ...form,
        currentPage,
        pageSize
      }
      console.log('查询参数(含分页):', searchParams.value)
      
      await tableMethods.getList()
      return form
    } catch (error) {
      console.error('搜索操作失败:', error)
      ElMessage.error('搜索失败，请重试')
      return searchParams.value
    } finally {
      console.log('搜索完成')
    }
  }

  // 重置方法
  const reset = async () => {
    try {
      isLoading.value = true
      console.log('开始重置...')
      searchParams.value = config.defaultParams || {}
      await tableMethods.getList()
      return searchParams.value
    } catch (error) {
      console.error('重置操作失败:', error)
      ElMessage.error('重置失败，请重试')
      return searchParams.value
    } finally {
      console.log('重置完成')
    }
  }

  // 添加操作列
  const setupActionColumn = () => {
    if (config.actionColumn) {
      console.log('config.actionColumn', config.actionColumn)
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
    try {
      console.log('初始化SearchTable...')
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

      // 如果设置了立即加载，则加载数据
      if (config.immediate !== false) {
        console.log('即将自动加载数据...')
        setTimeout(() => {
          tableMethods.getList()
        }, 0)
      }
    } catch (error) {
      console.error('初始化搜索表格失败:', error)
    }
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
    console.log('设置参数', params)
    searchParams.value = { ...searchParams.value, ...params }
    searchMethods.setValues(searchParams.value)
    return searchParams.value
  }

  // 主动加载数据方法
  const loadData = () => {
    console.log('手动触发数据加载...')
    return tableMethods.getList()
  }

  // 自动初始化
  onMounted(() => {
    console.log('SearchTable组件已挂载，开始初始化...')
    init()
  })

  console.log('tableState', tableState)
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
    setSearchParams,
    hasError,
    loading,
    dataList,
    total,
    loadData
  }
}
