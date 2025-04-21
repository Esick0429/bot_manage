<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import Dialog from '@/components/Dialog/src/Dialog.vue'
import Form from '@/components/Form/src/Form.vue'
import { FormSchema } from '@/components/Form'
import request from '@/axios'
import { useForm } from '@/hooks/web/useForm'
import { ElMessage, ElButton } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { formRegister, formMethods } = useForm()
const { getElFormExpose, getFormData } = formMethods

const formSchema = reactive<FormSchema[]>([
  {
    field: 'old_passwd',
    label: '旧密码',
    component: 'Input',
    componentProps: {
      type: 'password',
      showPassword: true,
      placeholder: '请输入旧密码'
    },
    formItemProps: {
      required: true
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'passwd',
    label: '新密码',
    component: 'Input',
    componentProps: {
      type: 'password',
      showPassword: true,
      placeholder: '请输入八位以上密码'
    },
    formItemProps: {
      required: true,
      rules: [
        { required: true, message: '请输入新密码', trigger: 'blur' }
        // 添加其他密码复杂度规则，例如：
        // { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ]
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'confirm_passwd',
    label: '确认新密码',
    component: 'Input',
    componentProps: {
      type: 'password',
      showPassword: true,
      placeholder: '请再次输入新密码'
    },
    formItemProps: {
      required: true
      // 移除自定义验证器，在 submit 中手动验证
      // rules: [
      //   { required: true, message: '请再次输入新密码', trigger: 'blur' },
      //   {
      //     validator: async (rule, value) => {
      //       const formData = await getFormData();
      //       if (value !== formData.passwd) {
      //         throw new Error('两次输入的密码不一致');
      //       }
      //     },
      //     trigger: 'blur'
      //   }
      // ]
    },
    colProps: {
      span: 24
    }
  }
])

const submitLoading = ref(false)

const submit = async () => {
  const form = await getElFormExpose()
  if (!form) return

  await form.validate(async (valid) => {
    if (valid) {
      const formData = await getFormData()
      if (formData.passwd !== formData.confirm_passwd) {
        ElMessage.error('两次输入的密码不一致')
        return
      }

      submitLoading.value = true
      try {
        const res = await request.post({
          url: '/v2/manage/user/changepasswd',
          data: {
            old_passwd: formData.old_passwd,
            passwd: formData.passwd
          }
        })
        if (res && res.code == '000000') {
          ElMessage.success('密码修改成功')
          emit('success')
          dialogVisible.value = false
          userStore.logout()
        } else {
          ElMessage.error('密码修改失败')
        }
      } catch (e: any) {
        console.error(e)
        ElMessage.error(e.message || '请求失败，请稍后再试')
      } finally {
        submitLoading.value = false
      }
    }
  })
}
</script>

<template>
  <Dialog v-model="dialogVisible" title="修改密码" width="500px">
    <Form :schema="formSchema" label-width="120px" @register="formRegister" />

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="submitLoading">确定</el-button>
    </template>
  </Dialog>
</template>

<style scoped></style>
