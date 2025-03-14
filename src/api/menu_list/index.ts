import request from '@/axios'

// 获取菜单列表
export const getMenuListApi = (params: any) => {
  return request.get({ url: '/menu_list/list', params })
}

// 删除菜单
export const deleteMenuApi = (id: number) => {
  return request.post({ url: '/menu_list/delete', data: { id } })
}

// 保存菜单（新增或更新）
export const saveMenuApi = (data: any) => {
  return request.post({ url: '/menu_list/save', data })
} 