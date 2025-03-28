import { SUCCESS_CODE } from '@/constants'
import { MockMethod } from 'vite-plugin-mock'

const timeout = 1000

// 生成统计数据
const generateMockStatistics = () => {
  return {
    dailyStatistics: {
      energyIncome: {
        amount: Math.floor(Math.random() * 10000),
        currency: 'TRX',
        description: '今日能量收入'
      },
      exchangeExpense: {
        amount: Math.floor(Math.random() * 5000),
        currency: 'TRX',
        description: '今日闪兑支出'
      },
      exchangeIncome: {
        amount: Math.floor(Math.random() * 8000),
        currency: 'TRX',
        description: '今日闪兑收入'
      },
      netProfit: {
        amount: Math.floor(Math.random() * 15000),
        currency: 'TRX',
        description: '今日净利润'
      },
      newAgents: {
        amount: Math.floor(Math.random() * 50),
        currency: '',
        description: '今日新增代理'
      },
      energyExpense: {
        amount: Math.floor(Math.random() * 200000),
        currency: '',
        description: '今日支出能量'
      },
      robotIncomePerQuantity: {
        totalIncome: Math.floor(Math.random() * 20000),
        currency: 'TRX',
        robotQuantity: Math.floor(Math.random() * 100),
        description: '今日机器人收入/数量'
      }
    }
  }
}

// 生成机器人摘要数据
const generateMockBotSummary = (pageSize = 10, pageNum = 1, botId = null) => {
  return Array.from({ length: pageSize }, (_, index) => {
    const id = String((pageNum - 1) * pageSize + index + 1)
    const randomBotId = String(Math.floor(Math.random() * 100) + 1)
    
    // 金额相关的模拟数据
    const trxCost = Math.random() * 5000
    const trxProfit = Math.random() * 3000
    const rechargeTrxAmount = Math.random() * 10000
    const rechargeUsdtAmount = Math.random() * 5000
    const energyOrderTrxAmount = Math.random() * 8000
    const energyOrderUsdtAmount = Math.random() * 4000
    const hostedOrderTrxAmount = Math.random() * 6000
    const hostedOrderUsdtAmount = Math.random() * 3000
    
    // 笔数相关的模拟数据
    const newUserCount = Math.floor(Math.random() * 100)
    const rechargeOrderCount = Math.floor(Math.random() * 200)
    const rechargeTrxOrderCount = Math.floor(Math.random() * 150)
    const rechargeUsdtOrderCount = Math.floor(Math.random() * 50)
    const energyOrderCount = Math.floor(Math.random() * 300)
    const energyTimeRentalOrderCount = Math.floor(Math.random() * 200)
    const energyBatchOrderCount = Math.floor(Math.random() * 100)
    const hostedOrderCount = Math.floor(Math.random() * 120)
    const hostedTransactionCount = Math.floor(Math.random() * 500)
    
    return {
      id,
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      botId: botId || randomBotId,
      botUsername: `Bot_${botId || randomBotId}`,
      
      // 金额相关字段
      trxCost,
      trxProfit,
      rechargeTrxAmount,
      rechargeUsdtAmount,
      energyOrderTrxAmount,
      energyOrderUsdtAmount,
      hostedOrderTrxAmount,
      hostedOrderUsdtAmount,
      
      // 笔数相关字段
      newUserCount,
      rechargeOrderCount,
      rechargeTrxOrderCount,
      rechargeUsdtOrderCount,
      energyOrderCount,
      energyTimeRentalOrderCount,
      energyBatchOrderCount,
      hostedOrderCount,
      hostedTransactionCount
    }
  })
}

export default [
  // 获取每日统计数据
  {
    url: '/mock/statistics/daily',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: SUCCESS_CODE,
        data: generateMockStatistics(),
        message: 'success'
      }
    }
  },
  
  // 获取机器人摘要数据
  {
    url: '/mock/statistics/bot-summary',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const { pageSize = 10, pageNum = 1, botId = null } = query
      return {
        code: SUCCESS_CODE,
        data: {
          list: generateMockBotSummary(Number(pageSize), Number(pageNum), botId),
          total: 100
        },
        message: 'success'
      }
    }
  }
] as MockMethod[] 