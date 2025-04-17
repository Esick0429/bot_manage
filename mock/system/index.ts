import { MockMethod } from 'vite-plugin-mock'
import { Random } from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

// 模拟数据库数据
const mockDbData = (() => {
  const result: any[] = []
  
  // 生成20条测试数据
  for (let i = 0; i < 20; i++) {
    result.push({
      id: i + 1,
      configType: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      publicKey: Random.string('abcdefghijklmnopqrstuvwxyz0123456789', 32),
      privateKey: Random.string('abcdefghijklmnopqrstuvwxyz0123456789', 32),
      creator: ['管理员', '运营', '技术'][Math.floor(Math.random() * 3)],
      status: Math.random() > 0.3 ? 1 : 0, // 70%概率为启用状态
      createTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      updateTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
    })
  }
  
  return result
})()

export default [
  // 获取资源池账户列表
  {
    url: '/mock/system/resource-pool-account/list',
    method: 'get',
    response: (request) => {
      const { pageNum = 1, pageSize = 10, roleName, status } = request.query
      
      let result = [...mockDbData]
      
      // 根据角色名称筛选
      if (roleName) {
        result = result.filter(item => item.creator.includes(roleName))
      }
      
      // 根据状态筛选
      if (status !== '' && status !== undefined) {
        result = result.filter(item => item.status === parseInt(status as string))
      }
      
      // 排序：按创建时间降序
      result = result.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      
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
  
  // 创建资源池账户
  {
    url: '/mock/system/resource-pool-account/create',
    method: 'post',
    response: (request) => {
      const { configType, publicKey, privateKey, status } = request.body
      
      
      // 生成新ID
      const newId = mockDbData.length > 0 ? Math.max(...mockDbData.map(item => item.id)) + 1 : 1
      
      // 添加新记录
      const newData = {
        id: newId,
        configType,
        publicKey,
        privateKey,
        creator: '管理员',
        status: status || 1,
        createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }
      
      mockDbData.push(newData)
      
      return newData
    }
  },
  
  // 更新资源池账户
  {
    url: '/mock/system/resource-pool-account/update',
    method: 'put',
    response: (request) => {
      const { id, configType, publicKey, privateKey, status } = request.body
      
      // 添加查找索引的逻辑
      const index = mockDbData.findIndex(item => item.id === id)
      if (index === -1) {
        return {
          code: 1,
          message: '未找到对应记录'
        }
      }

      // 更新数据
      if (configType !== undefined) mockDbData[index].configType = configType
      if (publicKey !== undefined) mockDbData[index].publicKey = publicKey
      if (privateKey !== undefined) mockDbData[index].privateKey = privateKey
      if (status !== undefined) mockDbData[index].status = status
      
      mockDbData[index].updateTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
      
      return mockDbData[index]
    }
  },
  
  // 删除资源池账户
  {
    url: '/mock/system/resource-pool-account/delete',
    method: 'delete',
    response: (request) => {
      const { id } = request.query
      
      // 添加查找索引的逻辑
      const index = mockDbData.findIndex(item => item.id === parseInt(id as string))
      if (index === -1) {
        return {
          code: 1,
          message: '未找到对应记录'
        }
      }
      
      // 删除数据
      mockDbData.splice(index, 1)
      
      return {
        code: SUCCESS_CODE,
        message: '删除成功'
      }
    }
  },
  
  // 批量删除资源池账户
  {
    url: '/mock/system/resource-pool-account/batch-delete',
    method: 'delete',
    response: (request) => {
      const { ids } = request.body
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return {
          code: 1,
          message: '请选择要删除的记录'
        }
      }
      
      // 批量删除数据
      const idsSet = new Set(ids)
      const newData = mockDbData.filter(item => !idsSet.has(item.id))
      const deletedCount = mockDbData.length - newData.length
      
      if (deletedCount === 0) {
        return {
          code: 1,
          message: '未找到要删除的记录'
        }
      }
      
      // 更新数据库
      mockDbData.length = 0
      mockDbData.push(...newData)
      
      return {
        code: SUCCESS_CODE,
        message: `成功删除${deletedCount}条记录`
      }
    }
  },
  
  // 更新资源池账户状态
  {
    url: '/mock/system/resource-pool-account/update-status',
    method: 'put',
    response: (request) => {
      const { id, status } = request.body
      
      // 检查参数
      if (id === undefined) {
        return {
          code: 1,
          message: '缺少ID参数'
        }
      }
      if (status === undefined) {
        return {
          code: 1,
          message: '缺少状态参数'
        }
      }
      
      // 查找对应记录
      const index = mockDbData.findIndex(item => item.id === id)
      if (index === -1) {
        return {
          code: 1,
          message: '未找到对应记录'
        }
      }
      
      // 更新状态
      mockDbData[index].status = status
      mockDbData[index].updateTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
      
      return (mockDbData[index])
    }
  }
] as MockMethod[]