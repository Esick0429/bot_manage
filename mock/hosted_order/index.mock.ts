import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义托管订单接口
interface HostedOrder {
  id: number
  orderNo: string
  tgUserId: string
  tgUsername: string
  tgNickname: string
  botId: string
  botName: string
  orderAmount: string
  payAmount: string
  payType: string
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
  walletAddress: string
}

// 订单状态
const ORDER_STATUS: Record<number, string> = {
  0: '待支付',
  1: '支付中',
  2: '已完成',
  3: '支付失败',
  4: '已取消'
}

// 生成托管订单列表
const generateHostedOrders = (): HostedOrder[] => {
  const orders: HostedOrder[] = []
  for (let i = 1; i <= 50; i++) {
    const status = Mock.Random.pick([0, 1, 2, 3, 4])
    const createTime = Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    const payTime = status >= 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null
    const finishTime = status === 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null
    const payAmount = `${Mock.Random.float(10, 100, 2, 2)} USDT`

    orders.push({
      id: i,
      orderNo: `R${Mock.Random.string('upper', 6)}${Mock.Random.string('number', 10)}`,
      tgUserId: `${Mock.Random.integer(10000000, 99999999)}`,
      tgUsername: `user_${Mock.Random.word(5, 10)}`,
      tgNickname: Mock.Random.name(),
      botId: `${Mock.Random.integer(1000000, 9999999)}`,
      botName: `${Mock.Random.word(3, 6)}bot`,
      orderAmount: payAmount,
      payAmount: payAmount,
      payType: Mock.Random.pick(['余额支付', '钱包支付']),
      energyAmount: `${Mock.Random.integer(1, 20)}.${Mock.Random.integer(1, 9)}W`,
      energyValidDays: Mock.Random.integer(1, 30),
      energyCount: Mock.Random.integer(1, 200),
      status,
      statusText: ORDER_STATUS[status],
      createTime,
      payTime,
      finishTime,
      remark: '',
      walletAddress: `T${Mock.Random.string('upper', 33)}`
    })
  }

  // 添加特定示例订单
  orders.push({
    id: 101,
    orderNo: 'R622052LGXEKFKGKPQBJQL',
    tgUserId: '658985874877',
    tgUsername: 'user_example',
    tgNickname: 'Lena',
    botId: '7012121541',
    botName: 'trx107bot',
    orderAmount: '50.01 USDT',
    payAmount: '50.01 USDT',
    payType: '余额支付',
    energyAmount: '13.1W',
    energyValidDays: 1,
    energyCount: 2,
    status: 2,
    statusText: '已完成',
    createTime: '2025-02-24 23:55:22',
    payTime: '2025-02-24 23:55:22',
    finishTime: '2025-02-24 23:55:22',
    transactionHash: 'b33fe10cad17bed6579ac01f94891617f0111571b2c3107bb21a70499f7207d2',
    walletAddress: 'TR9PuPK1aMAL4JGCdGJC9S32AH6T25fUPA',
    remark: '测试托管订单'
  })

  return orders
}

const orders = generateHostedOrders()

export default [
  // 获取托管订单列表
  {
    url: '/mock/v1/order/hosted_order/list',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { orderNo, status, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...orders]
      
      // 筛选
      if (orderNo) {
        list = list.filter(item => item.orderNo.includes(orderNo))
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
  
  // 获取托管订单详情
  {
    url: '/mock/v1/order/hosted_order/detail',
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
      
      return {
        code: SUCCESS_CODE,
        data: {
          orderDetail: {
            ...order,
            // 可以添加额外的托管订单详情字段
          }
        },
        message: '操作成功'
      }
    }
  },
  
  // 导出托管订单
  {
    url: '/mock/v1/order/hosted_order/export',
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
    url: '/mock/v1/order/transaction/detail',
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