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
  getBotFlashExchangeConfigApi
} from '@/api/botlist'

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
      // TODO: 此处需要替换为真实的API调用，从运营后台获取成本价配置
      // const response = await getCostPricesApi();
      // const data = response.data || {};

      // 模拟后台返回的成本价数据
      const data = {
        timeEnergy1Hour: 1.5,
        timeEnergy1Day: 5.0,
        timeEnergy3Days: 10.0,
        timeEnergy7Days: 20.0,
        timeEnergy15Days: 35.0
      }

      // 更新成本价配置
      Object.keys(data).forEach((key) => {
        if (costPrices[key] !== undefined) {
          costPrices[key] = data[key]
        }
      })

      console.log('成本价配置加载成功:', costPrices)
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

      const res = await syncTgStatusApi(currentBot.value.botId)
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
  const loadBotAllConfigs = async (botId: string, formMethods: any) => {
    if (!botId) {
      ElMessage.error('机器人ID不能为空')
      return
    }

    const loadingInstance = ElLoading.service({
      target: '.el-dialog__body',
      text: '加载配置中...'
    })

    loading.value = true

    try {
      // 获取运营后台配置的成本价
      await loadCostPrices()

      // 获取机器人基本信息
      const botInfoRes = await getBotDetailApi(botId)
      const botInfo = botInfoRes.data || {}

      // 设置TG同步状态
      tgStatus.value = botInfo.tgVerifyStatus || 'pending'

      // 调用对应表单的setValues方法设置数据
      if (formMethods.botInfo) {
        formMethods.botInfo.setValues({
          ...botInfo,
          botId: botInfo.botId || '',
          botName: botInfo.botName || '',
          botUsername: botInfo.botUsername || '',
          botToken: botInfo.botToken || '',
          apiKey: botInfo.apiKey || '',
          adminTgAccount: botInfo.adminTgAccount || '',
          remark: botInfo.remark || '',
          status: botInfo.status === undefined ? true : botInfo.status
        })
      }

      // 加载收款配置
      try {
        const paymentConfigRes = await getBotPaymentConfigApi(botId)
        const paymentConfig = paymentConfigRes.data || {}
        if (formMethods.payment) {
          formMethods.payment.setValues({
            username: paymentConfig.username || '',
            flashPaymentWallet: paymentConfig.flashPaymentWallet || '',
            balancePaymentWallet: paymentConfig.balancePaymentWallet || '',
            orderNotificationAdmin: paymentConfig.orderNotificationAdmin !== false
          })
        }
      } catch (error) {
        console.error('加载收款配置失败:', error)
      }

      // 加载时间能量价格配置
      try {
        const timeEnergyConfigRes = await getBotTimeEnergyConfigApi(botId)
        const timeEnergyConfig = timeEnergyConfigRes.data || {}
        if (formMethods.timeEnergy) {
          formMethods.timeEnergy.setValues({
            timeEnergyPrice: timeEnergyConfig.price || 0,
            timeEnergyMultiplier: timeEnergyConfig.multiplier || 1,
            timeEnergy1Hour: timeEnergyConfig.timeEnergy1Hour || costPrices.timeEnergy1Hour,
            timeEnergy1Day: timeEnergyConfig.timeEnergy1Day || costPrices.timeEnergy1Day,
            timeEnergy3Days: timeEnergyConfig.timeEnergy3Days || costPrices.timeEnergy3Days,
            timeEnergy7Days: timeEnergyConfig.timeEnergy7Days || costPrices.timeEnergy7Days,
            timeEnergy15Days: timeEnergyConfig.timeEnergy15Days || costPrices.timeEnergy15Days
          })
        }
      } catch (error) {
        console.error('加载时间能量价格配置失败:', error)
      }

      // 加载笔数能量价格配置
      try {
        const countEnergyConfigRes = await getBotCountEnergyConfigApi(botId)
        const countEnergyConfig = countEnergyConfigRes.data || {}
        if (formMethods.countEnergy) {
          formMethods.countEnergy.setValues({
            countEnergyEnabled: countEnergyConfig.enabled !== false,
            countEnergyPrice: countEnergyConfig.price || 0
          })
        }
      } catch (error) {
        console.error('加载笔数能量价格配置失败:', error)
      }

      // 加载托管模式价格配置
      try {
        const managedModeConfigRes = await getBotManagedModeConfigApi(botId)
        const managedModeConfig = managedModeConfigRes.data || {}
        if (formMethods.managedMode) {
          formMethods.managedMode.setValues({
            managedModeEnabled: managedModeConfig.enabled !== false,
            managedModePrice: managedModeConfig.price || 0
          })
        }
      } catch (error) {
        console.error('加载托管模式价格配置失败:', error)
      }

      // 加载批量下单价格配置
      try {
        const batchOrderConfigRes = await getBotBatchOrderConfigApi(botId)
        const batchOrderConfig = batchOrderConfigRes.data || {}
        if (formMethods.batchOrder) {
          formMethods.batchOrder.setValues({
            batchOrderEnabled: batchOrderConfig.enabled !== false,
            batchOrderPrice: batchOrderConfig.price || 0
          })
        }
      } catch (error) {
        console.error('加载批量下单价格配置失败:', error)
      }

      // 加载闪兑配置
      try {
        const flashExchangeConfigRes = await getBotFlashExchangeConfigApi(botId)
        const flashExchangeConfig = flashExchangeConfigRes.data || {}
        if (formMethods.flashExchange) {
          formMethods.flashExchange.setValues({
            flashExchangeEnabled: flashExchangeConfig.enabled !== false,
            flashExchangeRate: flashExchangeConfig.rate || 0,
            flashExchangeFee: flashExchangeConfig.fee || 0
          })
        }
      } catch (error) {
        console.error('加载闪兑配置失败:', error)
      }

      // 更新当前机器人对象
      currentBot.value = botInfo
    } catch (error) {
      console.error('加载机器人配置失败:', error)
      ElMessage.error('加载机器人配置失败，请稍后重试')
    } finally {
      loading.value = false
      loadingInstance.close()
    }
  }

  // 提交表单
  const submitConfig = async (formMethods: any) => {
    if (submitting.value) return false

    submitting.value = true
    ElMessage.info('正在保存配置...')

    try {
      // 收集所有表单数据
      const botInfoData = (await formMethods.botInfo?.getFormData()) || {}
      const paymentData = (await formMethods.payment?.getFormData()) || {}
      const timeEnergyData = (await formMethods.timeEnergy?.getFormData()) || {}
      const countEnergyData = (await formMethods.countEnergy?.getFormData()) || {}
      const managedModeData = (await formMethods.managedMode?.getFormData()) || {}
      const batchOrderData = (await formMethods.batchOrder?.getFormData()) || {}
      const flashExchangeData = (await formMethods.flashExchange?.getFormData()) || {}

      if (!currentBot.value.botId) {
        ElMessage.error('机器人ID不能为空')
        return false
      }

      // 组合所有配置数据
      const formData = {
        // 基本信息
        ...botInfoData,
        // 收款配置
        payment: {
          username: paymentData.username,
          flashPaymentWallet: paymentData.flashPaymentWallet,
          balancePaymentWallet: paymentData.balancePaymentWallet,
          orderNotificationAdmin: paymentData.orderNotificationAdmin
        },
        // 时间能量价格配置
        timeEnergy: {
          price: timeEnergyData.timeEnergyPrice,
          multiplier: timeEnergyData.timeEnergyMultiplier,
          timeEnergy1Hour: timeEnergyData.timeEnergy1Hour,
          timeEnergy1Day: timeEnergyData.timeEnergy1Day,
          timeEnergy3Days: timeEnergyData.timeEnergy3Days,
          timeEnergy7Days: timeEnergyData.timeEnergy7Days,
          timeEnergy15Days: timeEnergyData.timeEnergy15Days
        },
        // 笔数能量价格配置
        countEnergy: {
          enabled: countEnergyData.countEnergyEnabled,
          price: countEnergyData.countEnergyPrice
        },
        // 托管模式价格配置
        managedMode: {
          enabled: managedModeData.managedModeEnabled,
          price: managedModeData.managedModePrice
        },
        // 批量下单价格配置
        batchOrder: {
          enabled: batchOrderData.batchOrderEnabled,
          price: batchOrderData.batchOrderPrice
        },
        // 闪兑配置
        flashExchange: {
          enabled: flashExchangeData.flashExchangeEnabled,
          rate: flashExchangeData.flashExchangeRate,
          fee: flashExchangeData.flashExchangeFee
        },
        id: currentBot.value.id,
        botId: currentBot.value.botId,
        tgVerifyStatus: tgStatus.value
      }

      await updateBotAllConfigsApi(formData)

      ElMessage.success('配置保存成功')
      return true
    } catch (error) {
      console.error('保存配置失败:', error)
      ElMessage.error('保存配置失败，请稍后重试')
      return false
    } finally {
      submitting.value = false
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
