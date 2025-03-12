<template>
  <Dialog v-model="dialogVisible" title="机器人配置" width="800px">
    <div v-loading="loading">
      <ElTabs v-model="activeTab">
        <ElTabPane label="机器人信息" name="botInfo">
          <!-- 机器人基本信息表单 -->
          <Form :schema="botInfoSchema" @register="botInfoRegister" />
          <div class="tg-status-row mb-4">
            <ElRow>
              <ElCol :span="6" class="label-col text-right pr-4">
                <span class="el-form-item__label">TG同步状态:</span>
              </ElCol>
              <ElCol :span="18">
                <div class="flex items-center">
                  <ElTag
                    :type="
                      tgStatus === 'success' ? 'success' : tgStatus === 'error' ? 'danger' : 'info'
                    "
                    effect="plain"
                  >
                    {{
                      tgStatus === 'success'
                        ? '已同步'
                        : tgStatus === 'error'
                          ? '同步失败'
                          : '未同步'
                    }}
                  </ElTag>
                  <div
                    class="flex items-center ml-2 cursor-pointer"
                    style="color: #007bff"
                    @click="syncTgStatus"
                  >
                    <div :class="{ syncing: syncing }" style="display: flex; align-items: center">
                      <Icon icon="ri:refresh-line" />
                    </div>
                    <span class="ml-1">{{ syncing ? '同步中...' : '点我同步' }}</span>
                  </div>
                </div>
              </ElCol>
            </ElRow>
          </div>
        </ElTabPane>

        <ElTabPane label="收款配置" name="payment">
          <Form :isCol="false" labelPosition="top" :schema="paymentSchema" @register="paymentRegister" />
        </ElTabPane>

        <ElTabPane label="时间能量价格" name="timeEnergy">
          <Form :schema="timeEnergySchema" @register="timeEnergyRegister" />
        </ElTabPane>

        <ElTabPane label="笔数能量价格" name="countEnergy">
          <Form :schema="countEnergySchema" @register="countEnergyRegister" />
        </ElTabPane>

        <ElTabPane label="托管模式价格" name="managedMode">
          <Form :schema="managedModeSchema" @register="managedModeRegister" />
        </ElTabPane>

        <ElTabPane label="批量下单价格" name="batchOrder">
          <Form :schema="batchOrderSchema" @register="batchOrderRegister" />
        </ElTabPane>

        <ElTabPane label="闪兑配置" name="flashExchange">
          <Form :schema="flashExchangeSchema" @register="flashExchangeRegister" />
        </ElTabPane>
      </ElTabs>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="close" :disabled="submitting">取消</ElButton>
        <ElButton type="primary" @click="submit" :loading="submitting">保存配置</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton,
  ElMessage,
  ElTabs,
  ElTabPane,
  ElTag,
  ElFormItem,
  ElRow,
  ElCol,
  ElLoading
} from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { ElTooltip } from 'element-plus'
import { Icon } from '@/components/Icon'
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

const emit = defineEmits(['success', 'close'])
const dialogVisible = ref(false)
const activeTab = ref('botInfo')
const currentBot = ref<Record<string, any>>({})
const tgStatus = ref('pending')
const syncing = ref(false)
const loading = ref(false)
const submitting = ref(false)

const { required } = useValidator()

// 机器人信息表单
const { formRegister: botInfoRegister, formMethods: botInfoMethods } = useForm()
const botInfoSchema = reactive<FormSchema[]>([
  {
    field: 'botId',
    component: 'Input' as const,
    label: '机器人ID',
    componentProps: {
      disabled: true
    }
  },
  {
    field: 'botName',
    component: 'Input' as const,
    label: '机器人昵称',
    componentProps: {
      placeholder: '请输入机器人昵称'
    },
    formItemProps: {
      rules: [required()]
    }
  },
  {
    field: 'botUsername',
    component: 'Input' as const,
    label: '机器人用户名',
    componentProps: {
      disabled: true
    }
  },
  {
    field: 'botToken',
    component: 'Input' as const,
    label: '机器人Token',
    componentProps: {
      disabled: true
    }
  },
  {
    field: 'apiKey',
    component: 'Input' as const,
    label: 'API秘钥',
    componentProps: {
      disabled: true
    }
  },
  {
    field: 'adminTgAccount',
    component: 'Input' as const,
    label: '管理员TG账号',
    componentProps: {
      placeholder: '请输入TG账号,以@开头'
    },
    formItemProps: {
      rules: [
        required(),
        {
          pattern: /^@.+$/,
          message: 'TG账号必须以@开头'
        }
      ]
    }
  },
  {
    field: 'remark',
    component: 'Input' as const,
    label: '备注',
    componentProps: {
      placeholder: '请输入备注(选填)',
      type: 'textarea',
      rows: 3
    }
  },
  {
    field: 'status',
    component: 'Switch' as const,
    label: '状态',
    value: true
  }
])

