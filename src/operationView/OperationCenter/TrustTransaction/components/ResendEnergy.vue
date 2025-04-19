<template>
  <Dialog v-model="visible" title="补发能量">
    <Form :schema="formSchema" @register="formRegister" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确认补发</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, reactive } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { formatToDateTime } from '@/utils/dateUtil'
// 需要在API文件中定义补发能量的接口
import { resendEnergyApi } from '@/api/trust_transaction'
import type { TrustTransactionItem, ResendEnergyParams } from '@/api/trust_transaction/types'

const emit = defineEmits(['success'])
const { required } = useValidator()
const visible = ref(false)
const currentOrder = ref<TrustTransactionItem | null>(null)

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'orderId',
    component: 'Input' as const,
    label: '订单ID：',
    componentProps: {
      placeholder: '订单ID',
      disabled: true
    }
  },
  {
    field: 'agentId',
    component: 'Input' as const,
    label: '代理ID：',
    componentProps: {
      placeholder: '代理ID',
      disabled: true
    }
  },
  {
    field: 'agentName',
    component: 'Input' as const,
    label: '代理名称：',
    componentProps: {
      placeholder: '代理名称',
      disabled: true
    }
  },
  {
    field: 'energyReceiveAddress',
    component: 'Input' as const,
    label: '能量接收地址：',
    componentProps: {
      placeholder: '能量接收地址',
      disabled: true
    }
  },
  {
    field: 'totalEnergyAmount',
    component: 'InputNumber' as const,
    label: '应发放能量：',
    componentProps: {
      placeholder: '应发放能量',
      disabled: true,
      slots: {
        suffix: () => {
          return <span>Energy</span>
        }
      }
    }
  },
  {
    field: 'resendEnergyAmount',
    component: 'InputNumber' as const,
    label: '补发能量：',
    componentProps: {
      placeholder: '请输入补发能量数量',
      min: 1,
      precision: 0,
      slots: {
        suffix: () => {
          return <span>Energy</span>
        }
      }
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'remark',
    component: 'Input' as const,
    label: '备注：',
    componentProps: {
      placeholder: '请输入备注信息',
      type: 'textarea',
      rows: 3,
      maxlength: 200,
      showWordLimit: true
    }
  }
]) as FormSchema[]

// 使用表单Hook
const { formRegister, formMethods } = useForm()

// 打开弹窗
const open = (row: TrustTransactionItem) => {
  currentOrder.value = row
  visible.value = true

  // 初始化表单
  formMethods.setValues({
    orderId: row.id,
    agentId: row.agentId,
    agentName: row.agentName,
    energyReceiveAddress: row.energyReceiveAddress,
    totalEnergyAmount: row.energyAmount,
    resendEnergyAmount: 0,
    reason: '',
    remark: ''
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!currentOrder.value) return

  const elForm = await formMethods.getElFormExpose()

  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()

    try {
      // 调用API进行能量补发
      const params: ResendEnergyParams = {
        id: formData.orderId,
        amount: formData.resendEnergyAmount,
        reason: formData.reason,
        remark: formData.remark
      }

      // 使用导入的API函数
      const result = await resendEnergyApi(params)

      if (result && result.code === '000000') {
        ElMessage.success('能量补发操作成功')
        visible.value = false
        emit('success')
      } else {
        ElMessage.error('能量补发操作失败')
      }
    } catch (error) {
      console.error('能量补发出错:', error)
      ElMessage.error('能量补发操作失败')
    }
  })
}

defineExpose({
  open
})
</script>

<style scoped>
.resend-energy-form {
  padding: 0 20px;
}
</style>
