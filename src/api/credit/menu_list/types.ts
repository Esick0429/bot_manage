// 定义内联回调类型
export interface InnerCallback {
  id: number
  callback_type: string
  name: string
  status: number
}

// 定义菜单项接口
export interface MenuItem {
  id: number
  user_id?: number
  menu_name: string
  menu_type: number // 菜单类型:1菜单 2内联按钮
  order_num: number // 排序
  status: number // 1禁用 2启用
  create_type?: number
  inner_type: string // 内联类型 url/call 菜单为内联时必须选择
  inner_value?: string // 根据inner_type判断: url时为链接地址，call时为回调函数名称
  // 前端特有字段
  span?: number
  text?: string // 用于显示
}

// 菜单布局类型 - 二维数组，用于拖拽排序
export type MenuLayout = (MenuItem | null)[][]
