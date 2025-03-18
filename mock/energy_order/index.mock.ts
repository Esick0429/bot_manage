import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义能量订单接口
interface EnergyOrder {
  id: number
  orderNo: string
  tgUserId: string
  tgUsername: string
  tgNickname: string
  botId: string
  botName: string
  orderType: string
  orderTypeId: number
  energyAmount: string
  energyValidDays: number
  energyCount: number
  status: number
  statusText: string
  createTime: string
  payTime: string | null
  finishTime: string | null
  remark: string
  transactionHash?: string
}

// 订单类型
const ORDER_TYPES: Record<number, string> = {
  1: '按笔数',
  2: '按时间',
  3: '闪租',
  4: '批量下单'
}

// 订单状态
const ORDER_STATUS: Record<number, string> = {
  0: '待支付',
  1: '支付中',
  2: '支付成功',
  3: '支付失败',
  4: '已取消'
}

// 生成能量订单列表
const generateEnergyOrders = (): EnergyOrder[] => {
  const orders: EnergyOrder[] = []
  for (let i = 1; i <= 50; i++) {
    const orderType = Mock.Random.pick([1, 2, 3, 4])
    const status = Mock.Random.pick([0, 1, 2, 3, 4])
    const createTime = Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    const payTime = status >= 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null
    const finishTime = status === 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null

    orders.push({
      id: i,
      orderNo: `E${Mock.Random.string('upper', 6)}${Mock.Random.string('number', 10)}`,
      tgUserId: `${Mock.Random.integer(10000000, 99999999)}`,
      tgUsername: `user_${Mock.Random.word(5, 10)}`,
      tgNickname: Mock.Random.name(),
      botId: `${Mock.Random.integer(1000000, 9999999)}`,
      botName: `${Mock.Random.word(3, 6)}bot`,
      orderType: ORDER_TYPES[orderType],
      orderTypeId: orderType,
      energyAmount: `${Mock.Random.integer(1, 20)}.${Mock.Random.integer(1, 9)}W`,
      energyValidDays: Mock.Random.integer(1, 30),
      energyCount: Mock.Random.integer(1, 200),
      status,
      statusText: ORDER_STATUS[status],
      createTime,
      payTime,
      finishTime,
      remark: ''
    })
  }

  // 添加特定类型的示例订单
  orders.push({
    id: 101,
    orderNo: 'E001001',
    tgUserId: '12345678',
    tgUsername: 'user_example',
    tgNickname: 'Example User',
    botId: '87654321',
    botName: 'testbot',
    orderType: '按笔数',
    orderTypeId: 1,
    energyAmount: '10.5W',
    energyValidDays: 7,
    energyCount: 100,
    status: 2,
    statusText: '支付成功',
    createTime: '2023-10-01 10:00:00',
    payTime: '2023-10-01 10:05:00',
    finishTime: '2023-10-01 10:10:00',
    transactionHash: 'ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c',
    remark: '测试按笔数订单'
  })

  orders.push({
    id: 102,
    orderNo: 'E001002',
    tgUserId: '12345678',
    tgUsername: 'user_example',
    tgNickname: 'Example User',
    botId: '87654321',
    botName: 'testbot',
    orderType: '按时间',
    orderTypeId: 2,
    energyAmount: '6.5W',
    energyValidDays: 1,
    energyCount: 0,
    status: 2,
    statusText: '支付成功',
    createTime: '2023-10-02 10:00:00',
    payTime: '2023-10-02 10:05:00',
    finishTime: '2023-10-02 10:10:00',
    transactionHash: '705130bcea62464850a51d58f8b47bed27c0c39a560701bccee94d9fd6cd6602',
    remark: '测试按时间订单'
  })

  orders.push({
    id: 103,
    orderNo: 'E001003',
    tgUserId: '12345678',
    tgUsername: 'user_example',
    tgNickname: 'Example User',
    botId: '87654321',
    botName: 'testbot',
    orderType: '闪租',
    orderTypeId: 3,
    energyAmount: '1.0W',
    energyValidDays: 1,
    energyCount: 1,
    status: 2,
    statusText: '支付成功',
    createTime: '2023-10-03 10:00:00',
    payTime: '2023-10-03 10:05:00',
    finishTime: '2023-10-03 10:10:00',
    transactionHash: 'ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c',
    remark: '测试闪租订单'
  })

  return orders
}

