import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义能量交易订单接口
interface EnergyTransactionOrder {
  id: string;
  agentId: string;
  agentName: string;
  orderType: string;
  transactionAmount: string;
  energyToBeIssued: string;
  energyIssued: string;
  receivingAddress: string;
  validDuration: string;
  usageTime: string;
  remainingEnergy: string;
  issueStatus: number;
  issueStatusText: string;
  recoveryStatus: number;
  recoveryStatusText: string;
  createTime: string;
}

// 定义状态枚举
const ISSUE_STATUS: Record<number, string> = {
  0: '待发放',
  1: '发放中',
  2: '已发放',
  3: '发放失败'
}

const RECOVERY_STATUS: Record<number, string> = {
  0: '未回收',
  1: '回收中',
  2: '已回收',
  3: '回收失败'
}

// 订单类型
const ORDER_TYPES = ['按时间租赁', '按笔数租赁', '智能托管']

// 生成能量交易订单列表
const generateEnergyTransactionOrders = (): EnergyTransactionOrder[] => {
  const orders: EnergyTransactionOrder[] = []
  
  for (let i = 1; i <= 100; i++) {
    const issueStatus = Mock.Random.pick([0, 1, 2, 3]) as number
    // 只有发放成功的订单才可能有回收状态
    const recoveryStatus = issueStatus === 2 ? Mock.Random.pick([0, 1, 2, 3]) as number : 0
    const orderType = Mock.Random.pick(ORDER_TYPES)
    
    // 生成能量值，格式为 XX.XW
    const energyAmount = `${Mock.Random.integer(1, 50)}.${Mock.Random.integer(0, 9)}W`
    
    // 发放状态决定已发放能量
    const energyIssued = issueStatus === 2 ? energyAmount : '0W'
    
    // 计算剩余能量
    const originalEnergyValue = parseFloat(energyAmount.replace('W', ''))
    const remainingEnergyValue = recoveryStatus === 2 ? 
      0 : // 已回收，无剩余能量
      (issueStatus === 2 ? 
        Mock.Random.float(0, originalEnergyValue, 1, 1) : // 已发放但未回收，有随机剩余能量
        0) // 未发放，无剩余能量
    
    const remainingEnergy = `${remainingEnergyValue}W`
    
    // 使用时间只有已发放的订单才有
    const usageTime = issueStatus === 2 ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : ''
    
    orders.push({
      id: `ET${Mock.Random.string('number', 10)}`,
      agentId: `A${Mock.Random.string('number', 6)}`,
      agentName: `Agent_${Mock.Random.word(5, 8)}`,
      orderType,
      transactionAmount: `${Mock.Random.float(10, 1000, 2, 2)} TRX`,
      energyToBeIssued: energyAmount,
      energyIssued,
      receivingAddress: `T${Mock.Random.string('upper', 33)}`,
      validDuration: `${Mock.Random.integer(1, 30)}天`,
      usageTime,
      remainingEnergy,
      issueStatus,
      issueStatusText: ISSUE_STATUS[issueStatus],
      recoveryStatus,
      recoveryStatusText: RECOVERY_STATUS[recoveryStatus],
      createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    })
  }
  
  // 添加一些特定示例订单，方便测试
  
  // 1. 待发放订单
  orders.push({
    id: 'ET0000000001',
    agentId: 'A100001',
    agentName: 'TestAgent1',
    orderType: '按时间租赁',
    transactionAmount: '100.00 TRX',
    energyToBeIssued: '10.0W',
    energyIssued: '0W',
    receivingAddress: 'TR9PuPK1aMAL4JGCdGJC9S32AH6T25fUPA',
    validDuration: '7天',
    usageTime: '',
    remainingEnergy: '0W',
    issueStatus: 0,
    issueStatusText: ISSUE_STATUS[0],
    recoveryStatus: 0,
    recoveryStatusText: RECOVERY_STATUS[0],
    createTime: '2023-05-01 10:00:00'
  })
  
  // 2. 发放中订单
  orders.push({
    id: 'ET0000000002',
    agentId: 'A100002',
    agentName: 'TestAgent2',
    orderType: '按笔数租赁',
    transactionAmount: '200.00 TRX',
    energyToBeIssued: '20.0W',
    energyIssued: '0W',
    receivingAddress: 'TYMwiDu22V6XG3yk6W9cTVBz48g5HEsdNM',
    validDuration: '14天',
    usageTime: '',
    remainingEnergy: '0W',
    issueStatus: 1,
    issueStatusText: ISSUE_STATUS[1],
    recoveryStatus: 0,
    recoveryStatusText: RECOVERY_STATUS[0],
    createTime: '2023-05-02 11:00:00'
  })
  
  // 3. 已发放未回收订单
  orders.push({
    id: 'ET0000000003',
    agentId: 'A100003',
    agentName: 'TestAgent3',
    orderType: '智能托管',
    transactionAmount: '300.00 TRX',
    energyToBeIssued: '30.0W',
    energyIssued: '30.0W',
    receivingAddress: 'TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3',
    validDuration: '30天',
    usageTime: '2023-05-03 12:30:00',
    remainingEnergy: '15.5W',
    issueStatus: 2,
    issueStatusText: ISSUE_STATUS[2],
    recoveryStatus: 0,
    recoveryStatusText: RECOVERY_STATUS[0],
    createTime: '2023-05-03 12:00:00'
  })
  
  // 4. 已发放回收中订单
  orders.push({
    id: 'ET0000000004',
    agentId: 'A100004',
    agentName: 'TestAgent4',
    orderType: '按时间租赁',
    transactionAmount: '400.00 TRX',
    energyToBeIssued: '40.0W',
    energyIssued: '40.0W',
    receivingAddress: 'TAuDHgE8xWEzQBnuQvEQFXpoF7iFLkxJKV',
    validDuration: '7天',
    usageTime: '2023-05-04 13:30:00',
    remainingEnergy: '20.0W',
    issueStatus: 2,
    issueStatusText: ISSUE_STATUS[2],
    recoveryStatus: 1,
    recoveryStatusText: RECOVERY_STATUS[1],
    createTime: '2023-05-04 13:00:00'
  })
  
  // 5. 已发放已回收订单
  orders.push({
    id: 'ET0000000005',
    agentId: 'A100005',
    agentName: 'TestAgent5',
    orderType: '按笔数租赁',
    transactionAmount: '500.00 TRX',
    energyToBeIssued: '50.0W',
    energyIssued: '50.0W',
    receivingAddress: 'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYrP',
    validDuration: '14天',
    usageTime: '2023-05-05 14:30:00',
    remainingEnergy: '0W',
    issueStatus: 2,
    issueStatusText: ISSUE_STATUS[2],
    recoveryStatus: 2,
    recoveryStatusText: RECOVERY_STATUS[2],
    createTime: '2023-05-05 14:00:00'
  })
  
  return orders
}

