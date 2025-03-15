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

      const res = await syncTgStatusApi(currentBot.value.tg_bot_id)
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
  const loadBotAllConfigs = async (tg_bot_id: string, formMethods: any) => {
    if (!tg_bot_id) {
      ElMessage.error('机器人ID不能为空')
      return
    }

    const loadingInstance = ElLoading.service({
      target: '.el-dialog__body',
      text: '加载配置中...'
    })

    loading.value = true

    try {
      // 如果是加载botInfo，需要获取机器人基本信息
      if (formMethods.botInfo) {
        const botInfoRes = await getBotDetailApi(tg_bot_id)
        const botInfo = botInfoRes.data || {}

        // 设置TG同步状态
        tgStatus.value = botInfo.tgVerifyStatus || 'pending'

        formMethods.botInfo.setValues({
          ...botInfo,
          tg_bot_id: botInfo.tg_bot_id || '',
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
      }

      // 如果是加载payment，需要获取收款配置
      if (formMethods.payment) {
        try {
          const paymentConfigRes = await getBotPaymentConfigApi(tg_bot_id)
          const paymentConfig = paymentConfigRes.data || {}

          formMethods.payment.setValues({
            username: paymentConfig.username || '',
            flashPaymentWallet: paymentConfig.flashPaymentWallet || '',
            balancePaymentWallet: paymentConfig.balancePaymentWallet || '',
            orderNotificationAdmin: paymentConfig.orderNotificationAdmin !== false
          })
        } catch (error) {
          console.error('加载收款配置失败:', error)
        }
      }

      // 如果是加载timeEnergy，需要获取时间能量价格配置和成本价
      if (formMethods.timeEnergy) {
        try {
          // 获取运营后台配置的成本价
          await loadCostPrices()

          const timeEnergyConfigRes = await getBotTimeEnergyConfigApi(tg_bot_id)
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
        } catch (error) {
          console.error('加载时间能量价格配置失败:', error)
        }
      }

      // 如果是加载countEnergy，需要获取笔数能量价格配置
      if (formMethods.countEnergy) {
        try {
          const countEnergyConfigRes = await getBotCountEnergyConfigApi(tg_bot_id)
          const countEnergyConfig = countEnergyConfigRes.data || {}

          const countEnergyValues = {
            countEnergyEnabled: countEnergyConfig.enabled,
            countEnergyPriceTRX: countEnergyConfig.countEnergyPriceTRX || 0,
            countEnergyPriceUSDT: countEnergyConfig.countEnergyPriceUSDT || 0,
            notifyUser: countEnergyConfig.notifyUser || false,
            notifyGroupOwner: countEnergyConfig.notifyGroupOwner || false,
            notifyAdmin: countEnergyConfig.notifyAdmin || false
          }

          // 设置表单值
          formMethods.countEnergy.setValues(countEnergyValues)
        } catch (error) {
          console.error('加载笔数能量价格配置失败:', error)
        }
      }

      // 如果是加载managedMode，需要获取托管模式价格配置
      if (formMethods.managedMode) {
        try {
          const managedModeConfigRes = await getBotManagedModeConfigApi(tg_bot_id)
          const managedModeConfig = managedModeConfigRes.data || {}

          const managedModeValues = {
            enabled: managedModeConfig.enabled,
            countPrice: managedModeConfig.countPrice || 0,
            customPriceEnabled: managedModeConfig.customPriceEnabled || false,
            price65000: managedModeConfig.price65000 || 0,
            price131000: managedModeConfig.price131000 || 0
          }

          // 设置表单值
          formMethods.managedMode.setValues(managedModeValues)
        } catch (error) {
          console.error('加载托管模式价格配置失败:', error)
        }
      }

      // 如果是加载batchOrder，需要获取批量下单价格配置
      if (formMethods.batchOrder) {
        try {
          const batchOrderConfigRes = await getBotBatchOrderConfigApi(tg_bot_id)
          const batchOrderConfig = batchOrderConfigRes.data || {}

          const batchOrderValues = {
            enabled: batchOrderConfig.enabled,
            energyPrice: batchOrderConfig.energyPrice || 0,
            activatePrice: batchOrderConfig.activatePrice || 1.1
          }

          // 设置表单值
          formMethods.batchOrder.setValues(batchOrderValues)
        } catch (error) {
          console.error('加载批量下单价格配置失败:', error)
        }
      }

      // 如果是加载flashExchange，需要获取闪兑配置
      if (formMethods.flashExchange) {
        try {
          const flashExchangeConfigRes = await getBotFlashExchangeConfigApi(tg_bot_id)
          const flashExchangeConfig = flashExchangeConfigRes.data || {}

          const flashExchangeValues = {
            enabled: flashExchangeConfig.enabled,
            walletAddress: flashExchangeConfig.walletAddress || '',
            minBalance: flashExchangeConfig.minBalance || 0,
            exchangeProfit: flashExchangeConfig.exchangeProfit || 0,
            exchangeLimit: flashExchangeConfig.exchangeLimit || 0,
            insufficientStock: flashExchangeConfig.insufficientStock || false,
            insufficientStockValue: flashExchangeConfig.insufficientStockValue || 0
          }

          // 设置表单值
          formMethods.flashExchange.setValues(flashExchangeValues)
        } catch (error) {
          console.error('加载闪兑配置失败:', error)
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

      if (!currentBot.value.tg_bot_id) {
        ElMessage.error('机器人ID不能为空')
        return false
      }

      // 组合所有配置数据
      const formData = {
        tg_bot_id: currentBot.value.tg_bot_id,
        // 基本信息
        botInfo: {
          ...botInfoData
        },
        // 收款配置
        payment: {
          ...paymentData
        },
        // 时间能量配置
        timeEnergy: {
          ...timeEnergyData
        },
        // 笔数能量配置
        countEnergy: {
          ...countEnergyData
        },
        // 托管模式配置
        managedMode: {
          ...managedModeData
        },
        // 批量下单配置
        batchOrder: {
          ...batchOrderData
        },
        // 闪兑配置
        flashExchange: {
          ...flashExchangeData
        }
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
