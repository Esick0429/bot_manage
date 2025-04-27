<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { ref, nextTick, h, onMounted } from 'vue'
import {
  listManageUserApi,
  addManageUserApi,
  updateManageUserApi,
  deleteManageUserApi
} from '@/api/manageUser/index'
import type { DepartmentUserItem } from '@/api/department/types'
import { Table, TableExpose } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import { ElTag, ElMessageBox, ElMessage } from 'element-plus'
import Write from './components/Write.vue'
import Detail from './components/Detail.vue'
import { BaseButton } from '@/components/Button'
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
        <BaseButton /* v-hasPermi="User.edit" */ type="primary" onClick={() => action(row, 'edit')}>
          {t('exampleDemo.edit')}
        </BaseButton>,
        <BaseButton /* v-hasPermi="User.delete" */ type="danger" onClick={() => delData(row)}>
          {t('exampleDemo.del')}
        </BaseButton>
      ]
    }
  }
]

const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    const page = tableState.currentPage.value
    const size = tableState.pageSize.value
    try {
      const res = await listManageUserApi({ current_page: page, page_size: size })
      return {
        list: res.data.list || [],
        total: res.data.totalCount || 0
      }
    } catch (error) {
      console.error('User.vue: listManageUserApi error:', error)
      return { list: [], total: 0 }
    }
  },
  immediate: true
})

const { getList, setProps } = tableMethods
const { dataList, loading, total, currentPage, pageSize } = tableState

const dialogTitle = ref('')
const currentRow = ref<DepartmentUserItem | undefined>()
const actionType = ref('')
const writeRef = ref<InstanceType<typeof Write> | null>(null)
const detailRef = ref<InstanceType<typeof Detail> | null>(null)

const AddAction = () => {
  dialogTitle.value = t('exampleDemo.add')
  currentRow.value = undefined
  actionType.value = 'add'
  nextTick(() => writeRef.value?.open())
}

const delLoading = ref(false)

const delData = async (row?: DepartmentUserItem) => {
  if (!row) return
  try {
    await ElMessageBox.confirm(
      t('userDemo.confirmDeleteMessage', `确定要删除用户 ${row.username} 吗？`),
      t('userDemo.confirmTitle', '确认删除'),
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    delLoading.value = true
    try {
      await deleteManageUserApi({ id: row.id })
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    } finally {
      delLoading.value = false
    }
  } catch {
    ElMessage.info('取消操作')
  }
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
    saveLoading.value = true
    try {
      let res: any
      if (actionType.value === 'edit') {
        res = await updateManageUserApi(formData)
      } else {
        res = await addManageUserApi(formData)
      }
      ElMessage.success(actionType.value === 'edit' ? '编辑成功' : '添加成功')
      if (res.code == '000000') {
        // getList() // Remove this call
      }
    } catch (error) {
      console.log(error)
    } finally {
      saveLoading.value = false
      writeRef.value?.close()
    }
  }
}

// --- Handlers for pagination updates from Table component ---
const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  // getList() will be triggered by the watcher inside useTable
}
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  // getList() will be triggered by the watcher inside useTable
}

onMounted(() => {
  setProps({ columns: columns })
})
</script>

<template>
  <div class="flex flex-col w-100% h-100%">
    <ContentWrap class="flex-1 mb-4">
      <div class="mb-4">
        <BaseButton type="primary" @click="AddAction">{{ t('exampleDemo.add') }}</BaseButton>
      </div>

      <Table
        :data="dataList"
        :loading="loading"
        :selection="false"
        :border="true"
        stripe
        :pagination="{
          total: total,
          currentPage: currentPage,
          pageSize: pageSize,
          pageSizes: [10, 20, 50, 100],
          layout: 'total, sizes, prev, pager, next, jumper',
          background: true
        }"
        @update:currentPage="handleCurrentChange"
        @update:pageSize="handleSizeChange"
        @register="tableRegister"
      />
    </ContentWrap>

    <Write
      ref="writeRef"
      :current-row="currentRow"
      :dialog-title="dialogTitle"
      :save-loading="saveLoading"
      :action-type="actionType"
      @closed="getList"
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
