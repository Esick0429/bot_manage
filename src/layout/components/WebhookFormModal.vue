<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
  ElSelect,
  ElOption
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
// 假设你有一个封装好的 axios 实例
import request from '@/axios'
import { any } from 'vue-types'

// 定义 API 响应结构接口 - 调整 code 类型
interface ApiResponse<T = any> {
  code: string | number // <--- 修改：允许字符串或数字
  data: T
  msg?: string
}

// 定义 props
const props = defineProps<{
  visible: boolean
}>()

// 定义 emits
const emit = defineEmits<{
  (e: 'close'): void
}>()

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const loading = ref(false)

// 表单数据模型，基于你提供的 JSON 结构
const formData = reactive({
  address: '', // 被监控地址hash
  txid: '', // 交易hash
  time: new Date().getTime(), // 交易发生时间UTC (使用 null 作为初始值)
  // confirmations: null as number | null, // 通知第一次发出时此交易的确认数
  value: '', // 余额变化数量
  coin: 'TRX', // 交易发生在哪条链上
  height: null as number | null, // 交易被打包的区块高度
  tokenSymbol: 'TRX', // token的符号单位
  tokenValue: null as string | null, // token的数量变化
  tokenAddress: null as string | null // token的地址
})

// 表单校验规则 (可以根据需要添加更详细的规则)
const rules = reactive<FormRules>({
  address: [{ required: true, message: '请输入监控地址', trigger: 'blur' }],
  txid: [{ required: true, message: '请输入交易哈希', trigger: 'blur' }],
  time: [{ required: true, type: 'number', message: '请输入有效的交易时间戳', trigger: 'blur' }],
  value: [{ required: true, message: '请输入余额变化数量', trigger: 'blur' }]
  // coin: [{ required: true, message: '请输入币种', trigger: 'blur' }]
  // 其他字段根据需要添加校验
})

// 监听外部传入的 visible prop 变化，同步到内部 dialogVisible
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal
    if (newVal) {
      // 可选：每次打开时重置表单
      // formRef.value?.resetFields()
      // 或者清空数据
      Object.assign(formData, {
        address: '',
        txid: '',
        time: null,
        confirmations: null,
        value: '',
        coin: '',
        height: null,
        Address: null,
        tokenSymbol: null,
        tokenValue: null
      })
    }
  }
)

// 处理模态框关闭事件，通知父组件
const handleClose = () => {
  // 重置校验状态以防下次打开时显示错误
  formRef.value?.clearValidate()
  emit('close')
}

// 处理表单提交
const handleSubmit = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 准备要发送的数据 - 显式构造，只包含有值的字段
        const postData: Record<string, any> = {
          address: formData.address,
          txid: formData.txid,
          time: new Date().getTime(),
          value: formData.value,
          coin: 'TRX',
          tokenSymbol: formData.tokenSymbol,
          tokenAddress: formData.tokenAddress
        }

        if (formData.height !== null) {
          postData.height = formData.height
        }
        if (formData.tokenSymbol == 'TRX') {
          postData.tokenSymbol = null
        }
        if (formData.tokenValue !== null) {
          postData.tokenValue = formData.tokenValue
        }

        console.log('提交数据:', postData)
        // 调用 API - 明确指定或断言响应类型
        const res: ApiResponse = await request.post({
          url: '/public/v1/order/webhook',
          data: postData
        })
        console.log('API 响应:', res)
        // 根据 code 判断成功或失败
        ElMessage.success(res.msg || 'Webhook 配置成功！') // 可以使用 res.msg 作为成功提示
      } catch (error: any) {
        // 显式添加 error 类型
        console.error('Webhook 配置失败:', error)
        // catch 块处理网络错误或其他异常
        ElMessage.error(error?.message || '配置请求失败，请检查网络或联系管理员')
      } finally {
        loading.value = false
      }
    } else {
      console.log('表单校验失败!')
    }
  })
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    title="配置 Webhook"
    width="600px"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="140px">
      <ElFormItem label="监控地址 (address)" prop="address">
        <ElInput v-model="formData.address" placeholder="请输入被监控地址哈希" />
      </ElFormItem>
      <ElFormItem label="交易哈希 (txid)" prop="txid">
        <ElInput v-model="formData.txid" placeholder="请输入交易哈希" />
      </ElFormItem>
      <!-- <ElFormItem label="交易时间 (time)" prop="time">
        <ElInput v-model.number="formData.time" type="number" placeholder="请输入交易时间戳 (UTC)" />
      </ElFormItem> -->
      <!-- <ElFormItem label="确认数 (confirmations)" prop="confirmations">
        <ElInput v-model.number="formData.confirmations" type="number" placeholder="请输入交易确认数" />
      </ElFormItem> -->
      <ElFormItem label="余额变化 (value)" prop="value">
        <ElInput v-model="formData.value" placeholder="例如：-0.002135942" />
      </ElFormItem>
      <!-- <ElFormItem label="币种 (coin)" prop="coin">
        <ElInput disabled v-model="formData.coin"/>
      </ElFormItem> -->
      <ElFormItem label="Token 符号" prop="tokenSymbol">
        <ElSelect v-model="formData.tokenSymbol" placeholder="请选择Token符号">
          <ElOption label="TRX" value="TRX" />
          <ElOption label="USDT" value="USDT" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Token 数量变化" prop="tokenValue">
        <ElInput v-model="formData.tokenValue" placeholder="（可选）例如：-159" />
      </ElFormItem>
      <ElFormItem label="Token 地址" prop="tokenAddress">
        <ElInput v-model="formData.tokenAddress" placeholder="" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" :loading="loading" @click="handleSubmit(formRef)">
          确定提交
        </ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<style scoped>
/* 可以添加一些自定义样式 */
.dialog-footer button:first-child {
  margin-right: 10px;
}
</style>
