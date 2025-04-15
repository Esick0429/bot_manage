<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用 SearchTable 组件 -->
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchData"
        :table-props="{ rowKey: 'id' }"
        @add="handleAdd"
      >
        <!-- 搜索按钮插槽 -->
        <template #searchButtons>
          <ElButton type="success" @click="handleBatchImport">
            <Icon icon="ep:upload" class="mr-5px" />
            批量导入
          </ElButton>
          <!-- 添加导出模版按钮 -->
          <ElButton type="primary" plain @click="handleExportTemplate">
            <Icon icon="ep:download" class="mr-5px" />
            下载模版
          </ElButton>
        </template>
        <!-- 工具栏插槽 -->
        <template #toolbar>
          <ElButton type="primary" @click="handleAdd">
            <Icon icon="ep:plus" class="mr-5px" />
            新增地址
          </ElButton>
          <ElButton type="danger" @click="handleBatchDelete">
            <Icon icon="ep:delete" class="mr-5px" />
            批量删除
          </ElButton>
        </template>

        <!-- 操作列内容通过 columns formatter 定义 -->
      </SearchTable>

      <!-- 表单弹窗 (保持不变) -->
      <!-- <TrxAddressForm ref="formRef" @success="handleSuccess" /> -->

      <!-- 新增地址弹窗 (多行文本) -->
      <Dialog v-model="addDialogVisible" title="新增地址" width="500px" max-height="300px">
        <Form :schema="addFormSchema" @register="addFormRegister" label-position="top" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="addDialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="submitAddAddresses" :loading="submitting"
              >确定</ElButton
            >
          </div>
        </template>
      </Dialog>

      <!-- 批量导入弹窗 (保持不变) -->
      <Dialog v-model="batchImportVisible" title="批量导入地址" width="500px" max-height="200px">
        <Form :schema="importFormSchema" @register="importFormRegister" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="batchImportVisible = false">取消</ElButton>
            <ElButton type="primary" @click="submitBatchImport" :loading="submitting"
              >确定</ElButton
            >
          </div>
        </template>
      </Dialog>

      <!-- 绑定代理弹窗 (重新添加) -->
      <Dialog
        v-model="bindDialogVisible"
        title="绑定代理"
        width="500px"
        max-height="300px"
        @open="getAgentList"
      >
        <Form :schema="bindFormSchema" @register="bindFormRegister" :isCol="true" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="bindDialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="submitBindAgent" :loading="submitting">确定</ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, nextTick } from 'vue'
import {
  ElButton,
  ElMessageBox,
  ElMessage,
  ElTag
  // 移除 ElTable, ElTableColumn, ElPagination
} from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Icon } from '@/components/Icon'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form' // 移除 UploadFile
// import { Search } from '@/components/Search' // 移除
import { useForm } from '@/hooks/web/useForm'
// import { useSearch } from '@/hooks/web/useSearch' // 移除
import { formatToDateTime } from '@/utils/dateUtil'
// import TrxAddressForm from './components/TrxAddressForm.vue' // Commented out
import { BaseButton } from '@/components/Button'
import { SearchTable } from '@/components/SearchTable' // 引入
import type { TableColumn } from '@/components/Table' // 引入
import { downloadByData } from '@/utils/download' // Revert import path

import {
  getTrxAddressListApi,
  createTrxAddressApi, // 需要 add API
  updateTrxAddressApi, // 需要 update API (用于修改/绑定/解绑)
  deleteTrxAddressApi,
  batchDeleteTrxAddressApi,
  // updateTrxAddressStatusApi,
  // bindAgentApi,
  batchImportTrxAddressApi,
  exportAddressModuleApi,
  getAgentListApi
} from '@/api/marketing/trx_address'

// Separate imports for clarity

// 表格和表单引用
// const tableRef = ref() // 移除
const formRef = ref() // 地址表单
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null) // SearchTable 引用
const submitting = ref(false)
const batchImportVisible = ref(false)
const addDialogVisible = ref(false) // 新增弹窗
const bindDialogVisible = ref(false) // 绑定弹窗
const currentBindAddress = ref<any>(null) // 当前操作地址 (用于绑定/解绑)
const agentList = ref<Array<{ label: string; value: number | string }>>([])

