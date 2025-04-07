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
        <ElButton v-else type="primary" :loading="loading" @click="fetchAccountList({})"
          >刷新</ElButton
        >
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
      <Dialog v-model="passwordDialogVisible" title="修改密码" width="600px">
        <div class="pw-reset-container">
          <h3 class="text-lg font-bold mb-4">账户信息</h3>
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="账户ID">{{ userData.id }}</ElDescriptionsItem>
            <ElDescriptionsItem label="账户名">{{ userData.username }}</ElDescriptionsItem>
          </ElDescriptions>

          <ElForm
            ref="resetFormRef"
            :model="resetForm"
            :rules="resetRules"
            label-position="top"
            class="mt-4"
          >
            <ElFormItem prop="phone" label="手机号">
              <ElInput v-model="resetForm.phone" placeholder="请输入手机号码" />
            </ElFormItem>

            <!-- 验证码 -->
            <ElFormItem prop="code" label="验证码">
              <div class="flex">
                <ElInput v-model="resetForm.code" placeholder="请输入验证码" />
                <ElButton
                  type="primary"
                  class="ml-2 w-[120px]"
                  :disabled="isCounting"
                  @click="sendVerificationCode"
                >
                  {{ isCounting ? `${countdown}秒` : '获取验证码' }}
                </ElButton>
              </div>
            </ElFormItem>

            <!-- 新密码 -->
            <ElFormItem prop="password" label="新密码">
              <ElInput
                v-model="resetForm.password"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </ElFormItem>

            <!-- 确认密码 -->
            <ElFormItem prop="confirmPassword" label="确认密码">
              <ElInput
                v-model="resetForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </ElFormItem>
          </ElForm>
        </div>

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
        <div v-if="userData.pay_address">
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="账户ID">{{ userData.id }}</ElDescriptionsItem>
            <ElDescriptionsItem label="账户名">{{ userData.username }}</ElDescriptionsItem>
            <ElDescriptionsItem label="TRX余额">{{
              formatTrx(userData.trx_mount)
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="收款地址">
              <div class="flex items-center">
                <div class="truncate mr-2">{{ userData.pay_address }}</div>
                <ElButton type="primary" size="small" @click="copyAddress">复制</ElButton>
              </div>
            </ElDescriptionsItem>
          </ElDescriptions>

          <div v-if="userData.qr_address" class="mt-4 text-center">
            <div class="font-bold mb-2">扫描二维码充值</div>
            <img 
              :src="userData.qr_address" 
              alt="收款二维码"
              class="mx-auto"
              style="max-width: 200px; height: auto;"
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
import {
  ElButton,
  ElTabs,
  ElTabPane,
  ElForm,
  ElFormItem,
  ElInput,
  ElTag,
  ElMessage,
  ElDescriptions,
  ElDescriptionsItem,
  ElDivider,
  ElSkeleton,
  ElButtonGroup
} from 'element-plus'
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
import { changePasswordApi, sendPhoneCodeApi } from '@/api/login'

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

// ========== 密码修改相关 ==========
const resetFormRef = ref()

// 重置密码表单
const resetForm = reactive({
  phone: '',
  code: '',
  password: '',
  confirmPassword: ''
})

// 表单校验规则
const resetRules = computed(() => {
  return {
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value && !/^1[3-9]\d{9}$/.test(value)) {
            callback(new Error('请输入正确的手机号码'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value !== resetForm.password) {
            callback(new Error('两次输入密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }
})

// 倒计时相关
const countdown = ref(0)
const isCounting = computed(() => countdown.value > 0)
let timer: number | null = null

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  timer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer!)
      timer = null
    }
  }, 1000)
}

// 发送验证码
const sendVerificationCode = async () => {
  try {
    // 验证手机号
    await resetFormRef.value.validateField('phone')

    if (!resetForm.phone) {
      ElMessage.warning('请输入手机号')
      return
    }

    // 发送手机验证码
    await sendPhoneCodeApi({
      mobile: resetForm.phone,
      channel: 'change_passwd'
    })

    ElMessage.success('验证码已发送到手机')

    // 启动倒计时
    startCountdown()
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('发送验证码失败，请稍后重试')
  }
}

// 打开修改密码弹窗
const openPasswordDialog = () => {
  if (!userData.value.id) {
    ElMessage.warning('账户信息不完整，请刷新页面后重试')
    return
  }

  // 重置表单
  Object.keys(resetForm).forEach((key) => {
    resetForm[key] = ''
  })

  passwordDialogVisible.value = true
}

// 处理修改密码
const handleUpdatePassword = async () => {
  if (!userData.value.id) {
    ElMessage.warning('账户信息不完整，无法修改密码')
    return
  }

  // 表单验证
  resetFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true

    try {
      // 构建请求参数
      const params = {
        id: userData.value.id,
        password: resetForm.password,
        verify_code: resetForm.code,
        phone: resetForm.phone
      }

      // 调用修改密码API
      await changePasswordApi(params)
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
  if (!userData.value.pay_address) {
    ElMessage.warning('收款地址为空，无法复制')
    return
  }

  copy(userData.value.pay_address)
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
.pw-reset-container {
  width: 100%;
}
</style>
