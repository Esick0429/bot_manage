import request from '@/axios'

/**
 * 获取机器人TG用户列表
 * @param params 查询参数
 */
export const getTgUserListApi = (params: {
  bot_id?: number | string
  tg_user_id?: number | string
  pageSize?: number
  currentPage?: number
}) => {
  return request.get({ url: '/v1/user/bot/tg_user/list', params })
}

/**
 * 获取TG用户详情
 * @param id 用户ID
 */
export const getTgUserDetailApi = (id: number) => {
  return request.get({ url: '/v1/user/bot/tg_user/detail', params: { id } })
}

/**
 * 给单个用户发送消息
 * @param data 消息数据
 */
export const sendMessageToUserApi = (data: {
  tg_user_id: number | string
  bot_id: number | string
  message_type: 'text' | 'image' | 'video'
  content: string
}) => {
  return request.post({ url: '/v1/user/bot/tg_user/send_message', data })
}

/**
 * 群发消息
 * @param data 群发消息数据
 */
export const massSendMessageApi = (data: {
  bot_id: number | string
  filter_type: 'all' | 'active' | 'new'
  message_type: 'text' | 'image' | 'video'
  content: string
}) => {
  return request.post({ url: '/v1/user/bot/tg_user/mass_send', data })
}

/**
 * 获取群发记录
 * @param params 查询参数
 */
export const getMassSendRecordsApi = (params: {
  bot_id?: number | string
  start_date?: string
  end_date?: string
  pageSize?: number
  currentPage?: number
}) => {
  return request.get({ url: '/v1/user/bot/tg_user/mass_send/records', params })
}

/**
 * 获取群发记录详情
 * @param id 记录ID
 */
export const getMassSendRecordDetailApi = (id: number | string) => {
  return request.get({ url: '/v1/user/bot/tg_user/mass_send/detail', params: { id } })
}

/**
 * 获取用户余额记录
 * @param params 查询参数
 */
export const getUserBalanceRecordsApi = (params: {
  user_id: number | string
  currency_type?: 'TRX' | 'USDT'
  pageSize?: number
  currentPage?: number
}) => {
  return request.get({ url: '/v1/user/bot/tg_user/balance/records', params })
}

/**
 * 用户充值
 * @param data 充值数据
 */
export const rechargeUserBalanceApi = (data: {
  user_id: number | string
  amount: number | string
  currency_type: 'TRX' | 'USDT'
}) => {
  return request.post({ url: '/v1/user/bot/tg_user/balance/recharge', data })
}
