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

// 添加通用的余额记录API函数
export const getBalanceRecordApi = (params: any) => {
  // 根据type参数决定是充值记录还是扣款记录
  return request.get({ url: `/v1/user/balance_record`, params })
}
