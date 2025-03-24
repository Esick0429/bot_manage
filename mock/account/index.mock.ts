import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义账户接口
interface Account {
  id: number
  account_name: string
  account_type: number
  balance: string
  email: string
  phone: string
  last_login_time: number
  create_time: number
  update_time: number
  remark: string
}

// 定义充值记录接口
interface RechargeRecord {
  id: number
  account_id: number
  account_name: string
  amount: string
  operation_type: string
  operator: string
  before_balance: string
  after_balance: string
  create_time: number
  remark: string
}

// 定义账户类型
const accountTypes = {
  1: '普通账户',
  2: 'VIP账户',
  3: '管理员账户'
}

// 生成账户数据
const generateAccounts = (): Account[] => {
  const accounts: Account[] = []
  
  for (let i = 1; i <= 50; i++) {
    const accountType = Mock.Random.pick([1, 2, 3])
    const now = Math.floor(Date.now() / 1000) // 当前时间的秒级时间戳
    const createTime = now - Mock.Random.integer(86400 * 7, 86400 * 365) // 7天至1年前创建
    const updateTime = now - Mock.Random.integer(0, 86400 * 7) // 最近7天内更新
    const lastLoginTime = now - Mock.Random.integer(0, 86400 * 30) // 最近30天内登录
    
    const balance = Mock.Random.float(0, 10000, 2, 2).toString()
    
    accounts.push({
      id: i,
      account_name: `account_${Mock.Random.word(5, 10)}`,
      account_type: accountType,
      balance,
      email: Mock.Random.email(),
      phone: Mock.Random.string('number', 11),
      last_login_time: lastLoginTime,
      create_time: createTime,
      update_time: updateTime,
      remark: Mock.Random.sentence(5, 20)
    })
  }
  
  // 添加一个示例账户
  accounts.push({
    id: 51,
    account_name: 'admin',
    account_type: 3,
    balance: '9999.99',
    email: 'admin@example.com',
    phone: '13800138000',
    last_login_time: Math.floor(Date.now() / 1000) - 3600,
    create_time: Math.floor(Date.now() / 1000) - 86400 * 365,
    update_time: Math.floor(Date.now() / 1000) - 86400,
    remark: '系统管理员账户'
  })
  
  return accounts
}

// 账户数据
const accounts = generateAccounts()

// 生成模拟充值记录
const generateRechargeRecords = (): RechargeRecord[] => {
  const records: RechargeRecord[] = []
  
  // 为每个账户生成1-10条随机充值记录
  accounts.forEach(account => {
    const recordCount = Mock.Random.integer(1, 10)
    
    for (let i = 0; i < recordCount; i++) {
      const now = Math.floor(Date.now() / 1000)
      const createTime = now - Mock.Random.integer(0, 86400 * 180) // 最近半年内的记录
      const amount = Mock.Random.float(10, 2000, 2, 2).toString()
      const beforeBalance = Mock.Random.float(0, 5000, 2, 2).toString()
      const afterBalance = (parseFloat(beforeBalance) + parseFloat(amount)).toFixed(2)
      
      records.push({
        id: records.length + 1,
        account_id: account.id,
        account_name: account.account_name,
        amount,
        operation_type: 'recharge',
        operator: Mock.Random.pick(['system', 'admin', 'user']),
        before_balance: beforeBalance,
        after_balance: afterBalance,
        create_time: createTime,
        remark: Mock.Random.sentence(3, 10)
      })
    }
  })
  
  return records
}

// 充值记录数据
const rechargeRecords = generateRechargeRecords()

export default [
  // 获取账户信息
  {
    url: '/mock/v1/account/list',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { account_name, account_type, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...accounts]
      
      // 筛选
      if (account_name) {
        list = list.filter(item => item.account_name.includes(account_name))
      }
      
      if (account_type !== undefined && account_type !== '') {
        list = list.filter(item => item.account_type === parseInt(account_type))
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
  
  // 获取账户详情
  {
    url: '/mock/v1/account/detail',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { id } = request.query
      const account = accounts.find(item => item.id === parseInt(id))
      
      if (!account) {
        return {
          code: 400,
          message: '账户不存在'
        }
      }
      
      // 构建详细信息
      const accountDetail = {
        ...account,
        accountTypeText: accountTypes[account.account_type]
      }
      
      return {
        code: SUCCESS_CODE,
        data: accountDetail,
        message: '操作成功'
      }
    }
  },
  
  // 创建账户
  {
    url: '/mock/v1/account/create',
    method: 'post',
    timeout,
    response: (request: any) => {
      const { account_name } = request.body
      
      // 检查账户名是否已存在
      if (accounts.some(item => item.account_name === account_name)) {
        return {
          code: 400,
          message: '账户名已存在'
        }
      }
      
      return {
        code: SUCCESS_CODE,
        message: '创建成功',
        data: null
      }
    }
  },
  
  // 更新账户
  {
    url: '/mock/v1/account/update',
    method: 'put',
    timeout,
    response: (request: any) => {
      const { id, account_name } = request.body
      
      // 检查账户是否存在
      const account = accounts.find(item => item.id === id)
      if (!account) {
        return {
          code: 400,
          message: '账户不存在'
        }
      }
      
      // 检查账户名是否重复（排除自身）
      if (account_name && account_name !== account.account_name) {
        if (accounts.some(item => item.account_name === account_name && item.id !== id)) {
          return {
            code: 400,
            message: '账户名已存在'
          }
        }
      }
      
      return {
        code: SUCCESS_CODE,
        message: '更新成功',
        data: null
      }
    }
  },
  
  // 删除账户
  {
    url: '/mock/v1/account/delete',
    method: 'delete',
    timeout,
    response: (request: any) => {
      const { id } = request.query
      
      // 检查账户是否存在
      const account = accounts.find(item => item.id === parseInt(id))
      if (!account) {
        return {
          code: 400,
          message: '账户不存在'
        }
      }
      
      return {
        code: SUCCESS_CODE,
        message: '删除成功',
        data: null
      }
    }
  },
  
  // 导出账户信息
  {
    url: '/mock/v1/account/export',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: SUCCESS_CODE,
        message: '导出成功',
        data: null
      }
    }
  },
  
  // 获取账户充值记录
  {
    url: '/mock/v1/account/recharge-records',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { accountId, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...rechargeRecords]
      
      // 筛选特定账户的记录
      if (accountId) {
        list = list.filter(item => item.account_id === parseInt(accountId))
      }
      
      // 按时间排序（从新到旧）
      list.sort((a, b) => b.create_time - a.create_time)
      
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
  }
] 