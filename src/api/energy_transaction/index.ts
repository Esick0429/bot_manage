import request from '@/axios'
import {
  EnergyTransactionOrder,
  EnergyTransactionResponse,
  EnergyTransactionQueryParams,
  UpdateStatusParams
} from './types'

/**
 * 获取能量交易订单列表
 * @param params 查询参数
 */
export const getEnergyTransactionListApi = (params: EnergyTransactionQueryParams) => {
  return request.get<IResponse<EnergyTransactionResponse>>({
    url: '/v1/operation/energy-transaction/list',
    params
  })
}

/**
 * 获取能量交易订单详情
 * @param id 订单ID
 */
export const getEnergyTransactionDetailApi = (id: string) => {
  return request.get<IResponse<EnergyTransactionOrder>>({
    url: '/v1/operation/energy-transaction/detail',
    params: { id }
  })
}

/**
 * 更新能量交易订单状态
 * @param data 状态更新参数
 */
export const updateEnergyTransactionStatusApi = (data: UpdateStatusParams) => {
  return request.post<IResponse<EnergyTransactionOrder>>({
    url: '/v1/operation/energy-transaction/update-status',
    data
  })
}

/**
 * 导出能量交易订单
 * @param params 查询参数
 */
export const exportEnergyTransactionApi = (params: EnergyTransactionQueryParams) => {
  return request.get({
    url: '/v1/operation/energy-transaction/export',
    params,
    responseType: 'blob'
  })
}

// 导出所有类型
export * from './types'
