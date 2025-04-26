<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { ref, nextTick, h } from 'vue'
import {
  listManageUserApi,
  addManageUserApi,
  updateManageUserApi,
  deleteManageUserApi
} from '@/api/manageUser/index'
import type { DepartmentUserItem } from '@/api/department/types'
import { SearchTable } from '@/components/SearchTable'
import { useSearchTable } from '@/hooks/web/useSearchTable'
import { ElTag } from 'element-plus'
import Write from './components/Write.vue'
import Detail from './components/Detail.vue'
import { BaseButton } from '@/components/Button'
import { getRoleListApi } from '@/api/role'
import { formatToDateTime } from '@/utils/dateUtil'

const { t } = useI18n()

const columns = [
  {
    field: 'username',
    label: t('userDemo.username')
  },
  {
    field: 'role_name',
    label: t('userDemo.role')
  },
  {
    field: 'status',
    label: t('userDemo.status'),
    slots: {
      default: ({ row }: any) =>
        h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
          row.status === 1 ? t('userDemo.enable') : t('userDemo.disable')
        )
    }
  },
  {
    field: 'created_at',
    label: t('tableDemo.displayTime'),
    formatter: (row: any) => (row.created_at ? formatToDateTime(row.created_at * 1000) : '-')
  },
  {
    field: 'updated_at',
    label: '更新时间',
    formatter: (row: any) => (row.updated_at ? formatToDateTime(row.updated_at * 1000) : '-')
  },
  {
    field: 'action',
    label: t('userDemo.action'),
    width: 240,
    slots: {
      default: ({ row }: any) => [
        h(BaseButton, { type: 'primary', onClick: () => action(row, 'edit') }, () =>
          t('exampleDemo.edit')
        ),
        h(BaseButton, { type: 'danger', onClick: () => delData(row) }, () => t('exampleDemo.del'))
      ]
    }
  }
]

const searchSchema = [
  {
    field: 'username',
    label: t('userDemo.username'),
    component: 'Input' as const,
    componentProps: {
      placeholder: t('userDemo.username')
    }
  }
]

const fetchDataApi = async (params: any) => {
  const res = await listManageUserApi(params)
  return {
    list: res.data.list || [],
    total: res.data.total || 0
  }
}

const { tableRegister, tableMethods } = useSearchTable({
  tableColumns: columns,
  searchSchema,
  fetchDataApi,
  immediate: true
})
const { getList } = tableMethods

const dialogTitle = ref('')
const currentRow = ref<DepartmentUserItem | undefined>()
const actionType = ref('')
const writeRef = ref()
const detailRef = ref()

const AddAction = () => {
  dialogTitle.value = t('exampleDemo.add')
  currentRow.value = undefined
  actionType.value = 'add'
  nextTick(() => writeRef.value?.open())
}

const delLoading = ref(false)

const delData = async (row?: DepartmentUserItem) => {
  if (!row) return
  delLoading.value = true
  await deleteManageUserApi({ id: row.id }).finally(() => {
    delLoading.value = false
  })
  getList()
}

const action = (row: DepartmentUserItem, type: string) => {
  dialogTitle.value = t(type === 'edit' ? 'exampleDemo.edit' : 'exampleDemo.detail')
  actionType.value = type
  if (type === 'detail') {
    currentRow.value = { ...row }
    nextTick(() => detailRef.value?.open())
  } else {
    currentRow.value = { ...row }
    nextTick(() => writeRef.value?.open())
  }
}

const saveLoading = ref(false)

const save = async () => {
  const write = writeRef.value
  const formData = await write?.submit()
  if (formData) {
    delete formData.confirmPassword
    delete formData.role_name
    saveLoading.value = true
    try {
      let res: any
      if (actionType.value === 'edit') {
        res = await updateManageUserApi(formData)
      } else {
        res = await addManageUserApi(formData)
      }
      if (res) {
        getList()
      }
    } catch (error) {
      console.log(error)
    } finally {
      saveLoading.value = false
      writeRef.value?.close()
    }
  }
}

// 角色列表外部加载
const roleOptions = ref<{ label: string; value: number | string }[]>([])
const roleOptionsLoading = ref(true)
const fetchRoleOptions = async () => {
  roleOptionsLoading.value = true
  const res = await getRoleListApi()
  roleOptions.value = (res.data?.list || []).map((item: any) => ({
    label: item.name,
    value: item.id
  }))
  roleOptionsLoading.value = false
}
fetchRoleOptions()
</script>

<template>
  <div class="flex w-100% h-100%">
    <ContentWrap class="flex-1">
      <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchDataApi"
        :showAddButton="true"
        @add="AddAction"
        @register="tableRegister"
      />
    </ContentWrap>

    <Write
      ref="writeRef"
      :current-row="currentRow"
      :dialog-title="dialogTitle"
      :save-loading="saveLoading"
      :action-type="actionType"
      :role-options="roleOptions"
      :role-options-loading="roleOptionsLoading"
    >
      <template #footer>
        <BaseButton
          v-if="actionType !== 'detail'"
          type="primary"
          :loading="saveLoading"
          @click="save"
        >
          {{ t('exampleDemo.save') }}
        </BaseButton>
        <BaseButton @click="writeRef?.close()">{{ t('dialogDemo.close') }}</BaseButton>
      </template>
    </Write>
    <Detail
      ref="detailRef"
      :current-row="currentRow"
      :dialog-title="dialogTitle"
      :action-type="actionType"
    />
  </div>
</template>
