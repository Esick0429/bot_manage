import request from '@/axios'
import type {
  BotPaymentConfig,
  BotTimeEnergyConfig,
  BotCountEnergyConfig,
  BotManagedModeConfig,
  BotBatchOrderConfig,
  BotFlashExchangeConfig
} from './types'

// TODO: 定义更新机器人产品价格接口的请求体类型 (单个产品更新)
export interface UpdateBotProductPricePayload {
  tg_bot_id: string | number // 修改字段名为 tg_bot_id
  products: {
    product_id: string | number // 根据实际情况调整 product_id 类型
    sale_price: number
  }[]
}

// TODO: 定义批量更新机器人产品价格接口的请求体类型
export interface BatchUpdateBotProductPricePayload {
  tg_bot_id: number
  country: string
  operator: string
  product_type: number
  op_type: 'fixed' | 'percentage' // 调整方式
  amount: number // 调整值 (可正负)
}

// 获取机器人列表
export const getBotListApi = (params: any) => {
  return request.get({ url: '/bot/list', params })
}

// 获取机器人详情
export const getBotDetailApi = (botId: string) => {
  return request.get({ url: `/bot/${botId}` })
}

// 添加机器人
export const addBotApi = (data: any) => {
  return request.post({ url: '/bot/add', data })
}

// 编辑机器人
export const updateBotApi = (data: any) => {
  return request.post({ url: '/bot/update', data })
}

// 删除机器人
export const deleteBotApi = (botId: string) => {
  return request.delete({ url: `/bot/${botId}` })
}

// 同步TG状态
export const syncTgStatusApi = (botId: string) => {
  return request.post({ url: '/bot/sync-tg-status', data: { botId } })
}

// 机器人续费
export const renewBotApi = (data: { id: string; month_num: number }) => {
  return request.post({ url: '/bot/renew', data })
}

// 获取机器人收款配置
export const getBotPaymentConfigApi = (id: number) => {
  return request.get({ url: `/bot/payment-config/${id}` })
}

// 更新机器人收款配置
export const updateBotPaymentConfigApi = (data: BotPaymentConfig) => {
  return request.post({ url: '/bot/payment-config/update', data })
}

// 获取机器人时间能量价格配置
export const getBotTimeEnergyConfigApi = (id: number) => {
  return request.get({ url: `/bot/time-energy-config/${id}` })
}

// 更新机器人时间能量价格配置
export const updateBotTimeEnergyConfigApi = (data: BotTimeEnergyConfig) => {
  return request.post({ url: '/bot/time-energy-config/update', data })
}

// 获取机器人笔数能量价格配置
export const getBotCountEnergyConfigApi = (id: number) => {
  return request.get({ url: `/bot/count-energy-config/${id}` })
}

// 更新机器人笔数能量价格配置
export const updateBotCountEnergyConfigApi = (data: BotCountEnergyConfig) => {
  return request.post({ url: '/bot/count-energy-config/update', data })
}

// 获取机器人托管模式价格配置
export const getBotManagedModeConfigApi = (id: number) => {
  return request.get({ url: `/bot/managed-mode-config/${id}` })
}

// 更新机器人托管模式价格配置
export const updateBotManagedModeConfigApi = (data: BotManagedModeConfig) => {
  return request.post({ url: '/bot/managed-mode-config/update', data })
}

// 获取机器人批量下单价格配置
export const getBotBatchOrderConfigApi = (id: number) => {
  return request.get({ url: `/bot/batch-order-config/${id}` })
}

// 更新机器人批量下单价格配置
export const updateBotBatchOrderConfigApi = (data: BotBatchOrderConfig) => {
  return request.post({ url: '/bot/batch-order-config/update', data })
}

// 获取机器人闪兑配置
export const getBotFlashExchangeConfigApi = (id: number) => {
  return request.get({ url: `/bot/flash-exchange-config/${id}` })
}

// 更新机器人闪兑配置
export const updateBotFlashExchangeConfigApi = (data: BotFlashExchangeConfig) => {
  return request.post({ url: '/bot/flash-exchange-config/update', data })
}

// 更新所有机器人配置（一次性提交所有配置）
export const updateBotAllConfigsApi = (data: any) => {
  return request.post({ url: '/bot/update-all-configs', data })
}

// 获取机器人消费记录
export const getBotConsumptionRecordApi = (params: { page_size: number; current_page: number }) => {
  return request.get({ url: '/bot/charge_record/list', params })
}

export const getCountEnergyConfigApi = (id: number) => {
  return request.get({ url: `/bot/count-energy-config/${id}` })
}

// 更新机器人单个产品价格 (保持之前的函数，以防万一)
export const updateBotProductPriceApi = (data: UpdateBotProductPricePayload) => {
  return request.post({ url: '/v3/bot/product_price/update', data })
}

// TODO: 添加批量更新机器人产品价格接口函数
export const batchUpdateBotProductPriceApi = (data: BatchUpdateBotProductPricePayload) => {
  return request.post({ url: '/v3/bot/product_price/batch_update', data })
}
