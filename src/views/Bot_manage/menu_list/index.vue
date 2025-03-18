<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchMenuList"
        :fetch-del-api="deleteMenu"
        :action-column="actionColumn"
        ref="searchTableRef"
        @add="handleAdd"
        @search="onSearch"
        @delete="handleTableDelete"
      >
        <!-- 自定义搜索按钮 -->
        <template #searchButtons>
          <BaseButton type="primary" @click="handlePreview">点我预览</BaseButton>
        </template>
      </SearchTable>

      <!-- 表单弹窗 -->
      <Dialog v-model="dialogVisible" :title="dialogTitle">
        <!-- 表单内容 -->
        <Form ref="formRef" :schema="formSchema" @register="formRegister" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="handleSubmit">提交</ElButton>
          </div>
        </template>
      </Dialog>

      <!-- 使用菜单预览组件 -->
      <MenuPreview v-model="previewVisible" @update:modelValue="previewHandleClose" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed, watch, reactive } from 'vue'
import {
  ElButton,
  ElLink,
  ElTag,
  ElMessage,
  ElMessageBox,
  ElSwitch,
  ElRow,
  ElCol,
  ElInput
} from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Form } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import type { TableColumn } from '@/components/Table'
import type { FormSchema } from '@/components/Form'
import { getMenuListApi, deleteMenuApi, saveMenuApi } from '@/api/menu_list'
import MenuPreview from './components/MenuPreview.vue'

const { t } = useI18n()
const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const previewVisible = ref(false)
const { formRegister, formMethods } = useForm()

// 控制按钮类型相关表单项显示
const isUrlType = ref(true)

// 添加formValues来跟踪表单值
const formValues = reactive<{
  type: number
  buttonType: string
  other: string
  [key: string]: any
}>({
  type: 1,
  buttonType: 'url',
  other: ''
})

// 表单数据接口
interface FormData {
  id?: number
  name: string
  type: number
  buttonType: string
  other: string
  sort: number
  status: number
}

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    component: 'Input' as const,
    label: '菜单名称',
    componentProps: {
      placeholder: '请输入菜单名称'
    },
    formItemProps: {
      rules: [{ required: true, message: '菜单名称不能为空' }]
    }
  },
  {
    field: 'sort',
    component: 'InputNumber' as const,
    label: '排序',
    componentProps: {
      placeholder: '请输入排序',
      min: 0
    },
    formItemProps: {
      rules: [{ required: true, message: '排序不能为空' }]
    }
  },
  {
    field: 'type',
    component: 'Select' as const,
    label: '菜单类型',
    componentProps: {
      options: [
        { label: '菜单', value: 1 },
        { label: '内联按钮', value: 2 }
      ],
      placeholder: '请选择菜单类型',
      onChange: async (value) => {
        formValues.type = value
        await formMethods.setValues({
          type: value,
          other: ''
        })
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '菜单类型不能为空' }]
    }
  },
  {
    field: 'buttonType',
    component: 'Select' as const,
    label: '按钮类型',
    componentProps: {
      options: [
        { label: 'URL链接', value: 'url' },
        { label: '回调函数', value: 'callback' }
      ],
      placeholder: '请选择按钮类型',
      onChange: async (value) => {
        isUrlType.value = value === 'url'
        formValues.buttonType = value
        await formMethods.setValues({
          buttonType: value
        })
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '按钮类型不能为空' }]
    }
  },
  {
    field: 'other',
    component: 'Input' as const,
    label: '链接地址/回调函数',
    componentProps: {
      placeholder: '请输入链接地址或回调函数名称',
      remark: () => {
        if (formValues.buttonType === 'url') {
          return (
            <>
              <p>例如：https://www.123456789.com</p>
            </>
          )
        } else {
          return (
            <>
              <p>例如：callbackName</p>
            </>
          )
        }
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '该字段不能为空' }]
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'status',
    component: 'Switch' as const,
    label: '状态',
    value: 2,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    },
    formItemProps: {
      rules: [{ required: true, message: '状态不能为空' }]
    }
  }
])

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'name',
    label: '菜单名称'
  },
  {
    field: 'type',
    label: '类型',
    slots: {
      default: (data: any) => {
        const typeMap = {
          1: { label: '菜单', type: 'success' },
          2: { label: '内联按钮', type: 'primary' }
        }
        const type = typeMap[data.row.type] || { label: '-', type: 'info' }
        return h(
          ElTag,
          {
            type: type.type
          },
          () => type.label
        )
      }
    }
  },
  { field: 'sort', label: '排序' },
  { field: 'other', label: '其他' },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data: any) => {
        return h(ElSwitch, {
          modelValue: data.row.status === 1,
          disabled: true,
          activeColor: '#13ce66',
          inactiveColor: '#ff4949'
        })
      }
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    formatter: (row: any) => row.createTime || '-'
  },
  {
    field: 'updateTime',
    label: '更新时间',
    formatter: (row: any) => row.updateTime || '-'
  }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  width: 240,
  slots: {
    default: (data: any) => {
      const row = data.row
      return (
        <>
          <BaseButton type="primary" onClick={() => handleEdit(row)}>
            编辑
          </BaseButton>
          <BaseButton type="danger" onClick={() => handleDelete(row)}>
            删除
          </BaseButton>
        </>
      )
    }
  }
}

