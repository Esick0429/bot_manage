<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchUserList"
        :fetch-del-api="fetchUserDelete"
        :action-column="actionColumn"
        ref="searchTableRef"
        @add="handleAdd"
        @search="onSearch"
      >
        <!-- 自定义表格列 -->
        <template #name="{ row }">
          <ElLink type="primary" @click="handleView(row)">{{ row.name }}</ElLink>
        </template>

        <!-- 操作列 -->
        <template #action="{ row }">
          <ElButton type="primary" link @click="handleEdit(row)">
            {{ t('common.edit') }}
          </ElButton>
          <ElButton type="danger" link @click="searchTableRef?.delete(row)">
            {{ t('common.delete') }}
          </ElButton>
        </template>
      </SearchTable>

      <!-- 表单弹窗 -->
      <Dialog v-model="dialogVisible" :title="dialogTitle">
        <!-- 表单内容 -->
      </Dialog>
    </ContentWrap>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElButton, ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { useI18n } from '@/hooks/web/useI18n'

const { t } = useI18n()
const searchTableRef = ref(null)

// 表格列配置
const columns = [
  { field: 'index', label: t('common.index'), type: 'index', width: 80 },
  { field: 'name', label: t('common.name'), slots: { default: 'name' } },
  { field: 'email', label: t('common.email') },
  {
    field: 'status',
    label: t('common.status'),
    formatter: (row) => (row.status === 1 ? t('common.enable') : t('common.disable'))
  }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: t('common.action'),
  width: 200,
  slots: { default: 'action' }
}

// 搜索表单配置
const searchSchema = [
  {
    field: 'name',
    component: 'Input',
    label: t('common.name'),
    componentProps: {
      placeholder: t('common.inputText')
    }
  },
  {
    field: 'status',
    component: 'Select',
    label: t('common.status'),
    componentProps: {
      options: [
        { label: t('common.all'), value: '' },
        { label: t('common.enable'), value: 1 },
        { label: t('common.disable'), value: 0 }
      ]
    }
  }
]

// 模拟API
const fetchUserList = async (params) => {
  console.log('查询参数:', params)
  // 真实API调用
  return { list: [], total: 100 }
}

const fetchUserDelete = async () => {
  // 真实删除API调用
  return true
}

// 事件处理函数
const handleAdd = () => {
  // 处理添加
  dialogVisible.value = true
}

const handleEdit = (row) => {
  // 处理编辑
}

const handleView = (row) => {
  // 处理查看
}

const onSearch = (params) => {
  console.log('搜索参数:', params)
}

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref(t('common.add'))
</script>