// 使用表单Hook - 导入表单
const { formRegister: importFormRegister, formMethods: importFormMethods } = useForm()

// 使用表单Hook - 新增表单
const { formRegister: addFormRegister, formMethods: addFormMethods } = useForm()

// 使用表单Hook - 绑定代理表单
const { formRegister: bindFormRegister, formMethods: bindFormMethods } = useForm()

// 表格列配置 - 根据实际 API 响应调整字段名
const columns = ref<TableColumn[]>([
  {
    field: 'selection',
    type: 'selection',
    width: '55px'
  },
  {
    field: 'id',
    label: '序号',
    width: '80px'
  },
  {
    field: 'address',
    label: 'TRX收款地址',
    minWidth: '240px'
  },
  {
    field: 'username', // 使用 API 返回的 username
    label: '所属代理',
    minWidth: '180px',
    formatter: (row) => (row.username || row.email ? `${row.username} (${row.email})` : '-')
  },
  {
    field: 'create_by', // 使用 API 返回的 create_by
    label: '创建人',
    width: '120px',
    formatter: (row) => row.create_by || '-' // 显示创建人
  },
  {
    field: 'user_id', // 使用 API 返回的 user_id
    label: '状态',
    width: '100px',
    formatter: (row) => {
      const isBound = !!row.user_id && row.user_id > 0 // 使用 user_id 判断
      return isBound ? <ElTag type="success">已绑定</ElTag> : <ElTag type="info">未绑定</ElTag>
    }
  },
  {
    field: 'create_time', // 使用 API 返回的 create_time
    label: '创建时间',
    width: '180px',
    formatter: (row) => formatToDateTime(row.create_time * 1000) // 假设是秒级时间戳
  },
  {
    field: 'update_time', // 使用 API 返回的 update_time
    label: '修改时间',
    width: '180px',
    formatter: (row) => formatToDateTime(row.update_time * 1000) // 假设是秒级时间戳
  },
  // 操作列 - 更新条件判断
  {
    label: '操作',
    field: 'action',
    width: '200px',
    fixed: 'right',
    formatter: (row) => {
      const isBound = !!row.user_id && row.user_id > 0 // 使用 user_id 判断
      return (
        <>
          {isBound ? (
            <BaseButton type="warning" onClick={() => handleUnbind(row)}>
              解绑
            </BaseButton>
          ) : (
            <BaseButton type="success" onClick={() => handleBind(row)}>
              绑定
            </BaseButton>
          )}
          {/* <BaseButton type="primary" onClick={() => handleEdit(row)}>修改</BaseButton> */}{' '}
          {/* Commented out Edit button */}
          <BaseButton type="danger" onClick={() => handleDelete(row)}>
            删除
          </BaseButton>
        </>
      )
    }
  }
])

// 搜索项配置 - 移除状态下拉框，只保留关键字
const searchSchema = reactive<FormSchema[]>([
  {
    field: 'query',
    component: 'Input',
    label: '关键字：',
    componentProps: {
      placeholder: 'TRX地址/邮箱',
      clearable: true
    }
  }
  // Removed status dropdown
])

// 数据获取函数，供 SearchTable 使用
const fetchData = async (params) => {
  try {
    // 直接将 useSearchTable 处理后的参数传递给 API
    const res = await getTrxAddressListApi(params)
    // 直接返回 API 的原始响应，useSearchTable 会处理 list 和 totalCount
    return res.data
  } catch (error) {
    console.error('获取地址列表失败:', error)
    ElMessage.error('获取地址列表失败')
    // 返回一个符合 useSearchTable 期望的空结构
    return { list: [], totalCount: 0 }
  }
}

// --- Agent List Loading ---
const getAgentList = async () => {
  try {
    // Pass empty object {} as parameter, common for list APIs
    const res = await getAgentListApi() // <--- Pass empty object
    if (res && res.data) {
      agentList.value = res.data.map((agent: any) => ({
        label: `${agent.username} ${agent.email ? `(${agent.email})` : ''}`,
        value: agent.user_id
      }))
      console.log('Agent list loaded:', agentList.value)
    } else {
      console.error('Failed to parse agent list from API response:', res)
      agentList.value = []
    }
  } catch (error) {
    console.error('获取代理列表失败:', error)
    ElMessage.error('获取代理列表失败')
    agentList.value = []
  }
}