// 搜索表单配置
const searchSchema = [
  {
    field: 'name',
    component: 'Input' as const,
    label: '菜单名称',
    componentProps: {
      placeholder: '请输入菜单名称'
    }
  },
  {
    field: 'type',
    component: 'Select' as const,
    label: '类型',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '菜单', value: 1 },
        { label: '内联按钮', value: 2 }
      ],
      placeholder: '请选择菜单类型'
    }
  }
]

// API 封装
const fetchMenuList = async (params: any) => {
  try {
    const response = await getMenuListApi(params)
    return response.data
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 修改deleteMenu函数签名以满足接口要求
const deleteMenu = async () => {
  // 这个函数只需返回true，实际删除逻辑在delete调用时由组件内部处理
  return true
}

// 处理删除按钮点击
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除 ${row.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      searchTableRef.value?.delete(row)
    })
    .catch(() => {})
}

// 事件处理函数
const handleAdd = () => {
  dialogVisible.value = true
  dialogTitle.value = '添加菜单'

  // 重置表单
  const defaultValues = {
    name: '',
    type: 1,
    buttonType: 'url',
    other: '',
    sort: 0,
    status: 1
  }

  // 同步更新显示状态
  isUrlType.value = true

  // 更新本地响应式数据
  Object.assign(formValues, defaultValues)

  // 设置表单值
  formMethods.setValues(defaultValues)
}

const handleEdit = (row: any) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑菜单'

  // 设置表单值
  const editValues = {
    id: row.id,
    name: row.name,
    type: row.type,
    sort: row.sort,
    status: row.status,
    buttonType: row.buttonType || 'url',
    other: row.other || ''
  }

  // 同步更新显示状态
  isUrlType.value = (row.buttonType || 'url') === 'url'

  // 更新本地响应式数据
  Object.assign(formValues, editValues)

  // 设置表单值
  formMethods.setValues(editValues)
}

const handlePreview = () => {
  previewVisible.value = true
}

const handleSubmit = async () => {
  try {
    const formRef = ref()
    await formRef.value?.validate()

    const values = await formMethods.getFormData()

    await saveMenuApi(values)

    ElMessage.success(values.id ? '更新成功' : '添加成功')
    dialogVisible.value = false

    // 刷新列表
    searchTableRef.value?.reload()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

const onSearch = (params: any) => {
  console.log('搜索参数:', params)
}

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('添加菜单')

// 处理表格组件的删除事件
const handleTableDelete = async (row: any, result: boolean) => {
  if (result) {
    try {
      await deleteMenuApi(row.id)
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('删除菜单失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 监听状态变化
watch(
  [() => formValues.type, isUrlType],
  () => {
    // 更新表单配置中的disabled和hidden属性
    formSchema.forEach((item) => {
      if (item.field === 'buttonType') {
        item.hidden = formValues.type !== 2
      } else if (item.field === 'other') {
        item.hidden = formValues.type !== 2
        item.label = isUrlType.value ? '链接地址' : '回调函数'
        item.componentProps = {
          ...item.componentProps,
          disabled: formValues.type !== 2
        }
      }
    })
  },
  { immediate: true }
)

const previewHandleClose = () => {
  searchTableRef.value?.reload()
}

onMounted(() => {
  // 组件加载后自动调用首次查询
  searchTableRef.value?.reload()
})
</script>

<style scoped>
/* 移除菜单预览相关样式 */
</style>
