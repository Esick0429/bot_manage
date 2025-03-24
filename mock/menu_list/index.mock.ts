import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'
import { MenuItem } from '@/api/menu_list/types'

const timeout = 1000

// 生成菜单项数据
const generateMenuItems = (): MenuItem[] => {
  const menuItems: MenuItem[] = []
  
  // 第一行按钮 (order_num: 1-3)
  menuItems.push({
    id: 1,
    menu_name: '⚡️ 快速租用',
    menu_type: 1,
    order_num: 1,
    inner_type: 'url',
    inner_value: 'quick_rent',
    status: 1
  })
  
  menuItems.push({
    id: 2,
    menu_name: '🪴 能量租赁',
    menu_type: 2,
    order_num: 2,
    inner_type: 'url',
    inner_value: 'energy_rent',
    status: 1
  })
  
  menuItems.push({
    id: 3,
    menu_name: '🌐 智能托管',
    menu_type: 1,
    order_num: 4,
    inner_type: 'url',
    inner_value: 'smart_hosting',
    status: 1
  })
  
  // 第二行按钮 (order_num: 4-6)
  menuItems.push({
    id: 4,
    menu_name: '👑 飞机会员',
    menu_type: 1,
    order_num: 3,
    inner_type: 'url',
    inner_value: 'vip_member',
    status: 1
  })
  
  menuItems.push({
    id: 5,
    menu_name: '🖋 购买笔数',
    menu_type: 1,
    order_num: 5,
    inner_type: 'url',
    inner_value: 'buy_pens',
    status: 1
  })
  
  menuItems.push({
    id: 6,
    menu_name: '🔥 闪兑TRX',
    menu_type: 1,
    order_num: 6,
    inner_type: 'url',
    inner_value: 'flash_exchange',
    status: 1
  })
  
  // 第三行按钮 (order_num: 7-9)
  menuItems.push({
    id: 7,
    menu_name: '👁 钱包监控',
    menu_type: 1,
    order_num: 7,
    inner_type: 'url',
    inner_value: 'wallet_monitor',
    status: 1
  })
  
  menuItems.push({
    id: 8,
    menu_name: '💰 余额充值',
    menu_type: 1,
    order_num: 8,
    inner_type: 'url',
    inner_value: 'balance_recharge',
    status: 1
  })
  
  menuItems.push({
    id: 9,
    menu_name: '🧑‍💻 个人中心',
    menu_type: 2,
    order_num: 9,
    inner_type: 'call',
    inner_value: 'user_center',
    status: 1
  })
  
  // 第四行按钮 (order_num: 10)
  menuItems.push({
    id: 10,
    menu_name: '🏖 联系客服',
    menu_type: 2,
    order_num: 10,
    inner_type: 'call',
    inner_value: 'contact_support',
    status: 1
  })
  
  return menuItems
}

const allMenuItems: MenuItem[] = generateMenuItems()

export default [
  // 获取菜单列表
  {
    url: '/mock/v1/bot/menu/list',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const { menu_name, menu_type, page = 1, pageSize = 10 } = query
      
      // 筛选逻辑
      let filteredList = [...allMenuItems]
      
      if (menu_name) {
        filteredList = filteredList.filter(item => item.menu_name.includes(menu_name))
      }
      
      if (menu_type !== undefined && menu_type !== '') {
        filteredList = filteredList.filter(item => item.menu_type === Number(menu_type))
      }
      
      // 分页逻辑
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + Number(pageSize)
      const pagedList = filteredList.slice(startIndex, endIndex)
      
      return {
        code: SUCCESS_CODE,
        data: {
          list: pagedList,
          total: filteredList.length
        }
      }
    }
  },
  
  // 删除菜单
  {
    url: '/mock/v1/bot/menu/delete/:id',
    method: 'delete',
    timeout,
    response: ({ query }) => {
      const id = Number(query.id)
      
      const index = allMenuItems.findIndex(item => item.id === id)
      if (index !== -1) {
        allMenuItems.splice(index, 1)
      }
      
      return {
        code: SUCCESS_CODE,
        data: true,
        message: '删除成功'
      }
    }
  },
  
  // 添加菜单
  {
    url: '/mock/v1/bot/menu/add',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const menuItem = body as MenuItem
      
      // 添加新项目
      const newId = allMenuItems.length > 0 ? Math.max(...allMenuItems.map(item => item.id)) + 1 : 1
      allMenuItems.push({
        ...menuItem,
        id: newId
      })
      
      return {
        code: SUCCESS_CODE,
        data: {
          id: newId
        },
        message: '添加成功'
      }
    }
  },
  
  // 更新菜单
  {
    url: '/mock/v1/bot/menu/update',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const menuItem = body as MenuItem
      
      if (menuItem.id) {
        // 更新已有项目
        const index = allMenuItems.findIndex(item => item.id === menuItem.id)
        if (index !== -1) {
          allMenuItems[index] = {
            ...allMenuItems[index],
            ...menuItem
          }
          
          return {
            code: SUCCESS_CODE,
            data: true,
            message: '更新成功'
          }
        } else {
          return {
            code: 400,
            message: '未找到要更新的菜单项',
            data: false
          }
        }
      } else {
        return {
          code: 400,
          message: '更新失败：缺少ID',
          data: false
        }
      }
    }
  }
] 