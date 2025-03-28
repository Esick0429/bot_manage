import request from '@/axios'
import { StatisticsResponse } from './types'

// 获取每日统计数据API
export const getDailyStatisticsApi = () => {
  return request.get<StatisticsResponse>({ url: '/statistics/daily' })
}

// 获取机器人摘要数据API
export const getBotSummaryApi = (params: any) => {
  return request.get({ url: '/statistics/bot-summary', params })
}
