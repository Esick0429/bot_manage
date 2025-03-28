// 定义统计数据接口
export interface StatisticsItem {
  amount: number
  currency: string
  description: string
}

export interface RobotIncomeItem {
  totalIncome: number
  currency: string
  robotQuantity: number
  description: string
}

export interface DailyStatistics {
  energyIncome: StatisticsItem
  exchangeExpense: StatisticsItem
  exchangeIncome: StatisticsItem
  netProfit: StatisticsItem
  newAgents: StatisticsItem
  energyExpense: StatisticsItem
  robotIncomePerQuantity: RobotIncomeItem
}

export interface StatisticsData {
  dailyStatistics: DailyStatistics
}

export interface StatisticsResponse {
  code: number
  data: StatisticsData
  message: string
}

// 机器人摘要数据类型定义
export interface BotSummaryItem {
  id: string
  date: string
  botId: string
  botUsername: string

  // 金额相关字段（将显示在表格中）
  trxCost: number
  trxProfit: number
  rechargeTrxAmount: number
  rechargeUsdtAmount: number
  energyOrderTrxAmount: number
  energyOrderUsdtAmount: number
  hostedOrderTrxAmount: number
  hostedOrderUsdtAmount: number

  // 笔数相关字段（将显示在详情中）
  newUserCount: number
  rechargeOrderCount: number
  rechargeTrxOrderCount: number
  rechargeUsdtOrderCount: number
  energyOrderCount: number
  energyTimeRentalOrderCount: number
  energyBatchOrderCount: number
  hostedOrderCount: number
  hostedTransactionCount: number
}

export interface BotSummaryResponse {
  code: number
  data: {
    list: BotSummaryItem[]
    total: number
  }
  message: string
}
