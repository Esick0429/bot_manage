// 能量交易订单接口定义
export interface EnergyTransactionOrder {
  id: string // 订单ID
  agentId: string // 代理ID
  agentName: string // 代理名称
  orderType: string // 订单类型
  transactionAmount: string // 交易金额
  energyToBeIssued: string // 应发放能量
  energyIssued: string // 实际发放能量
  receivingAddress: string // 接收地址
  validDuration: string // 有效时长
  usageTime: string // 使用时间
  remainingEnergy: string // 剩余能量
  issueStatus: number // 发放状态
  issueStatusText: string // 发放状态文本
  recoveryStatus: number // 回收状态
  recoveryStatusText: string // 回收状态文本
  createTime: string // 创建时间
}

// 能量交易订单响应接口
export interface EnergyTransactionResponse {
  list: EnergyTransactionOrder[]
  totalCount: number
}

// 能量交易订单查询参数
export interface EnergyTransactionQueryParams {
  agentId?: string
  orderType?: string
  issueStatus?: number
  recoveryStatus?: number
  pageSize?: number
  currentPage?: number
}

// 状态更新参数
export interface UpdateStatusParams {
  id: string
  issueStatus?: number
  recoveryStatus?: number
}
