<template>
  <Dialog v-model="dialogVisible" title="机器人续费" maxHeight="150px">
    <div class="text-lg font-bold mb-4"> 机器人费用：{{ fee }} PRX/月 </div>
    <Form :schema="formSchema" @register="formRegister" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="close">取消</ElButton>
        <ElButton type="primary" @click="submit">确认续费</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'

const props = defineProps({
  fee: {
    type: [Number, String],
    default: 0
  }
})

const emit = defineEmits(['success', 'close'])
const dialogVisible = ref(false)
const currentBot = ref<Record<string, any>>({})

const { required } = useValidator()
const { formRegister, formMethods } = useForm()

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'months',
    component: 'InputNumber' as const,
    label: '续费月数：',
    componentProps: {
      placeholder: '请输入续费月数',
      min: 1,
      max: 36,
      controlsPosition: 'right'
    },
    formItemProps: {
      rules: [required()]
    }
  }
])

// 打开弹窗
const open = (botInfo: Record<string, any>) => {
  currentBot.value = botInfo
  dialogVisible.value = true

  // 设置表单数据
  formMethods.setValues({
    fee: botInfo.fee || 0,
    months: 1
  })
}

// 关闭弹窗
const close = () => {
  dialogVisible.value = false
  emit('close')
}

// 提交表单
const submit = async () => {
  const elForm = await formMethods.getElFormExpose()

  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()

    try {
      // 这里应该调用真实的续费API
      console.log('提交的续费数据:', {
        ...formData,
        botId: currentBot.value.botId,
        botUsername: currentBot.value.botUsername
      })

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500))

      ElMessage.success('续费成功')
      dialogVisible.value = false
      emit('success')
    } catch (error) {
      console.error('续费失败:', error)
      ElMessage.error('续费失败，请稍后重试')
    }
  })
}

// 暴露方法
defineExpose({
  open
})
</script>