// 生成并存储订单数据
const orders = generateEnergyTransactionOrders()

export default [
  // 获取能量交易订单列表
  { 
    url: '/mock/v1/operation/energy-transaction/list',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { agentId, orderType, issueStatus, recoveryStatus, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...orders]
      
      // 筛选条件处理
      if (agentId) {
        list = list.filter(item => 
          item.agentId.includes(agentId) || 
          item.agentName.toLowerCase().includes(agentId.toLowerCase())
        )
      }
      
      if (orderType !== undefined && orderType !== '') {
        list = list.filter(item => item.orderType === orderType)
      }
      
      if (issueStatus !== undefined && issueStatus !== '') {
        list = list.filter(item => item.issueStatus === parseInt(issueStatus))
      }
      
      if (recoveryStatus !== undefined && recoveryStatus !== '') {
        list = list.filter(item => item.recoveryStatus === parseInt(recoveryStatus))
      }
      
      // 按创建时间降序排序
      list.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      
      // 分页处理
      const startIndex = (parseInt(currentPage) - 1) * parseInt(pageSize)
      const endIndex = startIndex + parseInt(pageSize)
      const pageList = list.slice(startIndex, endIndex)
      
      return {
        code: SUCCESS_CODE,
        data: {
          list: pageList,
          totalCount: list.length
        },
        message: '操作成功'
      }
    }
  },
  
  // 获取能量交易订单详情
  {
    url: '/mock/v1/operation/energy-transaction/detail',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { id } = request.query
      
      const order = orders.find(item => item.id === id)
      
      if (!order) {
        return {
          code: 400,
          message: '订单不存在'
        }
      }
      
      return {
        code: SUCCESS_CODE,
        data: order,
        message: '操作成功'
      }
    }
  },
  
  // 更新能量交易订单状态
  {
    url: '/mock/v1/operation/energy-transaction/update-status',
    method: 'post',
    timeout,
    response: (request: any) => {
      const { id, issueStatus, recoveryStatus } = request.body
      
      const orderIndex = orders.findIndex(item => item.id === id)
      
      if (orderIndex === -1) {
        return {
          code: 400,
          message: '订单不存在'
        }
      }
      
      const order = orders[orderIndex]
      
      // 发放状态更新
      if (issueStatus !== undefined) {
        // 状态检查：只有待发放和发放中的订单才能更新为已发放
        if (issueStatus === 2 && ![0, 1].includes(order.issueStatus)) {
          return {
            code: 400,
            message: '当前订单状态不允许更新为已发放'
          }
        }
        
        order.issueStatus = issueStatus
        order.issueStatusText = ISSUE_STATUS[issueStatus]
        
        // 如果状态更新为已发放，设置相关字段
        if (issueStatus === 2) {
          order.energyIssued = order.energyToBeIssued
          order.usageTime = new Date().toISOString().replace('T', ' ').slice(0, 19)
          
          // 设置初始剩余能量等于发放能量
          const energyValue = parseFloat(order.energyToBeIssued.replace('W', ''))
          order.remainingEnergy = `${energyValue}W`
        } else if (issueStatus === 0 || issueStatus === 1 || issueStatus === 3) {
          // 如果状态非已发放，重置相关字段
          order.energyIssued = '0W'
          order.usageTime = ''
          order.remainingEnergy = '0W'
          // 未发放成功，回收状态必须为未回收
          order.recoveryStatus = 0
          order.recoveryStatusText = RECOVERY_STATUS[0]
        }
      }
      
      // 回收状态更新
      if (recoveryStatus !== undefined) {
        // 状态检查：只有已发放的订单才能更新回收状态
        if (order.issueStatus !== 2) {
          return {
            code: 400,
            message: '只有已发放的订单才能更新回收状态'
          }
        }
        
        // 状态检查：只有未回收和回收中的订单才能更新为已回收
        if (recoveryStatus === 2 && ![0, 1].includes(order.recoveryStatus)) {
          return {
            code: 400,
            message: '当前回收状态不允许更新为已回收'
          }
        }
        
        order.recoveryStatus = recoveryStatus
        order.recoveryStatusText = RECOVERY_STATUS[recoveryStatus]
        
        // 如果状态更新为已回收，剩余能量置为0
        if (recoveryStatus === 2) {
          order.remainingEnergy = '0W'
        } else if (recoveryStatus === 0 || recoveryStatus === 1 || recoveryStatus === 3) {
          // 如果状态非已回收，恢复剩余能量
          const energyValue = parseFloat(order.energyToBeIssued.replace('W', ''))
          const randomRemaining = (Math.random() * energyValue).toFixed(1)
          order.remainingEnergy = `${randomRemaining}W`
        }
      }
      
      return {
        code: SUCCESS_CODE,
        data: order,
        message: '更新成功'
      }
    }
  },
  
  // 导出能量交易订单
  {
    url: '/mock/v1/operation/energy-transaction/export',
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