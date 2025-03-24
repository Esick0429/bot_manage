import { MockMethod } from 'vite-plugin-mock'
import { formatToDateTime } from '@/utils/dateUtil'

// 生成随机数据
const generateMockExchangeTransactions = (count: number = 100) => {
  return Array.from({ length: count }).map((_, index) => ({
    id: `ED${String(index + 1).padStart(6, '0')}`,
    agentId: `AG${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
    agentName: `代理商${index + 1}`,
    exchangeType: Math.random() > 0.5 ? 1 : 2, // 1-USDT兑换TRX, 2-TRX兑换USDT
    paymentAmount: Math.floor(Math.random() * 10000) / 100,
    trxRate: Math.random() * 10 + 15, // 15-25之间的汇率
    trxAmount: Math.floor(Math.random() * 1000000) / 100,
    status: Math.floor(Math.random() * 4) + 1, // 1-待处理, 2-处理中, 3-已完成, 4-已取消
    createTime: formatToDateTime(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
    completeTime: formatToDateTime(new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)),
    operator: `操作员${Math.floor(Math.random() * 5) + 1}`,
    remark: Math.random() > 0.7 ? '用户申请闪兑' : ''
  }))
}

// 生成闪兑明细列表 Mock 数据
const exchangeTransactionData = generateMockExchangeTransactions()

export default [
  // 获取闪兑明细列表
  {
    url: '/mock/v1/operation/exchange-transaction/list',
    method: 'get',
    response: ({ query }) => {
      // 解析查询参数
      const { pageNo = 1, pageSize = 10, keyword = '', status = '', startTime, endTime } = query
      
      // 筛选数据
      let filteredList = [...exchangeTransactionData]
      
      // 关键词过滤（id、代理ID、代理名称）
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase()
        filteredList = filteredList.filter(
          item => 
            item.id.toLowerCase().includes(lowerKeyword) || 
            item.agentId.toLowerCase().includes(lowerKeyword) || 
            item.agentName.toLowerCase().includes(lowerKeyword)
        )
      }
      
      // 状态过滤
      if (status) {
        filteredList = filteredList.filter(item => String(item.status) === String(status))
      }
      
      // 时间范围过滤
      if (startTime && endTime) {
        const start = new Date(startTime).getTime()
        const end = new Date(endTime).getTime()
        
        filteredList = filteredList.filter(item => {
          const createTime = new Date(item.createTime).getTime()
          return createTime >= start && createTime <= end
        })
      }
      
      // 分页处理
      const startIndex = (Number(pageNo) - 1) * Number(pageSize)
      const endIndex = startIndex + Number(pageSize)
      const pagedList = filteredList.slice(startIndex, endIndex)
      
      return {
        code: '000000',
        message: '获取闪兑明细列表成功',
        data: {
          list: pagedList,
          total: filteredList.length,
          pageNo: Number(pageNo),
          pageSize: Number(pageSize)
        }
      }
    }
  },
  
  // 获取闪兑明细详情
  {
    url: '/mock/v1/operation/exchange-transaction/detail',
    method: 'get',
    response: ({ query }) => {
      const { id } = query
      
      if (!id) {
        return {
          code: '100001',
          message: '缺少必要参数：id',
          data: null
        }
      }
      
      const transaction = exchangeTransactionData.find(item => item.id === id)
      
      if (!transaction) {
        return {
          code: '100002',
          message: '闪兑明细不存在',
          data: null
        }
      }
      
      return {
        code: '000000',
        message: '获取闪兑明细详情成功',
        data: transaction
      }
    }
  },
  
  // 删除闪兑交易
  {
    url: '/mock/v1/operation/exchange-transaction/delete',
    method: 'post',
    response: ({ body }) => {
      const { id } = body
      
      if (!id) {
        return {
          code: '100001',
          message: '缺少必要参数：id',
          data: null
        }
      }
      
      const index = exchangeTransactionData.findIndex(item => item.id === id)
      
      if (index === -1) {
        return {
          code: '100002',
          message: '闪兑明细不存在',
          data: null
        }
      }
      
      // 模拟删除（在实际环境中可能只是标记为已删除而不是真的删除）
      exchangeTransactionData.splice(index, 1)
      
      return {
        code: '000000',
        message: '删除闪兑交易成功',
        data: null
      }
    }
  },
  
  // 补发TRX
  {
    url: '/mock/v1/exchange-transaction/resend-trx',
    method: 'post',
    response: ({ body }) => {
      const { orderId, resendTrxAmount, reason, remark } = body
      
      if (!orderId || !resendTrxAmount || !reason) {
        return {
          code: '100001',
          message: '缺少必要参数',
          data: null
        }
      }
      
      const transaction = exchangeTransactionData.find(item => item.id === orderId)
      
      if (!transaction) {
        return {
          code: '100002',
          message: '闪兑明细不存在',
          data: null
        }
      }
      
      // 更新交易记录（实际环境中可能需要更多的处理）
      transaction.remark = remark ? `${transaction.remark}; 补发TRX: ${resendTrxAmount}, 原因: ${reason}` : transaction.remark
      
      return {
        code: '000000',
        message: 'TRX补发成功',
        data: null
      }
    }
  }
] as MockMethod[] 