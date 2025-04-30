import request from '@/axios'

// 定义 getUserDetailApi 的响应数据结构
export interface UserDetailResponse {
  username: string
  usdt_mount: number // 或者根据实际情况定义为 string
}

/**
 * @description: 获取用户详情
 */
export const getUserDetailApi = () => {
  return request.get<UserDetailResponse>({ url: '/v3/user/get_detail' })
}
