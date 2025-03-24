import { SUCCESS_CODE } from '@/constants'
import { MockMethod } from 'vite-plugin-mock'

const timeout = 1000

export default [
  // 每日统计数据接口
  {
    url: '/mock/statistics/daily',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: SUCCESS_CODE,
        data: {
          dailyStatistics: {
            energyIncome: { 
              amount: 256489, 
              currency: 'TRX', 
              description: '今日能量收入' 
            },
            exchangeExpense: { 
              amount: 89754, 
              currency: 'TRX', 
              description: '今日闪兑支出' 
            },
            exchangeIncome: { 
              amount: 124560, 
              currency: 'TRX', 
              description: '今日闪兑收入' 
            },
            netProfit: { 
              amount: 183456, 
              currency: 'TRX', 
              description: '今日净利润' 
            },
            newAgents: { 
              amount: 28, 
              currency: '', 
              description: '今日新增代理' 
            },
            energyExpense: { 
              amount: 108250, 
              currency: '', 
              description: '今日支出能量' 
            },
            robotIncomePerQuantity: { 
              totalIncome: 78450, 
              currency: 'TRX', 
              robotQuantity: 156, 
              description: '今日机器人收入/数量' 
            }
          }
        },
        message: 'success'
      }
    }
  }
] as MockMethod[] 