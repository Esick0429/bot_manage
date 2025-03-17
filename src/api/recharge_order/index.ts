import request from '@/axios'

// 获取充值订单列表
export const getRechargeOrderListApi = (params: any) => {
  return request.get({ url: '/recharge_order/list', params })
}

// 获取充值订单详情
export const getRechargeOrderDetailApi = (id: number) => {
  return request.get({ url: '/recharge_order/detail', params: { id } })
}

// 导出充值订单
export const exportRechargeOrderApi = (params: any) => {
  return request.get({ url: '/recharge_order/export', params, responseType: 'blob' })
}
