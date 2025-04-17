import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

// 生成随机TRX地址
const generateTrxAddress = () => {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let address = 'T'
  for (let i = 0; i < 33; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return address
}

// 生成随机手机号
const generatePhone = () => {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '158', '159', '188', '189']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  let phone = prefix
  for (let i = 0; i < 8; i++) {
    phone += Math.floor(Math.random() * 10)
  }
  return phone
}

// 生成随机代理ID
const generateAgentId = () => {
  let id = 'AG'
  for (let i = 0; i < 6; i++) {
    id += Math.floor(Math.random() * 10)
  }
  return id
}

// 定义TRX地址接口
interface TrxAddress {
  id: number
  address: string
  agentId: string
  agentPhone: string
  creator: string
  status: number
  createTime: string
  updateTime: string
  agentType?: number
}

// 模拟数据
const createTrxAddressList = (count = 20): TrxAddress[] => {
  const result: TrxAddress[] = []
  const creators = ['管理员', '系统', '运营', '技术']
  
  for (let i = 1; i <= count; i++) {
    const status = Math.random() > 0.3 ? 1 : 0
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))
    
    result.push({
      id: i,
      address: generateTrxAddress(),
      agentId: generateAgentId(),
      agentPhone: generatePhone(),
      creator: creators[Math.floor(Math.random() * creators.length)],
      status,
      createTime: date.toISOString().replace('T', ' ').substring(0, 19),
      updateTime: date.toISOString().replace('T', ' ').substring(0, 19)
    })
  }
  
  return result
}

// 辅助函数：生成成功响应
const resultSuccess = (data: any) => {
  return {
    code: SUCCESS_CODE,
    data,
    message: '操作成功'
  }
}

// 初始数据列表
const trxAddressList: TrxAddress[] = createTrxAddressList()

