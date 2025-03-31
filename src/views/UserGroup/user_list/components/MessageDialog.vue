<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1200px">
    <Form :schema="formSchema" @register="messageFormRegister" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">发送</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, computed, reactive, watch, defineProps, defineEmits } from 'vue'
import { ElButton, ElMessage, ElCheckbox, ElCheckboxGroup } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { sendMessageToUserApi, massSendMessageApi } from '@/api/tgUser'
import { useRouter } from 'vue-router'
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  type: {
    type: String as () => 'single' | 'mass',
    default: 'single'
  },
  user: {
    type: Object,
    default: () => ({})
  },
  botList: {
    type: Array as () => Array<{ label: string; value: number | string }>,
    default: () => []
  }
})
console.log('props', props)
const emit = defineEmits(['update:modelValue', 'success'])

const { required } = useValidator()
const submitting = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const router = useRouter()

const dialogTitle = computed(() => (props.type === 'single' ? '发送消息' : '群发消息'))

const checkList = ref([])

// 表单相关
const { formRegister: messageFormRegister, formMethods } = useForm()

// 根据类型动态生成表单配置
const formSchema = computed<FormSchema[]>(() => {
  const baseSchema: FormSchema[] = [
    {
      field: 'content',
      component: 'Input',
      label: '消息内容',
      colProps: { span: 24 },
      componentProps: {
        type: 'textarea',
        rows: 4,
        placeholder: '请输入消息内容'
      },
      formItemProps: {
        rules: [required()]
      }
    },
    {
      field: 'inline_button',
      component: 'Input',
      label: '内联按钮',
      colProps: { span: 12 },
      formItemProps: {
        slots: {
          default: () => {
            return (
              <>
                <div>
                  <div>
                    <button onClick={goToMenu}>去添加</button>
                  </div>
                  <ElCheckboxGroup v-model={checkList}>
                    <ElCheckbox label="Option A" value="Value A" border />
                    <ElCheckbox label="Option B" value="Value B" border />
                    <ElCheckbox label="Option C" value="Value C" border />
                  </ElCheckboxGroup>
                </div>
              </>
            )
          }
        }
      },
      componentProps: {
        placeholder: '内联按钮设置'
      }
    }
  ]

  // 群发消息时需要增加筛选条件
  if (props.type === 'mass') {
    return [
      {
        field: 'bot_id',
        component: 'Select',
        label: '选择机器人',
        colProps: { span: 12 },
        componentProps: {
          options: props.botList,
          placeholder: '请选择机器人'
        },
        formItemProps: {
          rules: [required()]
        }
      },
      {
        field: 'filter_type',
        component: 'RadioGroup',
        label: '接受用户',
        value: 'custom',
        colProps: { span: 12 },
        componentProps: {
          options: [
            { label: '自定义', value: 'custom' },
            { label: '全部', value: 'all' }
          ]
        },
        formItemProps: {
          rules: [required()]
        }
      },
      {
        field: 'user_list',
        component: 'Input',
        label: 'TG用户id',
        colProps: { span: 24 },
        componentProps: {
          type: 'text',
          placeholder: '请输入TG用户id'
        }
        // hidden: (model: any) => model.filter_type !== 'custom',
        // formItemProps: {
        //   rules: [(model: any) => (model.filter_type === 'custom' ? required() : null)]
        // }
      },
      ...baseSchema
    ]
  } else {
    // 单发消息时设置用户信息（只读）
    return [
      {
        field: 'firstname',
        component: 'Input',
        label: '机器人用户名',
        colProps: { span: 12 }
      },
      {
        field: 'bot_name',
        component: 'Input',
        label: '机器人名称',
        colProps: { span: 12 }
      },
      {
        field: 'tg_nickname',
        component: 'Input',
        label: 'TG用户ID',
        colProps: { span: 12 }
      },
      {
        field: 'tg_nickname',
        component: 'Input',
        label: 'TG用户名称',
        colProps: { span: 12 }
      },
      ...baseSchema
    ]
  }
})

// 初始化表单数据
watch(
  () => props.user,
  (newVal) => {
    if (props.type === 'single' && newVal) {
      formMethods?.setValues({
        tg_user_id: newVal.tg_user_id,
        tg_nickname: newVal.tg_nickname
      })
    }
  },
  { immediate: true }
)

// 监听对话框打开，获取机器人列表
watch(
  () => dialogVisible.value,
  (val) => {
    if (val && props.type === 'mass') {
      // 不需要再调用fetchBotList
      // 已通过props传入
    }
  }
)

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false
}

const goToMenu = () => {
  router.push('/bot_manage/menu_list')
}

// 提交消息
const handleSubmit = async () => {
  const elForm = await formMethods.getElFormExpose()
  await elForm?.validate(async (valid) => {
    if (!valid) return

    const formData = await formMethods.getFormData()
    submitting.value = true

    try {
      // 根据消息类型调用不同的API
      if (props.type === 'single') {
        await sendMessageToUserApi({
          tg_user_id: props.user?.tg_user_id,
          bot_id: props.user?.bot_id,
          message_type: formData.message_type,
          content: formData.content
        })
      } else {
        // 群发消息
        await massSendMessageApi({
          bot_id: formData.bot_id,
          filter_type: formData.filter_type,
          message_type: formData.message_type,
          content: formData.content
        })
      }

      // 发送成功
      emit('success')
      // 重置表单 (使用正确的方法)
      await elForm.resetFields()
      ElMessage.success(`${props.type === 'single' ? '消息' : '群发消息'}发送成功`)
      dialogVisible.value = false
    } catch (error) {
      console.error('消息发送失败:', error)
      ElMessage.error('消息发送失败，请重试')
    } finally {
      submitting.value = false
    }
  })
}
</script>
