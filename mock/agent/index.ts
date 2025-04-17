import { MockMethod } from 'vite-plugin-mock'
import { Random } from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

// 模拟数据库数据
const mockLedgerData = (() => {
  const result: any[] = []
  
  // 生成30条测试数据
  for (let i = 0; i < 30; i++) {
    const balanceBefore = parseFloat((Math.random() * 10000).toFixed(2))
    const amountChange = parseFloat(((Math.random() - 0.3) * 1000).toFixed(2))
    const balanceAfter = parseFloat((balanceBefore + amountChange).toFixed(2))
    
    result.push({
      deductionId: `DEDUCT-${Date.now()}-${i}`,
      agentId: `AGENT-${1000 + i}`,
      agentInfo: `13${Random.integer(1000000000, 9999999999)}`,
      agentName: `代理${i + 1}`,
      transactionType: ['余额充值', '能量租赁', '智能托管', '闪兑'][Math.floor(Math.random() * 4)],
      balanceBefore: balanceBefore,
      amountChange: amountChange,
      balanceAfter: balanceAfter,
      deductionStatus: ['已完成', '已取消', '进行中'][Math.floor(Math.random() * 3)],
      relatedOrderId: `ORDER-${Date.now()}-${i}`,
      deductionTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
    })
  }
  
  return result
})()

export default [
  // 获取代理账单列表
  {
    url: '/mock/v1/operation/agent/ledger/list',
    method: 'get',
    response: (request) => {
      const { 
        pageNum = 1, 
        pageSize = 10, 
        deductionId, 
        agentId,
        agentInfo,
        transactionType,
        deductionStatus,
        timeRange 
      } = request.query
      
      let result = [...mockLedgerData]
      
      // 根据扣款ID筛选
      if (deductionId) {
        result = result.filter(item => item.deductionId.includes(deductionId))
      }
      
      // 根据代理ID筛选
      if (agentId) {
        result = result.filter(item => item.agentId.includes(agentId))
      }
      
      // 根据代理信息（电话）筛选
      if (agentInfo) {
        result = result.filter(item => item.agentInfo.includes(agentInfo))
      }
      
      // 根据交易类型筛选
      if (transactionType) {
        result = result.filter(item => item.transactionType === transactionType)
      }
      
      // 根据扣款状态筛选
      if (deductionStatus) {
        result = result.filter(item => item.deductionStatus === deductionStatus)
      }
      
      // 根据时间范围筛选
      if (timeRange && Array.isArray(timeRange) && timeRange.length === 2) {
        const startDate = new Date(timeRange[0]).getTime()
        const endDate = new Date(timeRange[1]).getTime()
        
        result = result.filter(item => {
          const itemDate = new Date(item.deductionTime).getTime()
          return itemDate >= startDate && itemDate <= endDate
        })
      }
      
      // 排序：按扣款时间降序
      result = result.sort((a, b) => new Date(b.deductionTime).getTime() - new Date(a.deductionTime).getTime())
      
      // 分页
      const start = (parseInt(pageNum as string) - 1) * parseInt(pageSize as string)
      const end = start + parseInt(pageSize as string)
      const pageResult = result.slice(start, end)
      
      return {
        code: SUCCESS_CODE,
        data: {
          list: pageResult,
          total: result.length
        },
        message: '获取成功'
      }
    }
  },
  
  // 导出代理账单
  {
    url: '/mock/v1/operation/agent/ledger/export',
    method: 'get',
    response: (request) => {
      return {
        code: SUCCESS_CODE,
        message: '导出成功'
      }
    }
  }
] as MockMethod[] 