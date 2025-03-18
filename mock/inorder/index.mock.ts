import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义充值订单接口，与Go结构体保持一致
interface RechargeOrder {
  id: number
  order_id: string
  tg_id: number
  tg_name: string
  tg_nickname: string
  bot_id: number
  bot_name: string
  order_type_id: number
  in_mount: string
  in_unit: string
  pay_mount: string
  pay_unit: string
  status: number
  describe: string
  create_time: number
  pay_time: number | null
  finish_time: number | null
}

// 定义订单状态（与Go结构体保持一致）
const orderStatus = {
  1: '待支付',
  2: '已完成',
  3: '已取消'
}

// 定义充值类型
const rechargeTypes = {
  1: 'TRX',
  2: 'USDT'
}

// 生成充值订单数据
const generateRechargeOrders = (): RechargeOrder[] => {
  const orders: RechargeOrder[] = []
  
  for (let i = 1; i <= 50; i++) {
    const status = Mock.Random.pick([1, 2, 3])
    const rechargeType = Mock.Random.pick([1, 2])
    const now = Math.floor(Date.now() / 1000) // 当前时间的秒级时间戳
    
    // 只有支付成功/已完成的订单才有支付时间和完成时间
    const payTime = status >= 2 ? now - Mock.Random.integer(3600, 86400) : null
    const finishTime = status === 2 ? now - Mock.Random.integer(1800, 3600) : null
    const createTime = now - Mock.Random.integer(86400, 604800) // 1-7天前创建
    
    const amount = Mock.Random.float(10, 1000, 2, 2).toString()
    const unit = rechargeType === 1 ? 'TRX' : 'USDT'
    
    orders.push({
      id: i,
      order_id: `R${Mock.Random.string('upper', 6)}${Mock.Random.string('number', 16)}`,
      tg_id: Mock.Random.integer(100000000, 999999999),
      tg_name: `user_${Mock.Random.word(5, 10)}`,
      tg_nickname: Mock.Random.name(),
      bot_id: Mock.Random.integer(1000000000, 9999999999),
      bot_name: `${Mock.Random.word(3, 8)}bot`,
      order_type_id: rechargeType,
      in_mount: amount,
      in_unit: unit,
      pay_mount: amount,
      pay_unit: unit,
      status,
      describe: status === 2 ? '订单充值成功' : (status === 3 ? '已取消' : '等待支付'),
      create_time: createTime,
      pay_time: payTime,
      finish_time: finishTime
    })
  }
  
  // 添加一个示例订单
  orders.push({
    id: 51,
    order_id: 'R622052LGXEKFKKGKPQBJQL',
    tg_id: 658985874987,
    tg_name: 'user_telegram',
    tg_nickname: 'Lena',
    bot_id: 7012121541,
    bot_name: 'trx107bot',
    order_type_id: 2,
    in_mount: '50.01',
    in_unit: 'USDT',
    pay_mount: '50.01',
    pay_unit: 'USDT',
    status: 1,
    describe: '等待支付',
    create_time: Math.floor(Date.now() / 1000) - 3600,
    pay_time: null,
    finish_time: null
  })
  
  return orders
}

// 订单数据
const rechargeOrders = generateRechargeOrders()

export default [
  // 获取充值订单列表
  {
    url: '/mock/v1/order/inorder/list',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { order_id, status, tg_id, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...rechargeOrders]
      
      // 筛选
      if (order_id) {
        list = list.filter(item => item.order_id.includes(order_id))
      }
      
      if (status !== undefined && status !== '') {
        list = list.filter(item => item.status === parseInt(status))
      }
      
      if (tg_id) {
        list = list.filter(item => item.tg_id.toString().includes(tg_id))
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
    url: '/mock/v1/order/inorder/detail',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { id } = request.query
      const order = rechargeOrders.find(item => item.id === parseInt(id))
      
      if (!order) {
        return {
          code: 400,
          message: '订单不存在'
        }
      }
      
      // 构建详细信息
      const orderDetail = {
        ...order,
        statusText: orderStatus[order.status]
      }
      
      // 构建充值详情
      const rechargeDetail = {
        depositAddress: "TYsJujKoFrMLC6bdRwZ7Ji6CabQ3pARnBj",
        paymentAddress: "TB623Mq26d8Vs3cQYJXU6PWPaazMPPdb36",
        blockNumber: "69920026",
        transactionHash: "ce9dae06fe8194416e14dd8e9564241cf4895ff1410390ec7bc73a623cfd967c"
      }
      
      // 如果是示例订单，使用特定数据
      if (order.order_id === 'R622052LGXEKFKKGKPQBJQL') {
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
    url: '/mock/v1/order/inorder/export',
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