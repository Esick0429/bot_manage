<template>
  <Dialog v-model="dialogVisible" title="账户充值记录" :width="width">
    <div class="mb-4">
      <h3 class="text-lg font-bold">{{
        accountName ? `账户：${accountName}` : `账户ID：${props.accountId}`
      }}</h3>
    </div>

    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :pagination="{
        total: total
      }"
      @register="tableRegister"
    />

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, computed, watch, unref } from 'vue'
import { ElButton, ElTag, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Table, TableColumn } from '@/components/Table'
import { formatToDateTime } from '@/utils/dateUtil'
import { getBalanceRecordApi } from '@/api/account'
import { useTable } from '@/hooks/web/useTable'

const props = defineProps({
  accountId: {
    type: Number,
    default: 0
  },
  width: {
    type: String,
    default: '900px'
  }
})

const dialogVisible = ref(false)
const accountName = ref('')

const { tableRegister, tableState, tableMethods } = useTable({
  immediate: false,
  fetchDataApi: async () => {
    if (!props.accountId) {
      return { list: [], total: 0 }
    }
    try {
      const params = {
        current_page: currentPage.value,
        page_size: pageSize.value,
        change_type: 'in',
        accountId: props.accountId
      }
      const res = await getBalanceRecordApi(params)

      if (res.data?.list && res.data.list.length > 0) {
        const firstRecord = res.data.list[0]
        if (
          !accountName.value ||
          (firstRecord.user_id && firstRecord.user_id !== props.accountId)
        ) {
          accountName.value = firstRecord.account_name || ''
        }
      } else if (res.data?.list?.length === 0) {
        // If list is empty, maybe clear account name if it was from a previous account?
        // Consider if accountName should be reset more reliably in `open` function when ID changes.
      }

      return {
        list: res.data?.list || [],
        total: res.data?.totalCount || 0
      }
    } catch (error) {
      console.error('获取充值记录失败:', error)
      ElMessage.error('获取充值记录失败')
      return { list: [], total: 0 }
    }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { getList } = tableMethods

const columns: TableColumn[] = [
  {
    field: 'user_id',
    label: '账户ID',
    minWidth: 100
  },
  {
    field: 'username',
    label: '账户名',
    minWidth: 150
  },
  {
    field: 'after_amount',
    label: 'TRX余额',
    minWidth: 120,
    formatter: (row) => `${row.after_amount} TRX`
  },
  {
    field: 'amount',
    label: '充值金额',
    minWidth: 120,
    formatter: (row) => `+${row.amount} TRX`
  },
  {
    field: 'create_time',
    label: '完成时间',
    minWidth: 160,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time) : '-')
  },
  {
    field: 'describe',
    label: '描述',
    minWidth: 160
  }
]

const open = (id: number) => {
  const currentPropAccountId = props.accountId

  dialogVisible.value = true

  if (id !== currentPropAccountId) {
    accountName.value = ''
    currentPage.value = 1
  } else {
    const needsRefresh = unref(dataList).length === 0
    if (needsRefresh) {
      if (currentPage.value !== 1) {
        currentPage.value = 1
      } else {
        tableMethods.getList()
      }
    }
  }
}

defineExpose({
  open
})
</script>

<style scoped>
.mb-4 {
  margin-bottom: 1rem;
}
</style>
