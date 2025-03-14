import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义菜单项接口
interface MenuItem {
  id: number
  name: string
  type: number
  sort: number
  other: string
  status: number
  createTime: string
  updateTime: string
}

// 生成菜单项数据
const generateMenuItems = (): MenuItem[] => {
  const menuItems: MenuItem[] = []
  
  // 第一行按钮 (sort: 1-3)
  menuItems.push({
    id: 1,
    name: '⚡️ 快速租用',
    type: 1,
    sort: 1,
    other: 'quick_rent',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  menuItems.push({
    id: 2,
    name: '🪴 能量租赁',
    type: 2,
    sort: 2,
    other: 'energy_rent',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  menuItems.push({
    id: 3,
    name: '🌐 智能托管',
    type: 1,
    sort: 4,
    other: 'smart_hosting',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  // 第二行按钮 (sort: 4-6)
  menuItems.push({
    id: 4,
    name: '👑 飞机会员',
    type: 1,
    sort: 3,
    other: 'vip_member',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  menuItems.push({
    id: 5,
    name: '🖋 购买笔数',
    type: 1,
    sort: 5,
    other: 'buy_pens',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  menuItems.push({
    id: 6,
    name: '🔥 闪兑TRX',
    type: 1,
    sort: 6,
    other: 'flash_exchange',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  // 第三行按钮 (sort: 7-9)
  menuItems.push({
    id: 7,
    name: '👁 钱包监控',
    type: 1,
    sort: 7,
    other: 'wallet_monitor',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  menuItems.push({
    id: 8,
    name: '💰 余额充值',
    type: 1,
    sort: 8,
    other: 'balance_recharge',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  menuItems.push({
    id: 9,
    name: '🧑‍💻 个人中心',
    type: 1,
    sort: 9,
    other: 'user_center',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  // 第四行按钮 (sort: 10)
  menuItems.push({
    id: 10,
    name: '🏖 联系客服',
    type: 1,
    sort: 10,
    other: 'contact_support',
    status: 1,
    createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
  })
  
  return menuItems
}

const allMenuItems: MenuItem[] = generateMenuItems()

export default [
  // 获取菜单列表
  {
    url: '/mock/menu_list/list',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const { name, type, page = 1, pageSize = 10 } = query
      
      // 筛选逻辑
      let filteredList = [...allMenuItems]
      
      if (name) {
        filteredList = filteredList.filter(item => item.name.includes(name))
      }
      
      if (type !== undefined && type !== '') {
        filteredList = filteredList.filter(item => item.type === Number(type))
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
    url: '/mock/menu_list/delete',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const { id } = body
      
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
  
  // 添加或更新菜单
  {
    url: '/mock/menu_list/save',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const menuItem = body as MenuItem
      
      if (menuItem.id) {
        // 更新
        const index = allMenuItems.findIndex(item => item.id === menuItem.id)
        if (index !== -1) {
          allMenuItems[index] = {
            ...allMenuItems[index],
            ...menuItem,
            updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
          }
        }
      } else {
        // 添加
        const newId = allMenuItems.length > 0 ? Math.max(...allMenuItems.map(item => item.id)) + 1 : 1
        allMenuItems.push({
          ...menuItem,
          id: newId,
          createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
          updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
        })
      }
      
      return {
        code: SUCCESS_CODE,
        data: true,
        message: menuItem.id ? '更新成功' : '添加成功'
      }
    }
  }
] 