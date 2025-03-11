<script setup lang="tsx">
import { reactive, ref, watch, onMounted, unref, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useI18n } from '@/hooks/web/useI18n'
import { ElCheckbox, ElLink, ElTabs, ElTabPane, ElInput, ElButton } from 'element-plus'
import { useForm } from '@/hooks/web/useForm'
import { loginApi, getTestRoleApi, getAdminRoleApi } from '@/api/login'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { UserType } from '@/api/login/types'
import { useValidator } from '@/hooks/web/useValidator'
import { Icon } from '@/components/Icon'
import { useUserStore } from '@/store/modules/user'
import { BaseButton } from '@/components/Button'

const { required } = useValidator()

const emit = defineEmits(['to-register'])

const appStore = useAppStore()

const userStore = useUserStore()

const permissionStore = usePermissionStore()

const { currentRoute, addRoute, push, replace } = useRouter()

const { t } = useI18n()

// 添加登录类型切换
const loginType = ref('account') // 'account' 或 'phone'

// 根据登录类型使用不同的验证规则
const rules = computed(() => {
  return loginType.value === 'account'
    ? {
        username: [required()],
        password: [required()]
      }
    : {
        phone: [required()],
        code: [required()]
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
const sendCode = async () => {
  // TODO:这里添加发送验证码的 API 调用
  // const formData = await getFormData()
  // await sendSmsCodeApi(formData.phone)
  // 启动倒计时
  startCountdown()
}

// 修改 schema 使用计算属性，根据当前登录类型返回对应表单
const schema = computed(() => {
  return loginType.value === 'account' ? accountSchema : phoneSchema
})
const handleTabChange = (tab: string) => {
  // loginType.value = tab
  clearForm()
}

const clearForm = () => {
  formMethods.setValues({
    username: '',
    password: '',
    phone: '',
    code: ''
  })
}

// 账号密码登录表单
const accountSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <ElTabs v-model={loginType.value} class="w-[100%]" onTabChange={handleTabChange}>
                <ElTabPane label={t('login.accountLogin')} name="account"></ElTabPane>
                <ElTabPane label={t('login.phoneLogin')} name="phone"></ElTabPane>
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
    component: 'Input',
    colProps: { span: 24 },
    componentProps: {
      placeholder: '支持手机号/邮箱登录'
    }
  },
  {
    field: 'password',
    label: t('login.password'),
    component: 'InputPassword',
    colProps: { span: 24 },
    componentProps: {
      style: { width: '100%' },
      placeholder: '请输入密码',
      onKeydown: (_e: any) => {
        if (_e.key === 'Enter') {
          _e.stopPropagation()
          signIn()
        }
      }
    }
  },
  {
    field: 'tool',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="flex justify-between items-center w-[100%]">
                <ElCheckbox v-model={remember.value} label={t('login.remember')} size="small" />
                <ElLink type="primary" underline={false} onClick={toResetPassword}>
                  {t('login.forgetPassword')}
                </ElLink>
              </div>
            </>
          )
        }
      }
    }
  },
  {
    field: 'login',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="w-[100%]">
                <BaseButton
                  loading={loading.value}
                  type="primary"
                  class="w-[100%]"
                  onClick={signIn}
                >
                  {t('login.login')}
                </BaseButton>
              </div>
              <div class="w-[100%] mt-15px">
                <BaseButton class="w-[100%]" onClick={toRegister}>
                  {t('login.register')}
                </BaseButton>
              </div>
            </>
          )
        }
      }
    }
  }
])

