<template>
  <div class="app-container">
    <ContentWrap>
      <!-- 使用优化后的SearchTable组件 -->
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchBotList"
        :fetch-del-api="fetchBotDelete"
        :action-column="actionColumn"
        :table-props="{
          rowKey: 'id',
          highlightCurrentRow: false,
          reserveSelection: false
        }"
        ref="searchTableRef"
        @add="handleAdd"
        @loaded="handleDataLoaded"
        @error="handleLoadError"
      >
        <template #rightToolbar>
          <BaseButton type="primary" @click="openConsumptionRecord">消费记录</BaseButton>
        </template>
        <!-- 自定义表格列 -->
        <template #botUsername="{ row }">
          <ElLink type="primary" :href="`https://t.me/${row.botUsername}`" target="_blank">
            {{ row.botUsername || '未命名' }}
          </ElLink>
        </template>

      </SearchTable>

      <!-- 详情弹窗 -->
      <Dialog v-model="dialogVisible" title="新增机器人">
        <Form :schema="formSchema" @register="formRegister" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="dialogVisible = false">
              {{ t('common.cancel') }}
            </ElButton>
            <ElButton type="primary" @click="handleSubmit">
              提交
            </ElButton>
          </div>
        </template>
      </Dialog>
    </ContentWrap>
    <!-- 添加消费记录组件 -->
    <ConsumptionRecord ref="consumptionRecordRef" />
    <!-- 添加续费组件 -->
    <RenewBot ref="renewBotRef" @success="handleRenewSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, h } from 'vue'
import { ElButton, ElLink, ElMessage, ElMessageBox, ElEmpty } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { SearchTable } from '@/components/SearchTable'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import { useValidator } from '@/hooks/web/useValidator'
import { BaseButton } from '@/components/Button'
import ConsumptionRecord from './components/ConsumptionRecord.vue'
import RenewBot from './components/RenewBot.vue'

const { t } = useI18n()
const { required } = useValidator()
const searchTableRef = ref(null)
const consumptionRecordRef = ref()
const renewBotRef = ref()

// 表格列配置
const columns = [
  { field: 'botId', label: '机器人ID' },
  {
    field: 'botUsername',
    label: '机器人用户名',
    slots: {
      default: (data: any) => {
        return data.row.botUsername
      }
    }
  },
  {
    field: 'status',
    label: '状态',
    formatter: (row) => (row.status === 1 ? '是' : '否')
  },
  { field: 'createTime', label: '创建时间' },
  { field: 'expireTime', label: '到期时间' }
]

// 操作列配置
const actionColumn = {
  field: 'action',
  label: '操作',
  width: 240,
  slots: {
    default: (data: any) => {
      const row = data.row
      return h('div', [
        h(
          BaseButton,
          {
            type: 'primary',
            onClick: () => handleEdit(row)
          },
          '配置'
        ),
        h(
          BaseButton,
          {
            type: 'success',
            onClick: () => handleRenew(row)
          },
          '续费'
        )
      ])
    }
  }
}

// 搜索表单配置
const searchSchema = [
  {
    field: 'botId',
    component: 'Input',
    label: '机器人ID',
    componentProps: {
      placeholder: '请输入机器人ID',
      clearable: true
    }
  },
  {
    field: 'botUsername',
    component: 'Input',
    label: '机器人用户名',
    componentProps: {
      placeholder: '请输入机器人用户名',
      clearable: true
    }
  }
]

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'fee',
    component: 'Input' as const,
    label: '机器人费用',
    componentProps: {
      placeholder: '请输入机器人费用'
    }
  },
  {
    field: 'botToken',
    component: 'Input' as const,
    label: '机器人token',
    componentProps: {
      placeholder: '请输入机器人token'
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'apiKey',
    component: 'Input' as const,
    label: 'API秘钥',
    componentProps: {
      placeholder: '请输入API秘钥'
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'adminTgAccount',
    component: 'Input' as const,
    label: '管理员TG账号',
    componentProps: {
      placeholder: '请输入管理员TG账号'
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'remark',
    component: 'Input' as const,
    label: '备注',
    componentProps: {
      placeholder: '请输入备注',
      type: 'textarea',
      rows: 3
    }
  },
  {
    field: 'status',
    component: 'Switch' as const,
    label: '状态',
    value: true
  }
]) as FormSchema[]

// 表单Hook
const { formRegister, formMethods } = useForm()

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

// 添加
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  // 重置表单
  formMethods.setValues({
    fee: '',
    botToken: '',
    apiKey: '',
    adminTgAccount: '',
    remark: '',
    status: true
  })
}

