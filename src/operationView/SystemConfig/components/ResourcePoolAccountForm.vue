<template>
  <Dialog v-model="visible" :title="dialogTitle">
    <Form :schema="formSchema" @register="formRegister" :isCol="true" :gridColumns="1" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting">确定</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import {
  createResourcePoolAccountApi,
  updateResourcePoolAccountApi
} from '@/api/system/resource_pool_account'

// 定义类型
interface FormData {
  id?: number
  configType: string
  publicKey: string
  privateKey: string
  status: number
  [key: string]: any
}

interface OpenParams {
  mode: 'add' | 'edit'
  data?: Partial<FormData>
}

const emit = defineEmits(['success'])
const visible = ref(false)
const submitting = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const currentData = ref<Partial<FormData>>({})
const { required } = useValidator()

// 弹窗标题
const dialogTitle = computed(() => {
  return formMode.value === 'add' ? '新增资源池账户' : '编辑资源池账户'
})

// 表单配置
const formSchema = reactive<FormSchema[]>([
  {
    field: 'configType',
    component: 'Select',
    label: '配置类型：',
    componentProps: {
      placeholder: '请选择配置类型',
      options: [
        { label: 'USDT池子', value: 1 },
        { label: 'TRX池子', value: 2 },
        { label: '能量池子', value: 3 },
        { label: '带宽池子', value: 4 }
      ]
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'publicKey',
    component: 'Input',
    label: '公钥：',
    componentProps: {
      placeholder: '请输入公钥',
      maxlength: 200
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'privateKey',
    component: 'Input',
    label: '私钥：',
    componentProps: {
      placeholder: '请输入私钥',
      maxlength: 200,
      type: 'password',
      showPassword: true
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'status',
    component: 'RadioGroup',
    label: '状态：',
    componentProps: {
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 2 }
      ]
    },
    value: 1
  }
]) as FormSchema[]

// 使用表单Hook
const { formRegister, formMethods } = useForm()

// 打开弹窗
const open = async (params: OpenParams) => {
  formMode.value = params.mode
  visible.value = true
  currentData.value = params.data || {}

  await nextTick()

  const formExpose = await formMethods.getFormExpose()
  if (formExpose) {
    // 设置表单值
    formMethods.setValues({
      configType: currentData.value.configType || '',
      publicKey: currentData.value.publicKey || '',
      privateKey: currentData.value.privateKey || '',
      status: currentData.value.status === 2 ? 2 : 1
    })
  }
}

// 提交表单
const handleSubmit = async () => {
  const elForm = await formMethods.getElFormExpose()

  await elForm?.validate(async (valid: boolean) => {
    if (!valid) return

    const formData = await formMethods.getFormData()
    submitting.value = true

    // 更新: 准备提交给后端的数据
    const dataToSubmit = {
      resource_type: formData.configType,
      public_key: formData.publicKey,
      private_key: formData.privateKey,
      status: formData.status
    }

    try {
      if (formMode.value === 'add') {
        const res = await createResourcePoolAccountApi(dataToSubmit)
        ElMessage.success('新增成功')
      } else {
        const res = await updateResourcePoolAccountApi({
          id: currentData.value.id,
          ...dataToSubmit
        })
        ElMessage.success('更新成功')
      }

      visible.value = false
      emit('success')
    } catch (error) {
      console.error('提交失败:', error)
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error(`操作失败: ${message}`)
    } finally {
      submitting.value = false
    }
  })
}

defineExpose({
  open
})
</script>
