import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义充值订单接口
interface RechargeOrder {
  id: string
  orderNo: string
  tgUserId: string
  tgUsername: string
  tgNickname: string
  botId: string
  botName: string
  orderType: string
  rechargeAmount: string
  payAmount: string
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

// 定义充值类型
const rechargeTypes = {
  1: '余额充值',
  2: 'VIP会员',
  3: '套餐购买',
  4: '充值USDT'
}

// 生成充值订单数据
const generateRechargeOrders = (): RechargeOrder[] => {
  const orders: RechargeOrder[] = []
  
  for (let i = 1; i <= 50; i++) {
    const status = Mock.Random.pick([0, 1, 2, 3, 4])
    const rechargeType = Mock.Random.pick([1, 2, 3, 4])
    const createTime = Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    
    // 只有支付成功/失败的订单才有支付时间和完成时间
    const payTime = status >= 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null
    const finishTime = status === 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null
    
    const amount = Mock.Random.float(10, 1000, 2, 2)
    
    orders.push({
      id: String(i),
      orderNo: `R${Mock.Random.string('upper', 6)}${Mock.Random.string('number', 16)}`,
      tgUserId: `${Mock.Random.integer(100000000, 999999999)}`,
      tgUsername: `user_${Mock.Random.word(5, 10)}`,
      tgNickname: Mock.Random.name(),
      botId: `${Mock.Random.integer(1000000000, 9999999999)}`,
      botName: `${Mock.Random.word(3, 8)}bot`,
      orderType: rechargeTypes[rechargeType],
      rechargeAmount: `${amount}${rechargeType === 4 ? 'USDT' : ''}`,
      payAmount: `${amount}${rechargeType === 4 ? 'USDT' : ''}`,
      status,
      createTime,
      payTime,
      finishTime,
      remark: status === 2 ? '订单充值成功' : (status === 3 ? '支付超时' : '等待支付')
    })
  }
  
  // 添加一个示例订单
  orders.push({
    id: '51',
    orderNo: 'R622052LGXEKFKKGKPQBJQL',
    tgUserId: '658985874987',
    tgUsername: '658985874987',
    tgNickname: 'Lena',
    botId: '7012121541',
    botName: 'trx107bot',
    orderType: '充值USDT',
    rechargeAmount: '50.01USDT',
    payAmount: '50.01USDT',
    status: 0,
    createTime: '2025-02-24 23:55:22',
    payTime: null,
    finishTime: null,
    remark: '等待支付'
  })
  
  return orders
}

// 订单数据
const rechargeOrders = generateRechargeOrders()

export default [
  // 获取充值订单列表
  {
    url: '/mock/recharge_order/list',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { orderNo, status, tgUserId, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...rechargeOrders]
      
      // 筛选
      if (orderNo) {
        list = list.filter(item => item.orderNo.includes(orderNo))
      }
      
      if (status !== undefined && status !== '') {
        list = list.filter(item => item.status === parseInt(status))
      }
      
      if (tgUserId) {
        list = list.filter(item => item.tgUserId.includes(tgUserId))
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
  
  // 获取充值订单详情
  {
    url: '/mock/recharge_order/detail',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { id } = request.query
      const order = rechargeOrders.find(item => item.id === id)
      
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
      
      // 构建充值详情
      const rechargeDetail = {
        depositAddress: "TYsJujKoFrMLC6bdRwZ7Ji6CabQ3pARnBj",
        paymentAddress: "TB623Mq26d8Vs3cQYJXU6PWPaazMPPdb36",
        blockNumber: "69920026",
        transactionHash: "ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c"
      }
      
      // 如果是示例订单，使用特定数据
      if (order.orderNo === 'R622052LGXEKFKKGKPQBJQL') {
        Object.assign(orderDetail, {
          orderNo: "R622052LGXEKFKKGKPQBJQL",
          orderType: "充值USDT",
          tgUsername: "658985874987",
          tgNickname: "Lena",
          botId: "7012121541",
          botName: "trx107bot",
          rechargeAmount: "50.01USDT",
          payAmount: "50.01USDT",
          status: 0,
          statusText: "待支付",
          createTime: "2025-02-24 23:55:22",
          payTime: "2025-02-24 23:55:22",
          finishTime: "2025-02-24 23:55:22",
          remark: "订单充值成功"
        })
        
        Object.assign(rechargeDetail, {
          depositAddress: "TYsJujKoFrMLC6bdRwZ7Ji6CabQ3pARnBj",
          paymentAddress: "TB623Mq26d8Vs3cQYJXU6PWPaazMPPdb36",
          blockNumber: "69920026",
          transactionHash: "ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c"
        })
      }
      
      return {
        code: SUCCESS_CODE,
        data: {
          orderDetail,
          rechargeDetail
        },
        message: '操作成功'
      }
    }
  },
  
  // 导出充值订单
  {
    url: '/mock/recharge_order/export',
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