<script setup lang="tsx">
import { ref, computed, h, nextTick } from 'vue'
import {
  getRoleListApi,
  addRoleApi,
  updateRoleApi,
  deleteRoleApi,
  getRolePermissionsApi
} from '@/api/role'
import { useI18n } from '@/hooks/web/useI18n'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { ElMessageBox, ElMessage, ElTag } from 'element-plus'
import { formatToDateTime } from '@/utils/dateUtil'
import { SearchTable } from '@/components/SearchTable'
import Write from './components/Write.vue'
import { FormSchema } from '@/components/Form'
import { useSearchTable } from '@/hooks/web/useSearchTable'

const { t } = useI18n()

// 搜索表单配置
const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'name',
    label: t('role.roleName'),
    component: 'Input',
    componentProps: {
      placeholder: t('role.roleName')
    }
  }
])

// 表格列配置
const columns = [
  {
    field: 'name',
    label: t('role.roleName')
  },
  {
    field: 'status',
    label: t('menu.status'),
    slots: {
      default: ({ row }: any) => {
        return (
          <>
            <ElTag type={row.status === 1 ? 'success' : 'danger'}>
              {row.status === 1 ? '启用' : '禁用'}
            </ElTag>
          </>
        )
      }
    }
  },
  {
    field: 'create_time',
    label: t('tableDemo.displayTime'),
    formatter: (row: any) => (row.create_time == 0 ? '-' : formatToDateTime(row.create_time))
  },
  {
    field: 'action',
    label: t('userDemo.action'),
    width: 240,
    slots: {
      default: ({ row }: any) => [
        h(
          BaseButton,
          {
            type: 'primary',
            onClick: () => handleAction(row, 'edit'),
            style: { marginRight: '8px' }
          },
          () => t('exampleDemo.edit')
        ),
        h(
          BaseButton,
          {
            type: 'danger',
            onClick: () => handleDelete(row)
          },
          () => t('exampleDemo.del')
        )
      ]
    }
  }
]

// 数据请求API
const fetchRoleList = async (params: any) => {
  try {
    const res = await getRoleListApi(params)
    return res.data || { list: [], total: 0 }
  } catch (error) {
    ElMessage.error(t('common.apiError'))
    return { list: [], total: 0 }
  }
}

// 弹窗相关
const dialogTitle = ref('')
const actionType = ref<'add' | 'edit' | 'detail' | ''>('')
const writeRef = ref<InstanceType<typeof Write>>()
const formLoading = ref(false)
const currentRow = ref<any>({})

// 新增/编辑弹窗
const handleAction = async (row: any, type: 'edit' | 'detail') => {
  dialogTitle.value = t(type === 'edit' ? 'exampleDemo.edit' : 'exampleDemo.detail')
  actionType.value = type
  if (type === 'detail') {
    // Detail view logic if needed
  } else {
    try {
      formLoading.value = true
      const res = await getRolePermissionsApi(row.id)
      const data = res?.data || {}
      currentRow.value = data
      nextTick(() => {
        writeRef.value?.open()
      })
    } catch (error) {
      ElMessage.error('获取角色权限失败')
    } finally {
      formLoading.value = false
    }
  }
}

const handleAdd = () => {
  dialogTitle.value = t('exampleDemo.add')
  actionType.value = 'add'
  currentRow.value = {}
  nextTick(() => writeRef.value?.open())
}

// Handle success event from Write component
const handleSaveSuccess = () => {
  searchTableRef.value?.reload()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定删除该角色吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await deleteRoleApi({ id: row.id })
        ElMessage.success(t('common.delSuccess'))
        searchTableRef.value?.reload()
      } catch (e: any) {
        const errMsg = e?.response?.data?.message || e?.message || t('common.apiError')
        ElMessage.error(errMsg)
      }
    })
    .catch(() => {})
}

// SearchTable Ref
const searchTableRef = ref<any>(null)

// useSearchTable 只用于类型提示和ref暴露
useSearchTable({
  searchSchema: searchSchema.value,
  tableColumns: columns,
  fetchDataApi: fetchRoleList,
  immediate: false
})
</script>

<template>
  <ContentWrap>
    <SearchTable
      ref="searchTableRef"
      :columns="columns"
      :search-schema="searchSchema"
      :fetch-data-api="fetchRoleList"
      :showAddButton="true"
      @add="handleAdd"
    />
  </ContentWrap>

  <Write
    ref="writeRef"
    :current-row="currentRow"
    :dialog-title="dialogTitle"
    :action-type="actionType"
    :form-loading="formLoading"
    @success="handleSaveSuccess"
  >
    <template #footer>
      <BaseButton
        v-if="actionType === 'add' || actionType === 'edit'"
        type="primary"
        @click="writeRef?.submit()"
      >
        {{ t('exampleDemo.save') }}
      </BaseButton>
      <BaseButton @click="writeRef?.close()">{{ t('dialogDemo.close') }}</BaseButton>
    </template>
  </Write>
</template>
