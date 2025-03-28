import request from '@/axios'

// 获取兑换订单列表
export const getExchangeOrderListApi = (params: any) => {
  return request.get({ url: '/v1/order/exchange_order/list', params })
}

// 获取兑换订单详情
export const getExchangeOrderDetailApi = (id: Number) => {
  return request.get({ url: `/v1/order/exchange_order/detail/${id}` })
}

// 获取交易详情
export const getTransactionDetailApi = (id: Number) => {
  return request.get({ url: `/v1/order/exchange_order/tx_detail/${id}` })
}

// 获取转入详情
// export const getTransferInDetailApi = (id: Number) => {
//   return request.get({ url: `/v1/order/exchange_order/tx_detail/${id}` })
// }

// 导出兑换订单
export const exportExchangeOrderApi = (params: any) => {
  return request.get({ url: '/v1/order/exchange_order/export', params, responseType: 'blob' })
}