// 手机验证码登录表单
const phoneSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <ElTabs v-model={loginType.value} class="w-[100%]" onTabChange={handleTabChange}>
                <ElTabPane label={t('login.accountLogin')} name="account"></ElTabPane>
                <ElTabPane label={t('login.phoneLogin')} name="phone"></ElTabPane>
              </ElTabs>
            </>
          )
        }
      }
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
      onKeydown: (_e: any) => {
        if (_e.key === 'Enter') {
          _e.stopPropagation()
          signIn()
        }
      },
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
    field: 'tool',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="flex justify-between items-center w-[100%]">
                <ElCheckbox v-model={remember.value} label={t('login.remember')} size="small" />
                <ElLink type="primary" underline={false} onClick={toResetPassword}>
                  {t('login.forgetPassword')}
                </ElLink>
              </div>
            </>
          )
        }
      }
    }
  },
  {
    field: 'login',
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <>
              <div class="w-[100%]">
                <BaseButton
                  loading={loading.value}
                  type="primary"
                  class="w-[100%]"
                  onClick={signIn}
                >
                  {t('login.login')}
                </BaseButton>
              </div>
              <div class="w-[100%] mt-15px">
                <BaseButton class="w-[100%]" onClick={toRegister}>
                  {t('login.register')}
                </BaseButton>
              </div>
            </>
          )
        }
      }
    }
  }
])

const iconSize = 30

const remember = ref(userStore.getRememberMe)

const initLoginInfo = () => {
  const loginInfo = userStore.getLoginInfo
  if (loginInfo) {
    const { username, password } = loginInfo
    setValues({ username, password })
  }
}
onMounted(() => {
  initLoginInfo()
})

const { formRegister, formMethods } = useForm()
const { getFormData, getElFormExpose, setValues } = formMethods

const loading = ref(false)

const iconColor = '#999'

const hoverColor = 'var(--el-color-primary)'

const redirect = ref<string>('')

watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)

// 登录
const signIn = async () => {
  const formRef = await getElFormExpose()
  await formRef?.validate(async (isValid) => {
    if (isValid) {
      loading.value = true
      const formData = await getFormData()

      try {
        // 根据登录类型调用不同的登录接口或传递不同参数
        let res
        if (loginType.value === 'account') {
          res = await loginApi(formData as UserType)
        } else {
          // 手机验证码登录
          // 假设使用同一个API但传递不同参数
          res = await loginApi({
            ...formData,
            loginType: 'phone'
          })
        }

        if (res) {
          // 是否记住我
          if (unref(remember)) {
            userStore.setLoginInfo({
              username: formData.username,
              password: formData.password
            })
          } else {
            userStore.setLoginInfo(undefined)
          }
          userStore.setRememberMe(unref(remember))
          userStore.setUserInfo(res.data)
          // 是否使用动态路由
          if (appStore.getDynamicRouter) {
            getRole()
          } else {
            await permissionStore.generateRoutes('static').catch(() => {})
            permissionStore.getAddRouters.forEach((route) => {
              addRoute(route as RouteRecordRaw) // 动态添加可访问路由表
            })
            permissionStore.setIsAddRouters(true)
            push({ path: redirect.value || permissionStore.addRouters[0].path })
          }
        }
      } finally {
        loading.value = false
      }
    }
  })
}

// 获取角色信息
const getRole = async () => {
  const formData = await getFormData()
  const params = {
    roleName: loginType.value === 'account' ? formData.username : formData.phone
  }
  const res =
    appStore.getDynamicRouter && appStore.getServerDynamicRouter
      ? await getAdminRoleApi(params)
      : await getTestRoleApi(params)
  if (res) {
    const routers = res.data || []
    userStore.setRoleRouters(routers)
    appStore.getDynamicRouter && appStore.getServerDynamicRouter
      ? await permissionStore.generateRoutes('server', routers).catch(() => {})
      : await permissionStore.generateRoutes('frontEnd', routers).catch(() => {})

    permissionStore.getAddRouters.forEach((route) => {
      addRoute(route as RouteRecordRaw) // 动态添加可访问路由表
    })
    permissionStore.setIsAddRouters(true)
    push({ path: redirect.value || permissionStore.addRouters[0].path })
  }
}

// 去注册页面
const toRegister = () => {
  emit('to-register')
}

// 跳转到重置密码页面
const toResetPassword = () => {
  console.log('跳转到重置密码页面')
  push('/reset-password')
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
