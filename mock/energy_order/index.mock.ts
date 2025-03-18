import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义能量订单接口
interface EnergyOrder {
  id: string
  orderNo: string
  tgUserId: string
  tgUsername: string
  tgNickname: string
  botId: string
  botName: string
  orderType: string
  energyAmount: number
  energyValidDays: number
  energyCount: number
  status: number
  createTime: string
  payTime: string | null
  finishTime: string | null
  remark: string
}

// 定义订单状态
const orderStatus = {
  0: '待支付',
  1: '支付中',
  2: '支付成功',
  3: '支付失败',
  4: '已取消'
}

// 定义能量订单类型
const energyTypes = {
  1: '按笔数',
  2: '按时间',
  3: '闪租',
  4: '批量下单'
}

// 生成能量订单数据
const generateEnergyOrders = (): EnergyOrder[] => {
  const orders: EnergyOrder[] = []
  
  for (let i = 1; i <= 50; i++) {
    const status = Mock.Random.pick([0, 1, 2, 3, 4])
    const energyType = Mock.Random.pick([1, 2, 3, 4])
    const createTime = Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    
    // 只有支付成功/失败的订单才有支付时间和完成时间
    const payTime = status >= 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null
    const finishTime = status === 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null
    
    // 根据能量包类型设置不同的能量数量和有效期
    let energyAmount, energyValidDays, energyCount
    
    switch(energyType) {
      case 1:
        energyAmount = Mock.Random.integer(100, 300)
        energyValidDays = 30
        energyCount = 1
        break
      case 2:
        energyAmount = Mock.Random.integer(300, 600)
        energyValidDays = 60
        energyCount = Mock.Random.integer(1, 3)
        break
      case 3:
        energyAmount = Mock.Random.integer(600, 1000)
        energyValidDays = 90
        energyCount = Mock.Random.integer(3, 5)
        break
      case 4:
        energyAmount = Mock.Random.integer(1000, 2000)
        energyValidDays = 180
        energyCount = Mock.Random.integer(5, 10)
        break
      default:
        energyAmount = 100
        energyValidDays = 30
        energyCount = 1
    }
    
    orders.push({
      id: String(i),
      orderNo: `E${Mock.Random.string('upper', 6)}${Mock.Random.string('number', 16)}`,
      tgUserId: `${Mock.Random.integer(100000000, 999999999)}`,
      tgUsername: `user_${Mock.Random.word(5, 10)}`,
      tgNickname: Mock.Random.name(),
      botId: `${Mock.Random.integer(1000000000, 9999999999)}`,
      botName: `${Mock.Random.word(3, 8)}bot`,
      orderType: energyTypes[energyType],
      energyAmount,
      energyValidDays,
      energyCount,
      status,
      createTime,
      payTime,
      finishTime,
      remark: status === 2 ? '订单购买成功' : (status === 3 ? '支付超时' : '等待支付')
    })
  }
  
  // 添加一个示例订单
  orders.push({
    id: '51',
    orderNo: 'E622052LGXEKFKKGKPQBJQL',
    tgUserId: '658985874987',
    tgUsername: '658985874987',
    tgNickname: 'Lena',
    botId: '7012121541',
    botName: 'trx107bot',
    orderType: '高级能量包',
    energyAmount: 500,
    energyValidDays: 60,
    energyCount: 2,
    status: 2,
    createTime: '2025-02-24 23:55:22',
    payTime: '2025-02-24 23:58:33',
    finishTime: '2025-02-24 23:59:01',
    remark: '订单购买成功'
  })
  
  return orders
}

// 订单数据
const energyOrders = generateEnergyOrders()

export default [
  // 获取能量订单列表
  {
    url: '/mock/energy_order/list',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { orderNo, orderType, status, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...energyOrders]
      
      // 筛选
      if (orderNo) {
        list = list.filter(item => item.orderNo.includes(orderNo))
      }
      
      if (orderType !== undefined && orderType !== '') {
        list = list.filter(item => item.orderType === Object.values(energyTypes)[parseInt(orderType) - 1])
      }
      
      if (status !== undefined && status !== '') {
        list = list.filter(item => item.status === parseInt(status))
      }
      
      // 分页
      const start = (currentPage - 1) * pageSize
      const end = start + parseInt(pageSize)
      const pageList = list.slice(start, end)
      
      return {
        code: SUCCESS_CODE,
        data: {
          list: pageList,
          total: list.length
        },
        message: '操作成功'
      }
    }
  },
  
  // 获取能量订单详情
  {
    url: '/mock/energy_order/detail',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { id } = request.query
      const order = energyOrders.find(item => item.id === id)
      
      if (!order) {
        return {
          code: 400,
          message: '订单不存在'
        }
      }
      
      // 构建详细信息
      const orderDetail = {
        ...order,
        statusText: orderStatus[order.status],
        payMethod: 'USDT',
        transactionId: Mock.Random.guid()
      }
      
      // 构建能量详情
      const energyDetail = {
        energyPackName: `${order.orderType}`,
        energyAmount: order.energyAmount,
        energyValidDays: `${order.energyValidDays}天`,
        energyCount: order.energyCount,
        unitPrice: (order.energyAmount / order.energyCount).toFixed(2),
        totalPrice: Mock.Random.float(10, 200, 2, 2),
        paymentAddress: "TB623Mq26d8Vs3cQYJXU6PWPaazMPPdb36",
        transactionHash: "ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c"
      }
      
      return {
        code: SUCCESS_CODE,
        data: {
          orderDetail,
          energyDetail
        },
        message: '操作成功'
      }
    }
  },
  
  // 导出能量订单
  {
    url: '/mock/energy_order/export',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: SUCCESS_CODE,
        message: '导出成功',
        data: null
      }
    }
  }
] 