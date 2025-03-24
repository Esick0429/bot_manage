import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 定义扣款记录接口
interface DeductionRecord {
  transaction_id: string
  transaction_type: string
  bot_name: string
  amount: string
  before_trx: string
  after_trx: string
  status: string
  transaction_time: string
  order_id: string
  account_id: number
  account_name: string
}

// 生成扣款记录
const generateDeductionRecords = (): DeductionRecord[] => {
  const records: DeductionRecord[] = []
  
  // 三种交易类型
  const transactionTypes = ['智能托管', '闪兑', '能量租赁']
  // 生成一些机器人名
  const botNames = ['trx107bot', 'trxhelperbot', 'energyrentbot', 'exchangebot']
  // 生成不同的状态类型
  const statusTypes = ['success', 'pending', 'failed']
  
  // 生成固定的账号列表，确保有特定ID的账户数据
  const accounts = [
    { id: 1, name: '测试账户1' },
    { id: 2, name: '测试账户2' },
    { id: 3, name: '测试账户3' },
    { id: 10, name: '测试账户10' },
    { id: 100, name: '测试账户100' }
  ];
  
  // 为每个账户生成记录
  accounts.forEach(account => {
    // 为每种交易类型生成记录
    transactionTypes.forEach((type, typeIndex) => {
      // 每种类型生成3条记录
      for (let i = 0; i < 3; i++) {
        // 生成不同的交易ID和订单ID
        const transactionId = Mock.Random.string('number', 10, 10);
        const orderId = Mock.Random.string('number', 11, 11);
        const botName = botNames[Mock.Random.integer(0, botNames.length - 1)];
        const status = statusTypes[Mock.Random.integer(0, statusTypes.length - 1)];
        
        // 生成不同的金额
        const amount = `-${Mock.Random.integer(50, 500)}.00`;
        const beforeTrx = `${Mock.Random.integer(1000, 5000)}`;
        const afterTrx = status === 'failed' ? beforeTrx : `${parseInt(beforeTrx) + parseInt(amount)}`;
        
        // 生成不同的时间
        const transactionTime = Mock.Random.datetime('yyyy-MM-dd HH:mm:ss');
        
        records.push({
          transaction_id: transactionId,
          transaction_type: type,
          bot_name: botName,
          amount: amount,
          before_trx: beforeTrx,
          after_trx: afterTrx,
          status: status,
          transaction_time: transactionTime,
          order_id: orderId,
          account_id: account.id,
          account_name: account.name
        });
      }
    });
  });
  
  return records;
}

// 扣款记录数据
const deductionRecords = generateDeductionRecords()

export default [
  // 获取账户扣款记录
  {
    url: '/mock/v1/account/deduction-records',
    method: 'get',
    timeout,
    response: (request: any) => {
      const { accountId, transaction_type, order_id, pageSize = 10, currentPage = 1 } = request.query
      
      let list = [...deductionRecords]
      
      if (accountId) {
        const parsedId = parseInt(accountId)
        list = list.filter(item => item.account_id === parsedId)
      }
      
      if (transaction_type) {
        list = list.filter(item => item.transaction_type === transaction_type)
      }
      
      if (order_id) {
        list = list.filter(item => item.order_id.includes(order_id))
      }
      
      const start = (parseInt(currentPage) - 1) * parseInt(pageSize)
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