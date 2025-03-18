import request from '@/axios'

// 获取充值订单列表
export const getRechargeOrderListApi = (params: any) => {
  return request.get({ url: '/v1/order/inorder/list', params })
}

// 获取充值订单详情
export const getRechargeOrderDetailApi = (id: number) => {
  return request.get({ url: '/v1/order/inorder/detail', params: { id } })
}

// 导出充值订单
export const exportRechargeOrderApi = (params: any) => {
  return request.get({ url: '/v1/order/inorder/export', params, responseType: 'blob' })
}