// 编辑
const handleEdit = (row) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  // 设置表单数据
  formMethods.setValues({
    ...row,
    fee: row.fee || '',
    botToken: row.botToken || '',
    apiKey: row.apiKey || '',
    adminTgAccount: row.adminTgAccount || '',
    remark: row.remark || '',
    status: row.status || true
  })
}
// 续费
const handleRenew = (row) => {
  if (renewBotRef.value) {
    renewBotRef.value.open(row)
  }
}
// 提交表单
const handleSubmit = async () => {
  const elForm = await formMethods.getElFormExpose()

  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()

    // 这里应该调用真实的API
    console.log('提交的表单数据:', formData)

    ElMessage.success(dialogType.value === 'add' ? t('common.addSuccess') : t('common.editSuccess'))
    dialogVisible.value = false

    // 刷新表格数据
    searchTableRef.value?.reload()
  })
}

// 修改 fetchBotList 函数，修复数据加载问题
const fetchBotList = async (params) => {
  console.log('查询参数:', params)

  return new Promise((resolve) => {
    // 模拟异步请求
    setTimeout(() => {
      try {
        // 生成测试数据
        const list = Array.from({ length: 10 }).map((_, index) => ({
          id: index + 1,
          botId: `BOT_${index + 1}`,
          botUsername: `机器人${index + 1}`,
          status: Math.random() > 0.5 ? 1 : 0,
          fee: Math.floor(Math.random() * 1000),
          botToken: `token_${Math.random().toString(36).substring(2, 15)}`,
          apiKey: `key_${Math.random().toString(36).substring(2, 10)}`,
          adminTgAccount: `admin_${index}`,
          remark: `这是机器人${index + 1}的备注信息`,
          createTime: new Date().toLocaleString(),
          expireTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleString()
        }))

        console.log('数据生成完毕，返回数据:', list)

        // 直接返回符合接口要求的对象格式
        const result = {
          list,
          total: 100
        }

        console.log('API返回结果对象:', result)
        console.log('API返回数据类型检查:', {
          resultType: typeof result,
          listIsArray: Array.isArray(result.list),
          listLength: result.list.length,
          totalType: typeof result.total,
          totalValue: result.total
        })

        resolve(result)
      } catch (error) {
        console.error('生成数据失败:', error)
        // 出错时返回空数组
        resolve({ list: [], total: 0 })
      }
    }, 300)
  })
}

// 模拟删除API
const fetchBotDelete = async () => {
  try {
    // 这里应该是调用真实的API
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 500)
    })
  } catch (error) {
    console.error('删除失败:', error)
    return false
  }
}

// 数据加载完成回调
const handleDataLoaded = ({ data, total, success }) => {
  console.log('数据加载完成:', {
    总条数: total,
    成功: success,
    数据: data,
    条数: data?.length || 0
  })

  if (data?.length === 0 && success) {
    ElMessage.info('未查询到符合条件的数据')
  }
}

// 数据加载错误回调
const handleLoadError = () => {
  ElMessage.error('加载数据失败，请稍后重试')
}

// 消费记录
const openConsumptionRecord = () => {
  consumptionRecordRef.value?.open()
}

// 处理删除
// const handleDelete = async (row) => {
//   try {
//     await ElMessageBox.confirm(`确认删除机器人 ${row.botUsername || 'BOT'} 吗？`, '提示', {
//       type: 'warning'
//     })
//     const result = await searchTableRef.value?.delete(row)
//     if (result) {
//       ElMessage.success(t('common.deleteSuccess'))
//     }
//   } catch (error) {
//     console.error('删除操作被取消或出错:', error)
//   }
// }

// 续费成功回调
const handleRenewSuccess = () => {
  if (searchTableRef.value) {
    searchTableRef.value.reload()
  }
}

// 手动触发加载
onMounted(() => {
  // 确保组件挂载后可以访问表格实例
  setTimeout(() => {
    if (searchTableRef.value) {
      console.log('手动触发数据刷新')
      searchTableRef.value.reload()
    }
  }, 100)
})
</script>
