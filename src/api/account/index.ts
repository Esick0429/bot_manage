import request from '@/axios'

// 获取账户信息
export const getAccountListApi = (params: any) => {
  return request.get({ url: '/v1/user/get_detail', params })
}

// 获取账户详情
export const getAccountDetailApi = (id: number) => {
  return request.get({ url: '/v1/account/detail', params: { id } })
}

// 创建账户
export const createAccountApi = (data: any) => {
  return request.post({ url: '/v1/account/create', data })
}

// 更新账户
export const updateAccountApi = (data: any) => {
  return request.put({ url: '/v1/account/update', data })
}

// 删除账户
export const deleteAccountApi = (id: number) => {
  return request.delete({ url: '/v1/account/delete', params: { id } })
}

// 导出账户信息
export const exportAccountListApi = (params: any) => {
  return request.get({ url: '/v1/account/export', params, responseType: 'blob' })
}

// 获取账户充值记录
export const getAccountRechargeRecordsApi = (params: {
  accountId: number
  pageSize?: number
  currentPage?: number
}) => {
  return request.get({ url: '/v1/account/recharge-records', params })
}

// 获取账户扣款记录
export const getAccountDeductionRecordsApi = (params: {
  accountId: number
  transaction_type?: string
  order_id?: string
  pageSize?: number
  currentPage?: number
}) => {
  return request.get({ url: '/v1/account/deduction-records', params })
}
