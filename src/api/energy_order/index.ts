import request from '@/axios'

// 获取能量订单列表
export const getEnergyOrderListApi = (params: any) => {
  return request.get({ url: '/energy_order/list', params })
}

// 获取能量订单详情
export const getEnergyOrderDetailApi = (id: number) => {
  return request.get({ url: '/energy_order/detail', params: { id } })
}

// 导出能量订单
export const exportEnergyOrderApi = (params: any) => {
  return request.get({ url: '/energy_order/export', params, responseType: 'blob' })
}
