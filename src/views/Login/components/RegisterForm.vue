<script setup lang="tsx">
import { Form, FormSchema } from '@/components/Form'
import { reactive, ref, unref, computed } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useForm } from '@/hooks/web/useForm'
import { ElInput, FormRules, ElTabs, ElTabPane } from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { BaseButton } from '@/components/Button'
import { IAgree } from '@/components/IAgree'

const emit = defineEmits(['to-login'])

const { formRegister, formMethods } = useForm()
const { getElFormExpose } = formMethods

const { t } = useI18n()

const { required, check } = useValidator()

// 添加注册类型切换
const registerType = ref('phone') // 'phone' 或 'email'

// 验证码倒计时相关
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
const sendCode = async () => {
  // TODO: 这里添加发送验证码的 API 调用
  startCountdown()
}

// 切换注册方式时清空表单
const handleTabChange = () => {
  clearForm()
}

const clearForm = () => {
  formMethods.setValues({
    username: '',
    password: '',
    check_password: '',
    phone: '',
    email: '',
    code: '',
    iAgree: false
  })
}

// 根据注册类型选择不同的验证规则
const rules = computed<FormRules>(() => {
  return registerType.value === 'phone'
    ? {
        username: [required()],
        password: [required()],
        check_password: [required()],
        phone: [required()],
        code: [required()],
        iAgree: [required(), check()]
      }
    : {
        username: [required()],
        password: [required()],
        check_password: [required()],
        email: [required()],
        code: [required()],
        iAgree: [required(), check()]
      }
})

// 手机注册表单
const phoneSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <h2 class="text-2xl font-bold text-center w-[100%] mb-4">{t('login.register')}</h2>
              <ElTabs v-model={registerType.value} class="w-[100%]" onTabChange={handleTabChange}>
                <ElTabPane label={t('login.phoneRegister')} name="phone"></ElTabPane>
                <ElTabPane label={t('login.emailRegister')} name="email"></ElTabPane>
              </ElTabs>
            </>
          )
        }
      }
    }
  },
  {
    field: 'username',
    label: t('login.username'),
    value: '',
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: t('login.usernamePlaceholder')
    }
  },
  {
    field: 'phone',
    label: t('login.phoneNumber'),
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: t('login.inputPhoneNumber')
    }
  },
  {
    field: 'code',
    label: t('login.code'),
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      placeholder: t('login.codePlaceholder'),
      slots: {
        append: () => (
          <BaseButton
            type="primary"
            class="send-code-btn"
            disabled={isCounting.value}
            onClick={sendCode}
          >
            {isCounting.value ? `${countdown.value}秒` : t('login.getCode')}
          </BaseButton>
        )
      }
    }
  },
  {
    field: 'password',
    label: t('login.password'),
    value: '',
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'check_password',
    label: t('login.checkPassword'),
    value: '',
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'register',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="w-[100%]">
                <BaseButton
                  type="primary"
                  class="w-[100%]"
                  loading={loading.value}
                  onClick={register}
                >
                  {t('login.register')}
                </BaseButton>
              </div>
              <div class="w-[100%] mt-15px">
                <BaseButton class="w-[100%]" onClick={toLogin}>
                  {t('login.hasUser')}
                </BaseButton>
              </div>
            </>
          )
        }
      }
    }
  }
])

// 邮箱注册表单
const emailSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <h2 class="text-2xl font-bold text-center w-[100%] mb-4">{t('login.register')}</h2>
              <ElTabs v-model={registerType.value} class="w-[100%]" onTabChange={handleTabChange}>
                <ElTabPane label={t('login.phoneRegister')} name="phone"></ElTabPane>
                <ElTabPane label={t('login.emailRegister')} name="email"></ElTabPane>
              </ElTabs>
            </>
          )
        }
      }
    }
  },
  {
    field: 'username',
    label: t('login.username'),
    value: '',
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: t('login.usernamePlaceholder')
    }
  },
  {
    field: 'email',
    label: t('login.email'),
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: t('login.inputEmail')
    }
  },
  {
    field: 'code',
    label: t('login.code'),
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      placeholder: t('login.codePlaceholder'),
      slots: {
        append: () => (
          <BaseButton
            type="primary"
            class="send-code-btn"
            disabled={isCounting.value}
            onClick={sendCode}
          >
            {isCounting.value ? `${countdown.value}秒` : t('login.getCode')}
          </BaseButton>
        )
      }
    }
  },
  {
    field: 'password',
    label: t('login.password'),
    value: '',
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'check_password',
    label: t('login.checkPassword'),
    value: '',
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      strength: true,
      placeholder: t('login.passwordPlaceholder')
    }
  },
  {
    field: 'iAgree',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: (formData: any) => {
          return (
            <>
              <IAgree
                v-model={formData.iAgree}
                text={t('login.iAgreeText')}
                link={[
                  {
                    text: t('login.userAgreement'),
                    url: 'https://element-plus.org/'
                  }
                ]}
              />
            </>
          )
        }
      }
    }
  },
  {
    field: 'register',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="w-[100%]">
                <BaseButton
                  type="primary"
                  class="w-[100%]"
                  loading={loading.value}
                  onClick={register}
                >
                  {t('login.register')}
                </BaseButton>
              </div>
              <div class="w-[100%] mt-15px">
                <BaseButton class="w-[100%]" onClick={toLogin}>
                  {t('login.hasUser')}
                </BaseButton>
              </div>
            </>
          )
        }
      }
    }
  }
])

// 根据注册类型切换表单
const schema = computed(() => {
  return registerType.value === 'phone' ? phoneSchema : emailSchema
})

const toLogin = () => {
  emit('to-login')
}

const loading = ref(false)

const register = async () => {
  const formRef = await getElFormExpose()
  formRef?.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        // 检查密码是否一致
        const formData = await formMethods.getFormData()
        if (formData.password !== formData.check_password) {
          // 可以添加一个错误提示
          return
        }
        // TODO: 根据注册类型调用不同的注册API
        // if (registerType.value === 'phone') {
        //   await registerByPhoneApi(formData)
        // } else {
        //   await registerByEmailApi(formData)
        // }

        // 注册成功后跳转到登录页
        toLogin()
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <Form
    :schema="schema"
    :rules="rules"
    label-position="top"
    hide-required-asterisk
    size="large"
    class="dark:(border-1 border-[var(--el-border-color)] border-solid)"
    @register="formRegister"
  />
</template>

<style scoped>
.send-code-btn {
  width: 120px;
}
</style>
