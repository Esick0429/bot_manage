import request from '@/axios'

// 获取角色列表
export const getRoleListApi = (params: any = {}) => {
  return request.get({ url: '/v2/manage/user/permission/list', params })
}

// 添加角色
export const addRoleApi = (data: any) => {
  return request.post({ url: '/v2/manage/user/permission/add', data })
}

// 删除角色
export const deleteRoleApi = (data: any) => {
  return request.post({ url: '/v2/manage/user/permission/delete', data })
}

// 修改角色
export const updateRoleApi = (data: any) => {
  return request.post({ url: '/v2/manage/user/permission/update', data })
}

// 添加角色权限
export const addRolePermissionApi = (data: any) => {
  return request.post({ url: '/v2/manage/user/permission/role_permission/add', data })
}