// Call after definition
getAgentList()

// 刷新表格方法
const reloadTable = (resetPage = true) => {
  searchTableRef.value?.reload() // 调用 SearchTable 的 reload
}

// 新增地址
const handleAdd = () => {
  addDialogVisible.value = true
  nextTick(() => {
    addFormMethods.setValues({ addresses: '' })
  })
}

// 编辑地址 - 简化传递给表单的数据
// const handleEdit = (row: any) => {
//   // Assuming TrxAddressForm primarily edits the address or related info
//   // Pass only necessary data, typically the ID for lookup and current values
//   formRef.value?.open({
//     mode: 'edit',
//     data: {
//       id: row.id,
//       address: row.address
//       // Pass other fields like user_id or username if the form needs them
//     }
//   })
// }

// 批量导入按钮点击
const handleBatchImport = () => {
  batchImportVisible.value = true
  // 重置表单状态
  nextTick(() => {
    importFormMethods.setValues({ file: [] }) // 清空已上传文件列表
  })
}

// 提交批量导入
const importFormSchema = reactive<FormSchema[]>([
  {
    field: 'file',
    label: '选择文件',
    component: 'Upload',
    componentProps: {
      limit: 1,
      accept: '.xlsx,.xls,.csv',
      autoUpload: false,
      multiple: false,
      // 添加 onExceed 处理
      onExceed: () => {
        ElMessage.warning('只能上传一个文件')
      },
      // 添加 slots 以自定义按钮和提示
      slots: {
        default: () => <BaseButton type="primary">选择文件</BaseButton>,
        tip: () => (
          <div class="el-upload__tip text-red">请上传 .xlsx, .xls 或 .csv 格式的文件。</div>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '请选择上传文件', trigger: 'blur' }]
    },
    colProps: {
      span: 24
    }
  }
])
const submitBatchImport = async () => {
  try {
    const formDataRaw = await importFormMethods.getFormData()
    const fileList = formDataRaw.file

    if (!fileList || fileList.length === 0) {
      ElMessage.warning('请先选择文件')
      return
    }

    const file = fileList[0]?.raw
    if (!file) {
      ElMessage.error('无法获取文件对象')
      return
    }

    const formData = new FormData()
    formData.append('file', file) // 将文件添加到 FormData

    submitting.value = true
    await batchImportTrxAddressApi(formData) // 调用新的 API
    ElMessage.success('批量导入成功')
    batchImportVisible.value = false
    reloadTable() // 刷新
  } catch (error) {
    console.error('批量导入失败:', error)
    // 后端返回的错误信息可能在 error.response.data.message 或类似路径
    const errorMsg = (error as any)?.response?.data?.message || '批量导入失败'
    ElMessage.error(errorMsg)
  } finally {
    submitting.value = false
  }
}

// 绑定代理按钮点击
const handleBind = (row: any) => {
  currentBindAddress.value = row
  bindDialogVisible.value = true
  nextTick(() => {
    // Reset Select value to undefined for proper placeholder display
    bindFormMethods.setValues({ userId: undefined })
    bindFormMethods.setValues({ address: row.address })
  })
}

