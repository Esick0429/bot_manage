import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 代理等级
const agentLevels = {
  1: '普通代理',
  2: '高级代理',
  3: 'VIP代理'
}

// 产品类型
const productTypes = {
  1: 'TRX机器人',
  2: '能量租赁',
  3: '闪兑服务'
}

// 价格状态
const priceStatus = {
  0: '禁用',
  1: '启用'
}

// 定义代理价格接口
interface AgentPrice {
  id: number
  agentLevel: number
  agentLevelName: string
  productType: number
  productTypeName: string
  originalPrice: number
  discount: number
  price: string | number
  status: number
  statusName: string
  creatorId: number
  creatorName: string
  createTime: string
  updateTime: string
  remark: string
}

// 生成代理价格数据
const generateAgentPrices = (): AgentPrice[] => {
  const prices: AgentPrice[] = []
  
  for (let i = 1; i <= 40; i++) {
    const agentLevel = Mock.Random.pick([1, 2, 3])
    const productType = Mock.Random.pick([1, 2, 3])
    const status = Mock.Random.pick([0, 1])
    const originalPrice = Mock.Random.float(100, 2000, 2, 2)
    const discount = Mock.Random.integer(50, 100)
    const price = (originalPrice * discount / 100).toFixed(2)
    
    prices.push({
      id: i,
      agentLevel,
      agentLevelName: agentLevels[agentLevel],
      productType,
      productTypeName: productTypes[productType],
      originalPrice,
      discount,
      price,
      status,
      statusName: priceStatus[status],
      creatorId: Mock.Random.integer(1, 10),
      creatorName: Mock.Random.cname(),
      createTime: Mock.Random.date('yyyy-MM-dd HH:mm:ss'),
      updateTime: Mock.Random.date('yyyy-MM-dd HH:mm:ss'),
      remark: Mock.Random.csentence(5, 20)
    })
  }
  
  return prices
}

// 价格数据
const agentPrices = generateAgentPrices()

export default [
  // 获取代理价格列表
  {
    url: '/mock/v1/marketing/agent-price/list',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { keyword, agentLevel, productType, status, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...agentPrices]
      
      // 关键词筛选
      if (keyword) {
        list = list.filter(item => 
          item.id.toString().includes(keyword) ||
          item.agentLevelName.includes(keyword) ||
          item.productTypeName.includes(keyword)
        )
      }
      
      // 代理等级筛选
      if (agentLevel !== undefined && agentLevel !== '') {
        list = list.filter(item => item.agentLevel === parseInt(agentLevel))
      }
      
      // 产品类型筛选
      if (productType !== undefined && productType !== '') {
        list = list.filter(item => item.productType === parseInt(productType))
      }
      
      // 状态筛选
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
  
  // 创建代理价格配置
  {
    url: '/mock/v1/marketing/agent-price/create',
    method: 'post',
    timeout,
    response: (request: any) => {
      const { body } = request
      
      // 创建新价格配置
      const newPrice: AgentPrice = {
        id: agentPrices.length + 1,
        agentLevel: body.agentLevel,
        agentLevelName: agentLevels[body.agentLevel],
        productType: body.productType,
        productTypeName: productTypes[body.productType],
        originalPrice: body.originalPrice,
        discount: body.discount,
        price: body.price,
        status: body.status || 1,
        statusName: priceStatus[body.status || 1],
        creatorId: 1,
        creatorName: '管理员',
        createTime: Mock.Random.date('yyyy-MM-dd HH:mm:ss'),
        updateTime: Mock.Random.date('yyyy-MM-dd HH:mm:ss'),
        remark: body.remark || ''
      }
      
      agentPrices.unshift(newPrice)
      
      return {
        code: SUCCESS_CODE,
        data: newPrice,
        message: '创建成功'
      }
    }
  },
  
  // 更新代理价格配置
  {
    url: '/mock/v1/marketing/agent-price/update',
    method: 'post',
    timeout,
    response: (request: any) => {
      const { body } = request
      const { id } = body
      
      const index = agentPrices.findIndex(item => item.id === id)
      
      if (index === -1) {
        return {
          code: 400,
          message: '价格配置不存在'
        }
      }
      
      // 更新价格配置
      const updatedPrice: AgentPrice = {
        ...agentPrices[index],
        agentLevel: body.agentLevel || agentPrices[index].agentLevel,
        agentLevelName: agentLevels[body.agentLevel || agentPrices[index].agentLevel],
        productType: body.productType || agentPrices[index].productType,
        productTypeName: productTypes[body.productType || agentPrices[index].productType],
        originalPrice: body.originalPrice !== undefined ? body.originalPrice : agentPrices[index].originalPrice,
        discount: body.discount !== undefined ? body.discount : agentPrices[index].discount,
        price: body.price !== undefined ? body.price : agentPrices[index].price,
        status: body.status !== undefined ? body.status : agentPrices[index].status,
        statusName: priceStatus[body.status !== undefined ? body.status : agentPrices[index].status],
        remark: body.remark !== undefined ? body.remark : agentPrices[index].remark,
        updateTime: Mock.Random.date('yyyy-MM-dd HH:mm:ss')
      }
      
      agentPrices[index] = updatedPrice
      
      return {
        code: SUCCESS_CODE,
        data: updatedPrice,
        message: '更新成功'
      }
    }
  },
  
  // 删除代理价格配置
  {
    url: /\/mock\/v1\/marketing\/agent-price\/delete\/\d+/,
    method: 'post',
    timeout,
    response: (request: any) => {
      const url = request.url
      const id = parseInt(url.match(/\/delete\/(\d+)/)[1])
      
      const index = agentPrices.findIndex(item => item.id === id)
      
      if (index === -1) {
        return {
          code: 400,
          message: '价格配置不存在'
        }
      }
      
      // 删除价格配置
      agentPrices.splice(index, 1)
      
      return {
        code: SUCCESS_CODE,
        message: '删除成功'
      }
    }
  },
  
  // 更新代理价格配置状态
  {
    url: /\/mock\/v1\/marketing\/agent-price\/status\/\d+/,
    method: 'post',
    timeout,
    response: (request: any) => {
      const url = request.url
      const id = parseInt(url.match(/\/status\/(\d+)/)[1])
      const { body } = request
      const { status } = body
      
      const index = agentPrices.findIndex(item => item.id === id)
      
      if (index === -1) {
        return {
          code: 400,
          message: '价格配置不存在'
        }
      }
      
      // 更新状态
      agentPrices[index].status = status
      agentPrices[index].statusName = priceStatus[status]
      agentPrices[index].updateTime = Mock.Random.date('yyyy-MM-dd HH:mm:ss')
      
      return {
        code: SUCCESS_CODE,
        message: status === 1 ? '启用成功' : '禁用成功'
      }
    }
  }
] 