<template>
  <div class="app-container">
    <ContentWrap>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">账户信息</h2>
        <ElButtonGroup v-if="userData.id">
          <ElButton type="primary" @click="openPasswordDialog">修改密码</ElButton>
          <ElButton type="success" @click="openRechargeDialog">充值</ElButton>
          <ElButton type="warning" @click="handleRechargeRecord">充值记录</ElButton>
          <ElButton type="danger" @click="handleDeductionRecord">扣款记录</ElButton>
        </ElButtonGroup>
        <ElButton v-else type="primary" :loading="loading" @click="fetchAccountList({})">刷新</ElButton>
      </div>
      <ElDivider />
      
      <div v-if="loading" class="loading-container py-10">
        <ElSkeleton :rows="5" animated />
      </div>
      
      <ElDescriptions v-else :column="1" border>
        <ElDescriptionsItem v-for="(item, index) in accountSchema" :key="index" :label="item.label">
          <div>{{ formatAccountField(item.field, userData[item.field]) }}</div>
        </ElDescriptionsItem>
      </ElDescriptions>

      <!-- 修改密码弹窗 -->
      <Dialog v-model="passwordDialogVisible" title="修改密码" width="500px">
        <Descriptions :schema="passwordSchema" :data="userData" :column="1" border />
        <Form :schema="passwordFormSchema" @register="passwordFormRegister" class="mt-4" />
        <template #footer>
          <div class="flex justify-end">
            <ElButton @click="passwordDialogVisible = false">取消</ElButton>
            <ElButton type="primary" :loading="submitting" @click="handleUpdatePassword">确认</ElButton>
          </div>
        </template>
      </Dialog>

      <!-- 充值弹窗 -->
      <Dialog v-model="rechargeDialogVisible" title="账户充值" width="500px">
        <div v-if="userData.receive_address">
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="账户ID">{{ userData.id }}</ElDescriptionsItem>
            <ElDescriptionsItem label="账户名">{{ userData.username }}</ElDescriptionsItem>
            <ElDescriptionsItem label="TRX余额">{{ formatTrx(userData.trx_mount) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="收款地址">
              <div class="flex items-center">
                <div class="truncate mr-2">{{ userData.receive_address }}</div>
                <ElButton type="primary" size="small" @click="copyAddress">复制</ElButton>
              </div>
            </ElDescriptionsItem>
          </ElDescriptions>
          
          <div v-if="userData.receive_address_qrcode" class="mt-4 text-center">
            <div class="font-bold mb-2">扫描二维码充值</div>
            <ElImage 
              :src="userData.receive_address_qrcode" 
              fit="contain"
              style="max-width: 200px; margin: 0 auto;" 
            />
          </div>
        </div>
        <div v-else class="py-4 text-center text-red-500">
          该账户未设置收款地址，请联系管理员。
        </div>
      </Dialog>

      <!-- 充值记录弹窗 -->
      <RechargeRecordDialog
        ref="rechargeRecordDialogRef"
        :account-id="userData.id || 0"
        width="1200"
      />

      <!-- 扣款记录弹窗 -->
      <DeductionRecordDialog ref="deductionRecordDialogRef" :account-id="userData.id || 0" />
    </ContentWrap>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, computed, reactive } from 'vue'
import { formatToDateTime } from '@/utils/dateUtil'
import { ElButton, ElTag, ElMessage, ElDescriptions, ElDescriptionsItem, ElDivider, ElSkeleton, ElButtonGroup } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { Descriptions } from '@/components/Descriptions'
import type { TableColumn } from '@/components/Table'
import type { DescriptionsSchema } from '@/components/Descriptions'
import { getAccountListApi, updateAccountApi } from '@/api/account'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import RechargeRecordDialog from './components/RechargeRecordDialog.vue'
import DeductionRecordDialog from './components/DeductionRecordDialog.vue'
import { useClipboard } from '@/hooks/web/useClipboard'

// 表单校验
const { required } = useValidator()

const rechargeRecordDialogRef = ref<InstanceType<typeof RechargeRecordDialog> | null>(null)
const deductionRecordDialogRef = ref<InstanceType<typeof DeductionRecordDialog> | null>(null)

// 当前账户数据
const userData = ref<Record<string, any>>({})
const loading = ref(false)
const submitting = ref(false)

// 弹窗状态
const passwordDialogVisible = ref(false)
const rechargeDialogVisible = ref(false)

// 账户信息显示Schema
const accountSchema: TableColumn[] = [
  { field: 'id', label: '账户ID' },
  { field: 'username', label: '账户名' },
  { field: 'trx_mount', label: 'TRX余额' },
  { field: 'create_time', label: '创建时间' },
  { field: 'update_time', label: '更新时间' }
]

// 格式化账户字段
const formatAccountField = (field: string, value: any) => {
  if (value === undefined || value === null) return '暂无'
  
  switch (field) {
    case 'trx_mount':
      return formatTrx(value)
    case 'create_time':
    case 'update_time':
      return formatToDateTime(value)
    default:
      return value
  }
}

// 格式化TRX数量
const formatTrx = (value: number | string) => {
  if (value === undefined || value === null) return '暂无'
  return `${value} TRX`
}

// API 封装 - 获取账户信息
const fetchAccountList = async (params: any) => {
  loading.value = true
  
  try {
    const response = await getAccountListApi(params)
    
    if (response && response.data) {
      userData.value = response.data
      console.log('获取到的账户信息:', userData.value)
    } else {
      ElMessage.warning('获取账户信息失败，返回数据为空')
      userData.value = {}
    }
  } catch (error) {
    console.error('获取账户信息失败:', error)
    ElMessage.error('获取账户信息失败')
    userData.value = {}
  } finally {
    loading.value = false
  }
}

// 密码修改相关
const passwordSchema = computed(() => {
  return [
    { field: 'id', label: '账户ID' },
    { field: 'username', label: '账户名' }
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
const openPasswordDialog = () => {
  if (!userData.value.id) {
    ElMessage.warning('账户信息不完整，请刷新页面后重试')
    return
  }
  
  passwordDialogVisible.value = true
}

// 处理修改密码
const handleUpdatePassword = async () => {
  if (!userData.value.id) {
    ElMessage.warning('账户信息不完整，无法修改密码')
    return
  }
  
  const elForm = await passwordFormMethods.getElFormExpose()
  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await passwordFormMethods.getFormData()
    submitting.value = true

    try {
      await updateAccountApi({
        id: userData.value.id,
        password: formData.password
      })
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

// 打开充值弹窗
const openRechargeDialog = () => {
  if (!userData.value.id) {
    ElMessage.warning('账户信息不完整，请刷新页面后重试')
    return
  }
  
  rechargeDialogVisible.value = true
}

// 充值记录 - 打开充值记录弹窗
const handleRechargeRecord = () => {
  if (!userData.value.id) {
    ElMessage.warning('账户信息不完整，请刷新页面后重试')
    return
  }
  
  rechargeRecordDialogRef.value?.open(userData.value.id)
}

// 扣款记录 - 打开扣款记录弹窗
const handleDeductionRecord = () => {
  if (!userData.value.id) {
    ElMessage.warning('账户信息不完整，请刷新页面后重试')
    return
  }
  
  deductionRecordDialogRef.value?.open(userData.value.id, userData.value.username || '')
}

// 复制地址
const { copy } = useClipboard()
const copyAddress = () => {
  if (!userData.value.receive_address) {
    ElMessage.warning('收款地址为空，无法复制')
    return
  }
  
  copy(userData.value.receive_address)
  ElMessage.success('地址复制成功')
}

// 页面加载时获取账户信息
onMounted(() => {
  fetchAccountList({})
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.loading-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
