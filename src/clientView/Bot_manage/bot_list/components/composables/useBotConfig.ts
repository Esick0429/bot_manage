import { ref, reactive } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import {
  getBotDetailApi,
  syncTgStatusApi,
  getBotPaymentConfigApi,
  updateBotApi,
  updateBotPaymentConfigApi
} from '@/api/credit/botlist'
// 导入类型
import type { BotPaymentConfig } from '@/api/credit/botlist/types'

// 定义通用的API响应类型
type ApiResponse = Promise<{
  code: string | number
  data?: any
  message?: string
}>

export function useBotConfig() {
  // 共享状态
  const dialogVisible = ref(false)
  const activeTab = ref('botInfo')
  const currentBot = ref<Record<string, any>>({})
  const tgStatus = ref('pending')
  const syncing = ref(false)
  const loading = ref(false)
  const submitting = ref(false)

  // TG状态同步
  const syncTgStatus = async () => {
    if (syncing.value) return

    try {
      syncing.value = true
      ElMessage.info('正在同步TG状态...')

      const res = await syncTgStatusApi(String(currentBot.value.id))
      const data = res.data || {}

      // 更新状态
      tgStatus.value = data.status || 'pending'

      ElMessage.success('TG状态同步' + (tgStatus.value === 'success' ? '成功' : '失败'))
    } catch (error) {
      console.error('TG状态同步失败:', error)
      ElMessage.error('TG状态同步失败，请稍后重试')
      // 同步失败时设置为error状态
      tgStatus.value = 'error'
    } finally {
      syncing.value = false
    }
  }

  // 加载机器人配置
  const loadBotAllConfigs = async (id: number, formMethods: any, formType?: string) => {
    if (!id) {
      ElMessage.error('机器人ID不能为空')
      return
    }

    const loadingInstance = ElLoading.service({
      target: '.el-dialog__body',
      text: '加载配置中...'
    })

    loading.value = true

    try {
      // 策略模式：定义加载各种表单类型的策略
      const loadStrategies = {
        // 基本信息加载策略
        botInfo: async () => {
          try {
            // 1. 优先尝试 getBotDetailApi 获取详细信息
            let botInfo: any = {}
            try {
              const detailRes = await getBotDetailApi(String(id))
              botInfo = detailRes.data || {}
            } catch (detailError) {
              console.warn(
                'getBotDetailApi 调用失败，尝试从 getBotPaymentConfigApi 获取信息:',
                detailError
              )
              // 如果 getBotDetailApi 失败，尝试从 payment API 获取（作为备选）
              const paymentRes = await getBotPaymentConfigApi(id)
              botInfo = paymentRes.data || {}
            }

            // 设置TG同步状态
            tgStatus.value = botInfo.tgVerifyStatus || 'pending'

            formMethods.botInfo.setValues({
              ...botInfo,
              id: botInfo.id || '',
              botName: botInfo.botName || '',
              botUsername: botInfo.botUsername || '',
              botToken: botInfo.botToken || '',
              apiKey: botInfo.apiKey || '',
              adminTgAccount: botInfo.adminTgAccount || '',
              remark: botInfo.remark || '',
              status: botInfo.status === undefined ? true : botInfo.status
            })

            // 更新当前机器人对象
            currentBot.value = botInfo

            return true
          } catch (error) {
            console.error('加载基本信息失败:', error)
            return false
          }
        },

        // 收款配置加载策略
        payment: async () => {
          try {
            const paymentConfigRes = await getBotPaymentConfigApi(id)
            const paymentConfig = paymentConfigRes.data || {}
            console.log('paymentConfig', paymentConfigRes.data)
            // 存储 payment config id
            currentBot.value.paymentConfigId = paymentConfig.id

            formMethods.payment.setValues({
              username: paymentConfig.username || '', // 使用类型定义中的 username
              energy_address: paymentConfig.flashPaymentWallet || '', // 使用类型定义中的 flashPaymentWallet
              receive_address: paymentConfig.balancePaymentWallet || '', // 使用类型定义中的 balancePaymentWallet
              notice_order_tg_admin: paymentConfig.notice_order_tg_admin === 1 // 假设API有这个字段，但类型定义没有
            })
            return true
          } catch (error) {
            console.error('加载收款配置失败:', error)
            return false
          }
        }
      }

      // 如果指定了表单类型，则只加载该类型的表单
      if (formType) {
        const strategy = loadStrategies[formType]

        if (!strategy) {
          ElMessage.warning(`未知的表单类型: ${formType}`)
          return
        }

        await strategy()
      }
      // 如果没有指定表单类型，则加载所有表单（兼容原有逻辑）
      else {
        const strategyNames = Object.keys(loadStrategies)

        // 执行所有可用的策略
        for (const name of strategyNames) {
          if (formMethods[name]) {
            try {
              await loadStrategies[name]()
            } catch (error) {
              console.error(`执行${name}加载策略失败:`, error)
            }
          }
        }
      }
    } catch (error) {
      console.error('加载机器人配置失败:', error)
      ElMessage.error('加载机器人配置失败，请稍后重试')
    } finally {
      // 延迟关闭loading状态，给用户更好的体验
      setTimeout(() => {
        loading.value = false
        loadingInstance.close()
      }, 500)
    }
  }

  // 提交表单
  const submitConfig = async (formMethods: any, formType?: string) => {
    if (submitting.value) return false

    submitting.value = true
    // ElMessage.info('正在保存配置...')

    try {
      if (!currentBot.value.id) {
        ElMessage.error('机器人ID不能为空')
        return false
      }

      const id = currentBot.value.id
      let hasError = false
      let result = false

      // 策略模式：定义处理各种表单类型的策略对象
      const formStrategies = {
        // 基本信息配置策略
        botInfo: async () => {
          if (!formMethods.botInfo) return false
          try {
            const botInfoData = await formMethods.botInfo.getFormData()
            const res = await updateBotApi({ ...botInfoData, id })
            return res.code === '000000'
          } catch (error) {
            console.error('保存基本信息配置失败:', error)
            return false
          }
        },

        // 收款配置策略
        payment: async () => {
          if (!formMethods.payment) return false
          try {
            const paymentData = await formMethods.payment.getFormData()
            // 确认API需要的参数结构和字段名
            const apiData: BotPaymentConfig = {
              id: currentBot.value.paymentConfigId || 0, // 从存储的值获取 ID，提供默认值以防万一
              botId: id,
              username: paymentData.username,
              flashPaymentWallet: paymentData.energy_address,
              balancePaymentWallet: paymentData.receive_address
            }
            const res = await updateBotPaymentConfigApi(apiData)
            return res.code === '000000'
          } catch (error) {
            console.error('保存收款配置失败:', error)
            return false
          }
        }
      }

      // 如果指定了表单类型，则只处理该类型的表单
      if (formType) {
        const strategy = formStrategies[formType]

        if (!strategy) {
          ElMessage.warning(`未知的表单类型: ${formType}`)
          submitting.value = false
          return false
        }

        result = await strategy()
        console.log('result', result)
        if (result) {
          console.log('res>>>>>>>>>>>>>>>>>>>>>>>>ult', result)
          ElMessage.success('配置保存成功')
        } else {
          ElMessage.error('配置保存失败，请稍后重试')
          hasError = true
        }

        submitting.value = false
        return result
      }
      // 如果没有指定表单类型，则处理所有表单（兼容原有逻辑）
      else {
        const promises: ApiResponse[] = []
        const strategyNames = Object.keys(formStrategies)

        // 执行所有可用的策略
        for (const name of strategyNames) {
          if (formMethods[name]) {
            try {
              const success = await formStrategies[name]()
              if (!success) {
                hasError = true
              }
            } catch (error) {
              console.error(`执行${name}策略失败:`, error)
              hasError = true
            }
          }
        }

        if (hasError) {
          ElMessage.warning('部分配置保存失败，请检查日志')
        } else {
          ElMessage.success('配置保存成功')
        }

        submitting.value = false
        return !hasError
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      ElMessage.error('保存配置失败，请稍后重试')
      submitting.value = false
      return false
    }
  }

  return {
    dialogVisible,
    activeTab,
    currentBot,
    tgStatus,
    syncing,
    loading,
    submitting,
    syncTgStatus,
    loadBotAllConfigs,
    submitConfig
  }
}