export default [
  // 获取TRX地址列表
  {
    url: '/mock/v1/marketing/trx-address/list',
    method: 'get',
    response: ({ query }) => {
      const { keyword, status, page = 1, pageSize = 10 } = query
      
      // 过滤数据
      let list = [...trxAddressList]
      
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase()
        list = list.filter(
          item => 
            item.address.toLowerCase().includes(lowerKeyword) || 
            item.agentId.toLowerCase().includes(lowerKeyword) ||
            (item.agentPhone && item.agentPhone.includes(keyword))
        )
      }
      
      if (status !== '' && status !== undefined) {
        list = list.filter(item => item.status === parseInt(status))
      }
      
      // 分页
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + parseInt(pageSize)
      const pageList = list.slice(startIndex, endIndex)
      
      return resultSuccess({
        list: pageList,
        total: list.length
      })
    }
  },
  
  // 创建TRX地址
  {
    url: '/mock/v1/marketing/trx-address/create',
    method: 'post',
    response: ({ body }) => {
      const { address } = body
      
      // 检查地址是否已存在
      const exists = trxAddressList.some(item => item.address === address)
      if (exists) {
        return {
          code: 1,
          message: '该TRX地址已存在'
        }
      }
      
      // 创建新记录
      const newId = trxAddressList.length > 0 ? Math.max(...trxAddressList.map(item => item.id)) + 1 : 1
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      
      const newAddress: TrxAddress = {
        id: newId,
        address: body.address,
        agentId: body.agentId || '',
        agentPhone: body.agentPhone || '',
        creator: '管理员',
        status: body.status || 1,
        createTime: now,
        updateTime: now
      }
      
      trxAddressList.unshift(newAddress)
      
      return resultSuccess(newAddress)
    }
  },
  
  // 更新TRX地址
  {
    url: '/mock/v1/marketing/trx-address/update',
    method: 'post',
    response: ({ body }) => {
      const { id } = body
      
      const index = trxAddressList.findIndex(item => item.id === id)
      if (index === -1) {
        return {
          code: 1,
          message: '未找到该TRX地址'
        }
      }
      
      // 更新记录
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      const updatedAddress: TrxAddress = {
        ...trxAddressList[index],
        address: body.address || trxAddressList[index].address,
        agentId: body.agentId || trxAddressList[index].agentId,
        agentPhone: body.agentPhone || trxAddressList[index].agentPhone,
        status: body.status !== undefined ? body.status : trxAddressList[index].status,
        updateTime: now
      }
      
      trxAddressList[index] = updatedAddress
      
      return resultSuccess(updatedAddress)
    }
  },
  
  // 删除TRX地址
  {
    url: '/mock/v1/marketing/trx-address/delete/:id',
    method: 'post',
    response: ({ params }) => {
      const { id } = params
      
      const index = trxAddressList.findIndex(item => item.id === parseInt(id))
      if (index === -1) {
        return {
          code: 1,
          message: '未找到该TRX地址'
        }
      }
      
      // 删除记录
      trxAddressList.splice(index, 1)
      
      return resultSuccess(null)
    }
  },
  
  // 批量删除TRX地址
  {
    url: '/mock/v1/marketing/trx-address/batch-delete',
    method: 'post',
    response: ({ body }) => {
      const { ids } = body
      
      if (!ids || !ids.length) {
        return {
          code: 1,
          message: '请选择要删除的记录'
        }
      }
      
      // 过滤掉要删除的记录
      const initialLength = trxAddressList.length
      const idsSet = new Set(ids.map(id => parseInt(id)))
      
      const filteredList = trxAddressList.filter(item => !idsSet.has(item.id))
      const deletedCount = initialLength - filteredList.length
      
      // 更新列表
      trxAddressList.length = 0
      trxAddressList.push(...filteredList)
      
      return resultSuccess({
        deletedCount
      })
    }
  },
  
  // 更新TRX地址状态
  {
    url: '/mock/v1/marketing/trx-address/status/:id',
    method: 'post',
    response: ({ params, body }) => {
      const { id } = params
      const { status } = body
      
      const index = trxAddressList.findIndex(item => item.id === parseInt(id))
      if (index === -1) {
        return {
          code: 1,
          message: '未找到该TRX地址'
        }
      }
      
      // 更新状态
      trxAddressList[index].status = status
      trxAddressList[index].updateTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
      
      return resultSuccess(trxAddressList[index])
    }
  },
  
  // 绑定代理
  {
    url: '/mock/v1/marketing/trx-address/bind-agent/:addressId',
    method: 'post',
    response: ({ params, body }) => {
      const { addressId } = params
      const { agentType, agentInfo } = body
      
      const index = trxAddressList.findIndex(item => item.id === parseInt(addressId))
      if (index === -1) {
        return {
          code: 1,
          message: '未找到该TRX地址'
        }
      }
      
      // 更新代理信息
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      
      // 如果agentInfo是手机号，则更新agentPhone
      if (/^1[3-9]\d{9}$/.test(agentInfo)) {
        trxAddressList[index].agentPhone = agentInfo
        // 生成一个随机的代理ID
        trxAddressList[index].agentId = generateAgentId()
      } else {
        // 否则假设是代理ID
        trxAddressList[index].agentId = agentInfo
        // 生成一个随机的手机号
        trxAddressList[index].agentPhone = generatePhone()
      }
      
      trxAddressList[index].agentType = agentType
      trxAddressList[index].updateTime = now
      
      return resultSuccess(trxAddressList[index])
    }
  },
  
  // 批量导入TRX地址
  {
    url: '/mock/v1/marketing/trx-address/batch-import',
    method: 'post',
    response: ({ body }) => {
      // 模拟导入多个新地址
      const importCount = Math.floor(Math.random() * 5) + 3 // 导入3-7条记录
      
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      const newAddresses: TrxAddress[] = []
      
      for (let i = 0; i < importCount; i++) {
        const newId = trxAddressList.length > 0 ? Math.max(...trxAddressList.map(item => item.id)) + 1 + i : 1 + i
        
        newAddresses.push({
          id: newId,
          address: generateTrxAddress(),
          agentId: generateAgentId(),
          agentPhone: generatePhone(),
          creator: '管理员',
          status: 1,
          createTime: now,
          updateTime: now
        })
      }
      
      // 将新地址添加到列表中
      trxAddressList.unshift(...newAddresses)
      
      return resultSuccess({
        importCount,
        successCount: importCount,
        failCount: 0
      })
    }
  }
] as MockMethod[] 