// 绑定代理表单配置
const bindFormSchema = reactive<FormSchema[]>([
  {
    field: 'address',
    component: 'Input',
    label: '当前地址:',
    componentProps: {
      disabled: true
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'userId',
    label: '所属代理：',
    component: 'Select',
    componentProps: {
      placeholder: '请选择所属代理',
      options: agentList, // <--- 绑定到 agentList ref
      filterable: true // 允许搜索
    },
    formItemProps: {
      rules: [{ required: true, message: '请选择所属代理', trigger: 'change' }] // Updated message
    },
    colProps: {
      span: 24
    }
  }
])

// 提交绑定代理
const submitBindAgent = async () => {
  try {
    const formData = await bindFormMethods.getFormData()
    const userId = formData.userId
    if (!userId) {
      ElMessage.error('请选择所属代理')
      return
    }

    submitting.value = true
    // 调用 update API 进行绑定 (Status: 1)
    await updateTrxAddressApi({
      id: currentBindAddress.value.id,
      status: 1,
      user_id: parseInt(userId, 10) // Ensure it's a number if needed
    })
    ElMessage.success('绑定成功')
    bindDialogVisible.value = false
    reloadTable(false)
  } catch (error) {
    console.error('绑定失败:', error)
    ElMessage.error('绑定失败')
  } finally {
    submitting.value = false
  }
}

// 解绑代理按钮点击 - 确保使用 row.user_id
const handleUnbind = async (row: any) => {
  // 确保行数据中有 user_id
  if (!row.user_id) {
    // 检查 user_id
    ElMessage.error('无法获取当前绑定代理的ID')
    return
  }
  try {
    await ElMessageBox.confirm(`确认要解绑地址 ${row.address} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    submitting.value = true
    // Ensure payload matches API definition (lowercase snake_case)
    await updateTrxAddressApi({
      id: row.id, // Use lowercase 'id'
      status: 2, // Use lowercase 'status'
      user_id: row.user_id // Use lowercase 'user_id'
    })
    ElMessage.success('解绑成功')
    reloadTable(false)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解绑失败:', error)
      ElMessage.error('解绑失败')
    }
  } finally {
    submitting.value = false
  }
}

// 删除地址
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认要删除地址 ${row.address} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteTrxAddressApi(row.id)
    ElMessage.success('删除成功')
    reloadTable() // 刷新
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 处理批量删除 - 更新逻辑
const handleBatchDelete = async () => {
  const elTableRef = await searchTableRef.value?.getElTableExpose()
  if (!elTableRef) {
    console.error('无法获取 Table 实例')
    return
  }
  const selections = elTableRef.getSelectionRows() || []

  if (selections.length === 0) {
    ElMessage.warning('请至少选择一项进行删除')
    return
  }

  try {
    await ElMessageBox.confirm(`确认要批量删除选中的 ${selections.length} 个地址吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const ids = selections.map((item: any) => item.id)
    // Ensure payload matches API definition ({ id_list: [...] })
    await batchDeleteTrxAddressApi({ id_list: ids })
    ElMessage.success('批量删除成功')
    reloadTable() // 刷新
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 表单操作成功回调
const handleSuccess = () => {
  reloadTable() // 刷新
}

// --- 新增地址逻辑 ---
const addFormSchema = reactive<FormSchema[]>([
  {
    field: 'addresses',
    label: 'TRX地址:',
    component: 'Input',
    componentProps: {
      type: 'textarea',
      rows: 10,
      placeholder: '请输入TRX地址，每行一个'
    },
    formItemProps: {
      rules: [{ required: true, message: '地址不能为空', trigger: 'blur' }]
    },
    // 添加 colProps 使其占满整行
    colProps: {
      span: 24
    }
  }
])

const submitAddAddresses = async () => {
  try {
    const formData = await addFormMethods.getFormData()
    if (!formData.addresses) {
      ElMessage.warning('请输入地址')
      return
    }
    const addressList = formData.addresses
      .split(/[\n\r]+/)
      .filter((addr: string) => addr.trim() !== '')
    if (addressList.length === 0) {
      ElMessage.warning('未输入有效地址')
      return
    }

    submitting.value = true
    // Ensure payload matches API definition ({ address: "..." })
    const addressString = addressList.join(',')
    await createTrxAddressApi({ address: addressString })
    ElMessage.success('新增成功')
    addDialogVisible.value = false
    reloadTable()
  } catch (error) {
    console.error('新增地址失败:', error)
    ElMessage.error('新增地址失败')
  } finally {
    submitting.value = false
  }
}

// --- 导出模版处理函数 ---
const handleExportTemplate = async () => {
  try {
    const res = await exportAddressModuleApi()
    // 使用下载工具处理 blob 数据
    // Ensure res.data is a Blob before passing
    if (res.data instanceof Blob) {
      downloadByData(res.data, '地址导入模版.xlsx')
      ElMessage.success('模版下载成功')
    } else {
      console.error('Export failed: Response data is not a Blob', res.data)
      ElMessage.error('导出失败: 文件数据格式错误')
    }
  } catch (error) {
    console.error('模版下载失败:', error)
    // Try to provide a more specific error message
    const errorMsg =
      (error as any)?.response?.data?.message || (error as Error)?.message || '模版下载失败'
    ElMessage.error(errorMsg)
  }
}
</script>
