<script setup lang="ts">
import { ref, watch, computed, defineExpose } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import { Dialog } from '@/components/Dialog'
import { useValidator } from '@/hooks/web/useValidator'

const { t } = useI18n()
const { required } = useValidator()

const props = defineProps({
  currentRow: Object,
  dialogTitle: String,
  saveLoading: Boolean,
  actionType: String,
  roleOptions: {
    type: Array,
    default: () => []
  },
  roleOptionsLoading: Boolean
})

const dialogVisible = ref(false)
const formLoading = ref(false)

// 内部自定义表单schema
const formSchema = computed<FormSchema[]>(() => [
  {
    field: 'username',
    label: t('userDemo.username'),
    component: 'Input',
    componentProps: {
      placeholder: t('userDemo.username')
    }
  },
  {
    field: 'role_id',
    label: t('userDemo.role'),
    component: 'Select',
    componentProps: {
      placeholder: t('userDemo.role'),
      options: props.roleOptions
    }
  },
  {
    field: 'status',
    label: t('userDemo.status'),
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: t('userDemo.enable'), value: 1 },
        { label: t('userDemo.disable'), value: 0 }
      ]
    }
  },
  {
    field: 'password',
    label: t('userDemo.password'),
    component: 'Input',
    componentProps: {
      type: 'password',
      showPassword: true,
      placeholder: t('userDemo.inputPassword')
    },
    ifShow: () => props.actionType === 'add'
  },
  {
    field: 'confirmPassword',
    label: t('userDemo.confirmPassword'),
    component: 'Input',
    componentProps: {
      type: 'password',
      showPassword: true,
      placeholder: t('userDemo.inputConfirmPassword')
    },
    ifShow: () => props.actionType === 'add'
  }
])

const rules = {
  username: [required()],
  status: [required()]
}

const { formRegister, formMethods } = useForm()
const { setValues, getFormData, getElFormExpose } = formMethods

// 只在弹窗打开时回显表单
const open = () => {
  dialogVisible.value = true
  if (!props.currentRow) {
    setValues({ username: '', status: 1, role_id: undefined, password: '', confirmPassword: '' })
  } else {
    setValues(props.currentRow)
  }
}
const close = () => {
  dialogVisible.value = false
}
const submit = async () => {
  const elForm = await getElFormExpose()
  const valid = await elForm?.validate().catch(() => {})
  if (valid) {
    const formData = await getFormData()
    return formData
  }
}
defineExpose({ open, close, submit })
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" :fullscreen="false" width="50%">
    <Form
      :rules="rules"
      @register="formRegister"
      :schema="formSchema"
      :loading="formLoading || roleOptionsLoading"
    />
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </Dialog>
</template>
