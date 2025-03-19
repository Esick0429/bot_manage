import { ref, reactive } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import {
  getBotDetailApi,
  syncTgStatusApi,
  updateBotAllConfigsApi,
  getBotPaymentConfigApi,
  getBotTimeEnergyConfigApi,
  getBotCountEnergyConfigApi,
  getBotManagedModeConfigApi,
  getBotBatchOrderConfigApi,
  getBotFlashExchangeConfigApi,
  getCountEnergyConfigApi,
  updateBotApi,
  updateBotPaymentConfigApi,
  updateBotTimeEnergyConfigApi,
  updateBotCountEnergyConfigApi,
  updateBotManagedModeConfigApi,
  updateBotBatchOrderConfigApi,
  updateBotFlashExchangeConfigApi
} from '@/api/botlist'

// 定义通用的API响应类型
type ApiResponse = Promise<{
  code: string | number
  data?: any
  message?: string
}>

// 假设我们有一个成本价API
const getCostPricesApi = () => {
  return fetch('/bot/cost-prices').then((res) => res.json())
}

export function useBotConfig() {
  // 共享状态
  const dialogVisible = ref(false)
  const activeTab = ref('botInfo')
  const currentBot = ref<Record<string, any>>({})
  const tgStatus = ref('pending')
  const syncing = ref(false)
  const loading = ref(false)
  const submitting = ref(false)

  // 成本价配置
  const costPrices = reactive({
    timeEnergy1Hour: 1.0, // 默认成本价
    timeEnergy1Day: 3.0,
    timeEnergy3Days: 8.0,
    timeEnergy7Days: 15.0,
    timeEnergy15Days: 28.0
  })

  // 加载成本价格
  const loadCostPrices = async () => {
    try {
      const response = await getCostPricesApi()
      const data = response.data || {}

      // 更新成本价配置
      Object.keys(data).forEach((key) => {
        if (costPrices[key] !== undefined) {
          costPrices[key] = data[key]
        }
      })
    } catch (error) {
      console.error('加载成本价配置失败:', error)
      ElMessage.warning('成本价配置加载失败，将使用默认值')
    }
  }

  // TG状态同步
  const syncTgStatus = async () => {
    if (syncing.value) return

    try {
      syncing.value = true
      ElMessage.info('正在同步TG状态...')

      const res = await syncTgStatusApi(currentBot.value.id)
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
            const botInfoRes = await getBotPaymentConfigApi(id)
            const botInfo = botInfoRes.data || {}

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
            formMethods.payment.setValues({
              username: paymentConfig.user_name || '',
              energy_address: paymentConfig.energy_address || '',
              receive_address: paymentConfig.receive_address || '',
              notice_order_tg_admin: paymentConfig.notice_order_tg_admin || 2
            })
            return true
          } catch (error) {
            console.error('加载收款配置失败:', error)
            return false
          }
        },

        // 时间能量加载策略
        timeEnergy: async () => {
          try {
            // 获取运营后台配置的成本价
            await loadCostPrices()

            const timeEnergyConfigRes = await getBotTimeEnergyConfigApi(id)
            const timeEnergyConfig = timeEnergyConfigRes.data || {}

            formMethods.timeEnergy.setValues({
              timeEnergyPrice: timeEnergyConfig.price || 0,
              timeEnergyMultiplier: timeEnergyConfig.multiplier || 1,
              timeEnergy1Hour: timeEnergyConfig.timeEnergy1Hour || costPrices.timeEnergy1Hour,
              timeEnergy1Day: timeEnergyConfig.timeEnergy1Day || costPrices.timeEnergy1Day,
              timeEnergy3Days: timeEnergyConfig.timeEnergy3Days || costPrices.timeEnergy3Days,
              timeEnergy7Days: timeEnergyConfig.timeEnergy7Days || costPrices.timeEnergy7Days,
              timeEnergy15Days: timeEnergyConfig.timeEnergy15Days || costPrices.timeEnergy15Days
            })
            return true
          } catch (error) {
            console.error('加载时间能量价格配置失败:', error)
            return false
          }
        },

        // 笔数能量加载策略
        countEnergy: async () => {
          try {
            const countEnergyConfigRes = await getCountEnergyConfigApi(id)
            const countEnergyConfig = countEnergyConfigRes.data || {}

            const countEnergyValues = {
              count_pay_type: countEnergyConfig.count_pay_type,
              count_price_trx: countEnergyConfig.count_price_trx || 0,
              count_price_usdt: countEnergyConfig.count_price_usdt || 0,
              notifyUser: countEnergyConfig.notifyUser || false,
              notifyGroupOwner: countEnergyConfig.notifyGroupOwner || false,
              notifyAdmin: countEnergyConfig.notifyAdmin || false
            }

            // 设置表单值
            formMethods.countEnergy.setValues(countEnergyValues)
            return true
          } catch (error) {
            console.error('加载笔数能量价格配置失败:', error)
            return false
          }
        },

        // 托管模式加载策略
        managedMode: async () => {
          try {
            const managedModeConfigRes = await getCountEnergyConfigApi(id)
            const managedModeConfig = managedModeConfigRes.data || {}

            const managedModeValues = {
              delegate_price_trx: managedModeConfig.delegate_price_trx || 0,
              enable_custom_delegate: managedModeConfig.enable_custom_delegate || false,
              price_trx_65000: managedModeConfig.price_trx_65000 || 0,
              price_trx_131000: managedModeConfig.price_trx_131000 || 0
            }

            // 设置表单值
            formMethods.managedMode.setValues(managedModeValues)
            return true
          } catch (error) {
            console.error('加载托管模式价格配置失败:', error)
            return false
          }
        },

        // 批量下单加载策略
        batchOrder: async () => {
          try {
            const batchOrderConfigRes = await getCountEnergyConfigApi(id)
            const batchOrderConfig = batchOrderConfigRes.data || {}

            const batchOrderValues = {
              batch_energy_price: batchOrderConfig.batch_energy_price || 0,
              batch_active_price: batchOrderConfig.batch_active_price || 1.1
            }

            // 设置表单值
            formMethods.batchOrder.setValues(batchOrderValues)
            return true
          } catch (error) {
            console.error('加载批量下单价格配置失败:', error)
            return false
          }
        },

        // 闪兑加载策略
        flashExchange: async () => {
          try {
            const flashExchangeConfigRes = await getCountEnergyConfigApi(id)
            const flashExchangeConfig = flashExchangeConfigRes.data.exchange || {}

            const flashExchangeValues = {
              transfer_address: flashExchangeConfig.transfer_address || '',
              min_trx_balance: flashExchangeConfig.min_trx_balance || 0,
              profit_usdt_to_trx: flashExchangeConfig.profit_usdt_to_trx || 0,
              max_usdt_to_trx: flashExchangeConfig.max_usdt_to_trx || 0,
              stock_notice: flashExchangeConfig.stock_notice || false,
              stock_notice_trx_amount: flashExchangeConfig.stock_notice_trx_amount || 0
            }

            // 设置表单值
            formMethods.flashExchange.setValues(flashExchangeValues)
            return true
          } catch (error) {
            console.error('加载闪兑配置失败:', error)
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
            await updateBotApi({ ...botInfoData, id })
            return true
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
            await updateBotPaymentConfigApi({ ...paymentData, id })
            return true
          } catch (error) {
            console.error('保存收款配置失败:', error)
            return false
          }
        },

        // 时间能量配置策略
        timeEnergy: async () => {
          if (!formMethods.timeEnergy) return false
          try {
            const timeEnergyData = await formMethods.timeEnergy.getFormData()
            await updateBotTimeEnergyConfigApi({ ...timeEnergyData, id })
            return true
          } catch (error) {
            console.error('保存时间能量配置失败:', error)
            return false
          }
        },

        // 笔数能量配置策略
        countEnergy: async () => {
          if (!formMethods.countEnergy) return false
          try {
            const countEnergyData = await formMethods.countEnergy.getFormData()
            await updateBotCountEnergyConfigApi({ ...countEnergyData, id })
            return true
          } catch (error) {
            console.error('保存笔数能量配置失败:', error)
            return false
          }
        },

        // 托管模式配置策略
        managedMode: async () => {
          if (!formMethods.managedMode) return false
          try {
            const managedModeData = await formMethods.managedMode.getFormData()
            await updateBotManagedModeConfigApi({ ...managedModeData, id })
            return true
          } catch (error) {
            console.error('保存托管模式配置失败:', error)
            return false
          }
        },

        // 批量下单配置策略
        batchOrder: async () => {
          if (!formMethods.batchOrder) return false
          try {
            const batchOrderData = await formMethods.batchOrder.getFormData()
            await updateBotBatchOrderConfigApi({ ...batchOrderData, id })
            return true
          } catch (error) {
            console.error('保存批量下单配置失败:', error)
            return false
          }
        },

        // 闪兑配置策略
        flashExchange: async () => {
          if (!formMethods.flashExchange) return false
          try {
            const flashExchangeData = await formMethods.flashExchange.getFormData()
            await updateBotFlashExchangeConfigApi({ ...flashExchangeData, id })
            return true
          } catch (error) {
            console.error('保存闪兑配置失败:', error)
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
    costPrices,
    syncTgStatus,
    loadBotAllConfigs,
    submitConfig
  }
}