// 收款配置表单
const { formRegister: paymentRegister, formMethods: paymentMethods } = useForm()
const paymentSchema = reactive<FormSchema[]>([
  {
    field: 'username',
    component: 'Input' as const,
    label: '用户名：',
    componentProps: {
      placeholder: '请输入用户名'
    },
    formItemProps: {
      rules: [{ required: true, message: '用户名是必填项' }],
      style: {
        width: '50%'
      }
    }
  },
  {
    field: 'flashPaymentWallet',
    component: 'Input' as const,
    label: '【1小时能量闪租/余额充值】收款钱包地址：',
    componentProps: {
      placeholder: '请输入闪充收款钱包地址'
    },
    formItemProps: {
      rules: [{ required: true, message: '闪充收款钱包地址是必填项' }]
    }
  },
  {
    field: 'balancePaymentWallet',
    component: 'Input' as const,
    label: '',
    componentProps: {
      placeholder: '请输入余额收款钱包地址'
    },
    formItemProps: {
      rules: [{ required: true, message: '余额收款钱包地址是必填项' }],
      slots: {
        label: () => {
          return (
            <span>
              【余额充值】收款钱包地址
              <ElTooltip
                content="如果不填则使用1小时能量闪租的收款钱包地址"
                placement="top"
                effect="light"
              >
                <Icon icon="vi-ep:question-filled" size={12} />
              </ElTooltip>
              ：
            </span>
          )
        }
      }
    }
  },
  {
    field: 'orderNotificationAdmin',
    component: 'Switch' as const,
    label: '订单通知机器人管理员：',
    value: true,
    formItemProps: {
      slots: {
        label: () => {
          return (
            <span>
              订单通知机器人管理员：
              <ElTooltip
                content="开启后，如果有新的订单，管理员将会接收到通知"
                placement="top"
                effect="light"
              >
                <Icon icon="vi-ep:question-filled" size={12} />
              </ElTooltip>
              ：
            </span>
          )
        }
      }
    }
  }
])

// 时间能量价格表单
const { formRegister: timeEnergyRegister, formMethods: timeEnergyMethods } = useForm()
const timeEnergySchema = reactive<FormSchema[]>([
  {
    field: 'timeEnergyEnabled',
    component: 'Switch' as const,
    label: '启用时间能量',
    value: true
  },
  {
    field: 'timeEnergyPrice',
    component: 'InputNumber' as const,
    label: '时间能量价格',
    componentProps: {
      placeholder: '请输入价格',
      min: 0,
      precision: 2
    }
  }
])

// 笔数能量价格表单
const { formRegister: countEnergyRegister, formMethods: countEnergyMethods } = useForm()
const countEnergySchema = reactive<FormSchema[]>([
  {
    field: 'countEnergyEnabled',
    component: 'Switch' as const,
    label: '启用笔数能量',
    value: true
  },
  {
    field: 'countEnergyPrice',
    component: 'InputNumber' as const,
    label: '笔数能量价格',
    componentProps: {
      placeholder: '请输入价格',
      min: 0,
      precision: 2
    }
  }
])

// 托管模式价格表单
const { formRegister: managedModeRegister, formMethods: managedModeMethods } = useForm()
const managedModeSchema = reactive<FormSchema[]>([
  {
    field: 'managedModeEnabled',
    component: 'Switch' as const,
    label: '启用托管模式',
    value: true
  },
  {
    field: 'managedModePrice',
    component: 'InputNumber' as const,
    label: '托管模式价格',
    componentProps: {
      placeholder: '请输入价格',
      min: 0,
      precision: 2
    }
  }
])

// 批量下单价格表单
const { formRegister: batchOrderRegister, formMethods: batchOrderMethods } = useForm()
const batchOrderSchema = reactive<FormSchema[]>([
  {
    field: 'batchOrderEnabled',
    component: 'Switch' as const,
    label: '启用批量下单',
    value: true
  },
  {
    field: 'batchOrderPrice',
    component: 'InputNumber' as const,
    label: '批量下单价格',
    componentProps: {
      placeholder: '请输入价格',
      min: 0,
      precision: 2
    }
  }
])

