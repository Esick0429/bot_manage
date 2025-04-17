import request from '@/axios'

/**
 * 获取资源池账户列表
 */
export const getResourcePoolAccountListApi = (params: any) => {
  return request.get({
    url: '/manage/resource_pool/list', // 更新路径以匹配后端
    params
  })
}

/**
 * 创建资源池账户
 */
export const createResourcePoolAccountApi = (data: any) => {
  return request.post({ url: '/manage/resource_pool/add', data }) // 更新路径
}

/**
 * 更新资源池账户
 */
export const updateResourcePoolAccountApi = (data: any) => {
  return request.post({ url: '/manage/resource_pool/update', data }) // 更新路径和方法
}

/**
 * 删除资源池账户
 */
export const deleteResourcePoolAccountApi = (params: any) => {
  return request.post({ url: '/manage/resource_pool/delete', data: params }) // 更新路径和方法, 将 params 改为 data
}

/**
 * 批量删除资源池账户
 */
export const batchDeleteResourcePoolAccountApi = (data: any) => {
  return request.delete({ url: '/system/resource-pool-account/batch-delete', data })
}

export const changeResourcePoolAccountStatusApi = (params: any) => {
  return request.post({ url: '/v2/manage/resource_pool/change', params })
}