const orders = generateEnergyOrders()

export default [
  // 获取能量订单列表
  {
    url: '/mock/v1/order/energy_order/list',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { orderNo, orderType, status, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...orders]
      
      // 筛选
      if (orderNo) {
        list = list.filter(item => item.orderNo.includes(orderNo))
      }
      
      if (orderType) {
        list = list.filter(item => item.orderTypeId === parseInt(orderType))
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
    url: '/mock/v1/order/energy_order/detail',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { id } = request.query
      
      const order = orders.find(item => item.id === parseInt(id))
      
      if (!order) {
        return {
          code: 400,
          message: '订单不存在'
        }
      }
      
      // 构建能量详情
      let energyDetail: Record<string, any> = {}
      
      if (order.orderTypeId === 1) { // 按笔数
        energyDetail = {
          rentCount: '100',
          countPerTransaction: '1笔',
          energyTrxPrice: '5.00TRX',
          energyUsdtPrice: '1.00TRX',
          paymentAddress: 'TYsJujKoFrMLC6bdRwZ7Ji6CabQ3pARnBj',
          transactionHash: 'ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c'
        }
      } else if (order.orderTypeId === 2) { // 按时间
        energyDetail = {
          energyAmount: '6.5W',
          validityPeriod: '1小时',
          receivingAddress: 'TBAQYwDc3pDAXMUodZK67MRCF5YNJt4qnp',
          transactionHash: '705130bcea62464850a51d58f8b47bed27c0c39a560701bccee94d9fd6cd6602'
        }
      } else if (order.orderTypeId === 3) { // 闪租
        energyDetail = {
          flashRentCount: '1',
          flashRentPrice: '3.00trx/笔',
          receivingAddress: 'TBNDqnnZVTjHZTqyZT4xdSFJYcZnYfQGNp',
          paymentAddress: 'TYsJujKoFrMLC6bdRwZ7Ji6CabQ3pARnBj',
          transactionHash: 'ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c'
        }
      } else { // 批量下单
        energyDetail = {
          energyPackName: '标准能量包',
          energyAmount: order.energyAmount,
          energyValidDays: `${order.energyValidDays}天`,
          energyCount: order.energyCount,
          unitPrice: '2.5TRX',
          totalPrice: '250TRX',
          paymentAddress: 'TYsJujKoFrMLC6bdRwZ7Ji6CabQ3pARnBj',
          transactionHash: 'ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c'
        }
      }
      
      return {
        code: SUCCESS_CODE,
        data: {
          orderDetail: order,
          energyDetail
        },
        message: '操作成功'
      }
    }
  },
  
  // 导出能量订单
  {
    url: '/mock/v1/order/energy_order/export',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: SUCCESS_CODE,
        data: null,
        message: '导出成功'
      }
    }
  },

  // 获取交易详情
  {
    url: '/mock/v1/order/energy_order/transaction_detail',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { transaction_hash } = request.query
      
      if (!transaction_hash) {
        return {
          code: 400,
          message: '交易哈希不能为空'
        }
      }
      
      return {
        code: SUCCESS_CODE,
        data: {
          transaction_hash: transaction_hash,
          from_address: 'TTSGZF4YqWRDZ2TT23TwcrTSxSCJfxLvMR',
          block_details: '70435110',
          to_address: 'TZ5VUwCDAUrF2Bp573R1u89SQ4bj5nk7Kw',
          transaction_status: '已完成',
          validity_period: '1天',
          energy_amount: '13.1W',
          create_time: '2025-02-24 23:55:22',
          complete_time: '2025-02-24 23:55:22'
        },
        message: '操作成功'
      }
    }
  }
] 