// 闪兑配置表单
const { formRegister: flashExchangeRegister, formMethods: flashExchangeMethods } = useForm()
const flashExchangeSchema = reactive<FormSchema[]>([
  {
    field: 'flashExchangeEnabled',
    component: 'Switch' as const,
    label: '启用闪兑',
    value: true
  },
  {
    field: 'flashExchangeRate',
    component: 'InputNumber' as const,
    label: '闪兑汇率',
    componentProps: {
      placeholder: '请输入汇率',
      min: 0,
      precision: 4
    }
  },
  {
    field: 'flashExchangeFee',
    component: 'InputNumber' as const,
    label: '闪兑手续费',
    componentProps: {
      placeholder: '请输入手续费百分比',
      min: 0,
      max: 100,
      precision: 2
    }
  }
])

// TG状态同步
const syncTgStatus = async () => {
  if (syncing.value) return

  try {
    syncing.value = true
    ElMessage.info('正在同步TG状态...')

    // 调用同步TG状态接口
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

// 加载机器人所有配置
const loadBotAllConfigs = async (botId: string) => {
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
    // 获取机器人基本信息
    const botInfoRes = await getBotDetailApi(botId)
    const botInfo = botInfoRes.data || {}

    // 设置TG同步状态
    tgStatus.value = botInfo.tgVerifyStatus || 'pending'

    // 设置机器人信息表单数据
    botInfoMethods.setValues({
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

    try {
      // 获取并设置收款配置
      const paymentConfigRes = await getBotPaymentConfigApi(botId)
      const paymentConfig = paymentConfigRes.data || {}
      paymentMethods.setValues({
        paymentEnabled: paymentConfig.enabled === undefined ? false : paymentConfig.enabled,
        paymentAddress: paymentConfig.address || '',
        minPaymentAmount: paymentConfig.minAmount || 0
      })
    } catch (error) {
      console.error('加载收款配置失败:', error)
      // 使用默认值
      paymentMethods.setValues({
        paymentEnabled: false,
        paymentAddress: '',
        minPaymentAmount: 0
      })
    }

    try {
      // 获取并设置时间能量价格配置
      const timeEnergyConfigRes = await getBotTimeEnergyConfigApi(botId)
      const timeEnergyConfig = timeEnergyConfigRes.data || {}
      timeEnergyMethods.setValues({
        timeEnergyEnabled:
          timeEnergyConfig.enabled === undefined ? false : timeEnergyConfig.enabled,
        timeEnergyPrice: timeEnergyConfig.price || 0
      })
    } catch (error) {
      console.error('加载时间能量价格配置失败:', error)
      // 使用默认值
      timeEnergyMethods.setValues({
        timeEnergyEnabled: false,
        timeEnergyPrice: 0
      })
    }

    try {
      // 获取并设置笔数能量价格配置
      const countEnergyConfigRes = await getBotCountEnergyConfigApi(botId)
      const countEnergyConfig = countEnergyConfigRes.data || {}
      countEnergyMethods.setValues({
        countEnergyEnabled:
          countEnergyConfig.enabled === undefined ? false : countEnergyConfig.enabled,
        countEnergyPrice: countEnergyConfig.price || 0
      })
    } catch (error) {
      console.error('加载笔数能量价格配置失败:', error)
      // 使用默认值
      countEnergyMethods.setValues({
        countEnergyEnabled: false,
        countEnergyPrice: 0
      })
    }

    try {
      // 获取并设置托管模式价格配置
      const managedModeConfigRes = await getBotManagedModeConfigApi(botId)
      const managedModeConfig = managedModeConfigRes.data || {}
      managedModeMethods.setValues({
        managedModeEnabled:
          managedModeConfig.enabled === undefined ? false : managedModeConfig.enabled,
        managedModePrice: managedModeConfig.price || 0
      })
    } catch (error) {
      console.error('加载托管模式价格配置失败:', error)
      // 使用默认值
      managedModeMethods.setValues({
        managedModeEnabled: false,
        managedModePrice: 0
      })
    }

    try {
      // 获取并设置批量下单价格配置
      const batchOrderConfigRes = await getBotBatchOrderConfigApi(botId)
      const batchOrderConfig = batchOrderConfigRes.data || {}
      batchOrderMethods.setValues({
        batchOrderEnabled:
          batchOrderConfig.enabled === undefined ? false : batchOrderConfig.enabled,
        batchOrderPrice: batchOrderConfig.price || 0
      })
    } catch (error) {
      console.error('加载批量下单价格配置失败:', error)
      // 使用默认值
      batchOrderMethods.setValues({
        batchOrderEnabled: false,
        batchOrderPrice: 0
      })
    }

    try {
      // 获取并设置闪兑配置
      const flashExchangeConfigRes = await getBotFlashExchangeConfigApi(botId)
      const flashExchangeConfig = flashExchangeConfigRes.data || {}
      flashExchangeMethods.setValues({
        flashExchangeEnabled:
          flashExchangeConfig.enabled === undefined ? false : flashExchangeConfig.enabled,
        flashExchangeRate: flashExchangeConfig.rate || 0,
        flashExchangeFee: flashExchangeConfig.fee || 0
      })
    } catch (error) {
      console.error('加载闪兑配置失败:', error)
      // 使用默认值
      flashExchangeMethods.setValues({
        flashExchangeEnabled: false,
        flashExchangeRate: 0,
        flashExchangeFee: 0
      })
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

// 打开弹窗
const open = async (botInfo: Record<string, any>) => {
  // 先设置一些基本信息，避免闪烁
  currentBot.value = botInfo || {}
  dialogVisible.value = true
  activeTab.value = 'botInfo'

  if (!botInfo || !botInfo.botId) {
    ElMessage.error('机器人信息不完整')
    return
  }

  // 加载所有配置信息
  await loadBotAllConfigs(botInfo.botId)
}

// 关闭弹窗
const close = () => {
  dialogVisible.value = false
  emit('close')
}

// 提交表单
const submit = async () => {
  if (submitting.value) return

  // 获取当前活动的表单
  let currentForm

  switch (activeTab.value) {
    case 'botInfo':
      currentForm = await botInfoMethods.getElFormExpose()
      break
    case 'payment':
      currentForm = await paymentMethods.getElFormExpose()
      break
    case 'timeEnergy':
      currentForm = await timeEnergyMethods.getElFormExpose()
      break
    case 'countEnergy':
      currentForm = await countEnergyMethods.getElFormExpose()
      break
    case 'managedMode':
      currentForm = await managedModeMethods.getElFormExpose()
      break
    case 'batchOrder':
      currentForm = await batchOrderMethods.getElFormExpose()
      break
    case 'flashExchange':
      currentForm = await flashExchangeMethods.getElFormExpose()
      break
  }

  if (!currentForm) return

  const valid = await currentForm.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('表单验证失败，请检查填写内容')
    return
  }

  try {
    submitting.value = true
    ElMessage.info('正在保存配置...')

    // 收集所有表单数据
    const botInfoData = await botInfoMethods.getFormData()
    const paymentData = await paymentMethods.getFormData()
    const timeEnergyData = await timeEnergyMethods.getFormData()
    const countEnergyData = await countEnergyMethods.getFormData()
    const managedModeData = await managedModeMethods.getFormData()
    const batchOrderData = await batchOrderMethods.getFormData()
    const flashExchangeData = await flashExchangeMethods.getFormData()

    if (!currentBot.value.botId) {
      ElMessage.error('机器人ID不能为空')
      return
    }

    // 组合所有配置数据
    const formData = {
      // 基本信息
      ...botInfoData,
      // 收款配置
      payment: {
        enabled: paymentData.paymentEnabled,
        address: paymentData.paymentAddress,
        minAmount: paymentData.minPaymentAmount
      },
      // 时间能量价格配置
      timeEnergy: {
        enabled: timeEnergyData.timeEnergyEnabled,
        price: timeEnergyData.timeEnergyPrice
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

    // 调用API更新所有配置
    await updateBotAllConfigsApi(formData)

    ElMessage.success('配置保存成功')
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 暴露方法
defineExpose({
  open
})
</script>

<style scoped>
.tg-status-row {
  margin-top: 15px;
  margin-bottom: 25px;
  line-height: 32px;
}

.label-col {
  text-align: right;
  padding-right: 12px;
  color: var(--el-text-color-regular);
}

.el-form-item__label {
  font-size: 14px;
  line-height: 32px;
}

.syncing {
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 添加一些表单项的提示样式 */
.config-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

/* 改进标签页样式 */
.el-tabs__nav {
  margin-bottom: 20px;
}

.el-tabs__content {
  padding: 0 10px;
}
</style>
