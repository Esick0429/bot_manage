import request from '@/axios'

interface ListManageUserParams {
  pageIndex: number
  pageSize: number
  name?: string
  email?: string
}

export const listManageUserApi = (params: ListManageUserParams) => {
  return request.get({ url: '/manage/user/list', params })
}

export const addManageUserApi = (params: any) => {
  return request.post({ url: '/manage/user/add', data: params })
}

export const updateManageUserApi = (params: any) => {
  return request.post({ url: '/manage/user/update', data: params })
}

export const deleteManageUserApi = (params: any) => {
  return request.post({ url: '/manage/user/delete', data: params })
}
