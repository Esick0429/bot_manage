import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义兑换订单接口
interface ExchangeOrder {
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
  exchangeRate: string
  exchangeAmount: string
  receivingAddress: string
  status: number
  statusText: string
  createTime: string
  payTime: string | null
  finishTime: string | null
  remark: string
  transactionHash?: string
  walletAddress: string
  orderType: string
}

// 订单状态
const ORDER_STATUS: Record<number, string> = {
  1: '待支付',
  2: '已完成',
  3: '已取消'
}

// 生成兑换订单列表
const generateExchangeOrders = (): ExchangeOrder[] => {
  const orders: ExchangeOrder[] = []
  for (let i = 1; i <= 50; i++) {
    const status = Mock.Random.pick([0, 1, 2, 3, 4])
    const createTime = Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    const payTime = status >= 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null
    const finishTime = status === 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : null
    const payAmount = `${Mock.Random.float(10, 100, 2, 2)}USDT`
    const exchangeAmount = `${Mock.Random.float(20, 200, 3, 6)}TRX`

    orders.push({
      id: i,
      orderNo: `R${Mock.Random.string('upper', 6)}${Mock.Random.string('number', 10)}`,
      tgUserId: `${Mock.Random.integer(10000000, 99999999)}`,
      tgUsername: `${Mock.Random.integer(10000000, 99999999)}`,
      tgNickname: `${Mock.Random.word(3, 6)}bot`,
      botId: `${Mock.Random.integer(10000000, 99999999)}`,
      botName: `${Mock.Random.word(3, 6)}bot`,
      orderAmount: payAmount,
      payAmount: payAmount,
      payType: Mock.Random.pick(['余额支付', '钱包支付']),
      exchangeRate: `${Mock.Random.float(0.1, 0.9, 6, 6)}`,
      exchangeAmount: exchangeAmount,
      receivingAddress: `T${Mock.Random.string('upper', 33)}`,
      status,
      statusText: ORDER_STATUS[status],
      createTime,
      payTime,
      finishTime,
      remark: '',
      walletAddress: `T${Mock.Random.string('upper', 33)}`,
      orderType: '兑换TRX'
    })
  }

  // 添加特定示例订单
  orders.push({
    id: 101,
    orderNo: 'R622052LGXEKFKKGKPQBJQL',
    tgUserId: '658985874887',
    tgUsername: '658985874887',
    tgNickname: 'trx107bot',
    botId: '658985874887',
    botName: 'trx107bot',
    orderAmount: '2.00USDT',
    payAmount: '2.00USDT',
    payType: '余额支付',
    exchangeRate: '0.234236',
    exchangeAmount: '8.173458TRX',
    receivingAddress: 'TR9PuPK1aMAL4JGCdGJC9S32AH6T25fUPA',
    status: 2,
    statusText: '已完成',
    createTime: '2025-02-24 23:55:22',
    payTime: '2025-02-24 23:55:22',
    finishTime: '2025-02-24 23:55:22',
    transactionHash: 'b33fe10cad17bed6579ac01f94891617f0111571b2c3107bb21a70499f7207d2',
    walletAddress: 'TR9PuPK1aMAL4JGCdGJC9S32AH6T25fUPA',
    remark: '测试兑换订单',
    orderType: '兑换TRX'
  })

  return orders
}

const orders = generateExchangeOrders()

export default [
  // 获取兑换订单列表
  {
    url: '/mock/v1/order/exchange_order/list',
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
  
  // 获取兑换订单详情
  {
    url: '/mock/v1/order/exchange_order/detail',
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
            // 可以添加额外的兑换订单详情字段
          }
        },
        message: '操作成功'
      }
    }
  },
  
  // 导出兑换订单
  {
    url: '/mock/v1/order/exchange_order/export',
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
          sender: 'TTSGZF4YqWRDZ2TT23TwcrTSxSCJfxLvMR',
          receiver: 'TZ5VUwCDAUrF2Bp573R1u89SQ4bj5nk7Kw',
          block_details: '70435203',
          transaction_status: '已完成',
          trx_amount: '176 TRX',
          create_time: '2025-02-24 23:55:22',
          complete_time: '2025-02-24 23:55:22'
        },
        message: '操作成功'
      }
    }
  },
  
  // 获取转入详情
  {
    url: '/mock/v1/order/transfer-in/detail',
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
          sender: 'TYqkhCsrs64vQ3DeGVM3UmZB7gUfZ5ZJEH',
          receiver: 'TAP7VvoVUTE1A3UBJh7kkWRDLUWUVrDLGc',
          block_details: '70435203',
          transaction_status: '已完成',
          usdt_amount: '176 USDT',
          create_time: '2025-02-24 23:55:22',
          complete_time: '2025-02-24 23:55:22'
        },
        message: '操作成功'
      }
    }
  }
] 