<template>
  <div class="app-container">
    <ContentWrap>
      <SearchTable
        :columns="columns"
        :search-schema="searchSchema"
        :fetch-data-api="fetchAccountList"
        ref="searchTableRef"
        @search="onSearch"
      >
        <template #searchButtons>
          <BaseButton type="primary" @click="openMassSendDialog()" style="margin-right: 10px">群发消息</BaseButton>
          <BaseButton type="success" @click="openMassSendRecordDialog()">群发记录</BaseButton>
        </template>
      </SearchTable>

      <!-- 修改密码弹窗 -->
      <Dialog v-model="passwordDialogVisible" title="修改密码" width="500px">
        <Descriptions :schema="passwordSchema" :data="currentAccount" :column="1" border />
        <Form :schema="passwordFormSchema" @register="passwordFormRegister" class="mt-4" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="passwordDialogVisible = false">取消</ElButton>
            <ElButton type="primary" :loading="submitting" @click="handleUpdatePassword"
              >确认</ElButton
            >
          </div>
        </template>
      </Dialog>

      <!-- 充值弹窗 -->
      <Dialog v-model="rechargeDialogVisible" title="账户充值" width="500px">
        <div>
          <div>收款地址</div>
          <div>
            <div>{{ currentAccount.receive_address }}</div>
            <BaseButton type="primary" size="small" @click="copyAddress">复制地址</BaseButton>
          </div>
          <div>
            二维码：
            <ElImage :src="currentAccount.receive_address_qrcode" />
          </div>
        </div>
      </Dialog>

      <!-- 发送消息弹窗 -->
      <MessageDialog 
        v-model="messageDialogVisible" 
        :type="messageDialogType" 
        :user="currentAccount" 
        @success="handleMessageSent" 
        :bot-list="botOptions"
      />
      
      <!-- 群发记录弹窗 -->
      <MassSendRecordDialog 
        v-model="massSendRecordDialogVisible"
        ref="massSendRecordDialogRef" 
        :bot-list="botOptions"
      />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, computed, reactive, nextTick } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { ElButton, ElTag, ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { SearchTable } from '@/components/SearchTable'
import { BaseButton } from '@/components/Button'
import { Form, FormSchema } from '@/components/Form'
import { Descriptions } from '@/components/Descriptions'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { getTgUserListApi, sendMessageToUserApi, rechargeUserBalanceApi, getUserBalanceRecordsApi } from '@/api/tgUser'
import { getBotListApi } from '@/api/botlist'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { useClipboard } from '@/hooks/web/useClipboard'
import MessageDialog from './components/MessageDialog.vue'
import MassSendRecordDialog from './components/MassSendRecordDialog.vue'

// 表单校验
const { required } = useValidator()

const searchTableRef = ref<InstanceType<typeof SearchTable> | null>(null)
const massSendRecordDialogRef = ref<InstanceType<typeof MassSendRecordDialog> | null>(null)

// 机器人列表
const botOptions = ref<{label: string, value: number|string}[]>([
  { label: '全部', value: '' }
])

// 获取机器人列表
const fetchBotList = async () => {
  try {
    const res = await getBotListApi({})
    const bots = (res.data.list || []).map((bot: any) => ({
      label: bot.name,
      value: bot.id
    }))
    botOptions.value = [{ label: '全部', value: '' }, ...bots]
  } catch (error) {
    console.error('获取机器人列表失败:', error)
  }
}

// 当前选中账户
const currentAccount = ref<any>({})
const currentAccountId = ref<number>(0)
const submitting = ref(false)

// 消息发送相关
const messageDialogVisible = ref(false)
const messageDialogType = ref<'single' | 'mass'>('single')
const massSendRecordDialogVisible = ref(false)

// 表格列配置
const columns: TableColumn[] = [
  {
    field: 'tg_id',
    label: 'TG用户ID',
    width: 120
  },
  {
    field: 'nickname',
    label: 'TG用户昵称'
  },
  {
    field: 'tg_name',
    label: 'TG用户名'
  },
  {
    field: 'bot_id',
    label: '机器人ID',
    width: 100
  },
  {
    field: 'bot_info.bot_name',
    label: '机器人用户名'
  },
  {
    field: 'trx_mount',
    label: 'TRX余额',
    formatter: (row) => `${row.trx_mount || 0} TRX`
  },
  {
    field: 'usdt_mount',
    label: 'USDT余额',
    formatter: (row) => `${row.usdt_mount || 0} USDT`
  },
  {
    field: 'create_time',
    label: '创建时间',
    width: 180,
    formatter: (row) => (row.create_time ? formatToDateTime(row.create_time * 1000) : '-')
  },
  {
    field: 'update_time',
    label: '更新时间',
    width: 180,
    formatter: (row) => (row.update_time ? formatToDateTime(row.update_time * 1000) : '-')
  },
  {
    field: 'action',
    label: '操作',
    width: 300,
    fixed: 'right',
    slots: {
      default: ({ row }) => {
        return (
          <div>
            <BaseButton type="primary" size="small" onClick={() => openSendMessageDialog(row)}>
              发送消息
            </BaseButton>
            <BaseButton
              type="success"
              size="small"
              style="margin-left: 8px"
              onClick={() => openRechargeDialog(row)}
            >
              充值
            </BaseButton>
            <BaseButton
              type="warning"
              size="small"
              style="margin-left: 8px"
              onClick={() => handleBalanceRecord(row.id)}
            >
              余额记录
            </BaseButton>
          </div>
        )
      }
    }
  }
]

// 搜索表单配置
const searchSchema = computed(() => [
  {
    field: 'bot_id',
    component: 'Select' as const,
    label: '机器人',
    componentProps: {
      options: botOptions,
      placeholder: '请选择机器人'
    }
  },
  {
    field: 'tg_id',
    component: 'Input' as const,
    label: 'TG用户ID',
    componentProps: {
      placeholder: '请输入TG用户ID'
    }
  }
])

// API 封装 - 获取账户列表
const fetchAccountList = async (params: any) => {
  try {
    const response = await getTgUserListApi(params)
    return response.data
  } catch (error) {
    console.error('获取TG用户列表失败:', error)
    return { list: [], total: 0 }
  }
}

// 处理搜索
const onSearch = (params: any) => {
  console.log('搜索参数:', params)
  // 搜索表格组件内部会自动处理搜索逻辑
}

// 密码修改相关
const passwordDialogVisible = ref(false)
const passwordSchema = computed(() => {
  return [
    { field: 'id', label: '账户ID' },
    { field: 'account_name', label: '账户名' }
  ] as DescriptionsSchema[]
})

const { formRegister: passwordFormRegister, formMethods: passwordFormMethods } = useForm()
const passwordFormSchema = reactive<FormSchema[]>([
  {
    field: 'password',
    component: 'InputPassword',
    label: '新密码:',
    colProps: {
      span: 24
    },
    componentProps: {
      placeholder: '请输入新密码'
    },
    formItemProps: {
      rules: [required(), { min: 6, message: '密码长度不能少于6位' }]
    }
  },
  {
    field: 'confirmPassword',
    component: 'InputPassword',
    label: '确认密码:',
    colProps: {
      span: 24
    },
    componentProps: {
      placeholder: '请再次输入新密码'
    },
    formItemProps: {
      rules: [
        required(),
        {
          validator: (rule, value, callback) => {
            // 获取表单数据以访问密码字段
            const formEl = document.querySelector('form')
            const passwordInput = formEl?.querySelector(
              'input[name="password"]'
            ) as HTMLInputElement
            const password = passwordInput?.value

            if (value !== password) {
              callback(new Error('两次输入密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }
  }
])

// 打开修改密码弹窗
const openPasswordDialog = (row: any) => {
  currentAccount.value = row
  passwordDialogVisible.value = true
}

// 处理修改密码
const handleUpdatePassword = async () => {
  const elForm = await passwordFormMethods.getElFormExpose()
  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await passwordFormMethods.getFormData()
    submitting.value = true

    try {
      // 这里修改密码功能暂未实现，先用提示信息代替
      // await updateAccountApi({
      //   id: currentAccount.value.id,
      //   password: formData.password
      // })
      ElMessage.success('密码修改成功')
      passwordDialogVisible.value = false
    } catch (error) {
      console.error('修改密码失败:', error)
      ElMessage.error('修改密码失败')
    } finally {
      submitting.value = false
    }
  })
}

// 充值相关
const rechargeDialogVisible = ref(false)
const openRechargeDialog = (row: any) => {
  currentAccount.value = row
  rechargeDialogVisible.value = true
}

// 余额记录
const handleBalanceRecord = (accountId: number) => {
  currentAccountId.value = accountId
  ElMessage.info('打开余额记录，需要实现相关组件')
  // 实现余额记录组件并调用
}

// 复制地址
const { copy } = useClipboard()
const copyAddress = () => {
  copy(currentAccount.value.receive_address)
  ElMessage.success('地址复制成功')
}

// 发送消息相关
const openSendMessageDialog = (row: any) => {
  currentAccount.value = row
  messageDialogType.value = 'single'
  messageDialogVisible.value = true
}

// 打开群发消息弹窗
const openMassSendDialog = () => {
  messageDialogType.value = 'mass'
  messageDialogVisible.value = true
}

// 打开群发记录弹窗
const openMassSendRecordDialog = () => {
  massSendRecordDialogVisible.value = true
}

// 消息发送成功处理
const handleMessageSent = () => {
  ElMessage.success('消息发送成功')
  messageDialogVisible.value = false
}

onMounted(() => {
  // 获取机器人列表
  fetchBotList()
  // 组件加载后自动调用首次查询
  searchTableRef.value?.reload()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
