/**
 * 机器人配置相关API的mock
 */
import { SUCCESS_CODE } from '@/constants'

const timeout = 800

// 成本价配置模拟数据
const mockCostPrices = {
  timeEnergy1Hour: 1.5,
  timeEnergy1Day: 5.0,
  timeEnergy3Days: 10.0,
  timeEnergy7Days: 20.0,
  timeEnergy15Days: 35.0
}

// 生成不同的机器人基本信息
const getMockBotInfo = (botId: string) => {
  const botNumber = parseInt(botId.replace(/\D/g, '')) || 1
  return {
    id: botId,
    botId: botId,
    botName: `能量机器人${botNumber}`,
    botUsername: `energy_bot_${botNumber}`,
    botToken: `${botNumber}234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ`,
    apiKey: `apikey_${botNumber}2345`,
    adminTgAccount: `@admin_user_${botNumber}`,
    remark: `这是第${botNumber}号测试机器人`,
    status: botNumber % 2 === 0,
    tgVerifyStatus: botNumber % 3 === 0 ? 'pending' : 'success',
    createTime: `2023-01-0${botNumber} 12:00:00`
  }
}

// 生成不同的收款配置
const getMockPaymentConfig = (botId: string) => {
  const botNumber = parseInt(botId.replace(/\D/g, '')) || 1
  return {
    username: `payment_user_${botNumber}`,
    flashPaymentWallet: `TRAX${botNumber}aNHgGUMUTUME5YzG4Pc4YzsMZHvNw`,
    balancePaymentWallet: `TRAX${botNumber}aNHgGUMUTUME5YzG4Pc4YzsMZHvNw`,
    orderNotificationAdmin: botNumber % 2 === 0
  }
}

// 生成不同的时间能量价格配置
const getMockTimeEnergyConfig = (botId: string) => {
  const botNumber = parseInt(botId.replace(/\D/g, '')) || 1
  const multiplier = 1 + (botNumber % 3) * 0.5
  return {
    price: 2.5 * multiplier,
    multiplier: multiplier,
    timeEnergy1Hour: 2.0 * multiplier,
    timeEnergy1Day: 6.0 * multiplier,
    timeEnergy3Days: 15.0 * multiplier,
    timeEnergy7Days: 25.0 * multiplier,
    timeEnergy15Days: 45.0 * multiplier
  }
}

// 生成不同的笔数能量价格配置
const getMockCountEnergyConfig = (botId: string) => {
  const botNumber = parseInt(botId.replace(/\D/g, '')) || 1
  return {
    enabled: botNumber % 2 === 0,
    countEnergyPriceTRX: 5 + botNumber,
    countEnergyPriceUSDT: 0.5 + botNumber * 0.1,
    notifyUser: botNumber % 2 === 0,
    notifyGroupOwner: botNumber % 3 === 0,
    notifyAdmin: botNumber % 4 === 0
  }
}

// 生成不同的托管模式价格配置
const getMockManagedModeConfig = (botId: string) => {
  const botNumber = parseInt(botId.replace(/\D/g, '')) || 1
  return {
    enabled: botNumber % 2 === 0,
    countPrice: 10 + botNumber,
    customPriceEnabled: botNumber % 3 === 0,
    price65000: 12.5 + botNumber,
    price131000: 20.0 + botNumber * 2
  }
}

// 生成不同的批量下单价格配置
const getMockBatchOrderConfig = (botId: string) => {
  const botNumber = parseInt(botId.replace(/\D/g, '')) || 1
  return {
    enabled: botNumber % 2 === 0,
    energyPrice: 3.5 + botNumber * 0.5,
    activatePrice: 2.2 + botNumber * 0.3
  }
}

// 生成不同的闪兑配置
const getMockFlashExchangeConfig = (botId: string) => {
  const botNumber = parseInt(botId.replace(/\D/g, '')) || 1
  return {
    enabled: botNumber % 2 === 0,
    walletAddress: `TRAX${botNumber}aNHgGUMUTUME5YzG4Pc4YzsMZHvNw`,
    minBalance: 50.0 + botNumber * 10,
    exchangeProfit: 0.8 + botNumber * 0.1,
    exchangeLimit: 500.0 + botNumber * 50,
    insufficientStock: botNumber % 2 === 0,
    insufficientStockValue: 100.0 + botNumber * 20
  }
}

// 模拟TG状态同步结果
const mockTgSyncResult = () => ({
  status: Math.random() > 0.3 ? 'success' : 'pending'
})

export default [
  // 获取机器人列表
  {
    url: '/mock/bot/list',
    method: 'get',
    timeout,
    response: ({ query }: { query: any }) => {
      const { page = 1, limit = 10 } = query
      const list = Array.from({ length: limit }, (_, index) => {
        const botId = `BOT_${(page - 1) * limit + index + 1}`
        return getMockBotInfo(botId)
      })
      return {
        code: SUCCESS_CODE,
        data: {
          list,
          total: 100
        }
      }
    }
  },

  // 获取机器人详情
  {
    url: '/mock/bot/:id',
    method: 'get',
    timeout,
    response: ({ url }: { url: string }) => {
      const botId = url.split('/').pop() || ''
      return {
        code: SUCCESS_CODE,
        data: getMockBotInfo(botId)
      }
    }
  },
  
  // 同步TG状态
  {
    url: '/mock/bot/sync-tg-status',
    method: 'post',
    timeout,
    response: () => {
      return {
        code: SUCCESS_CODE,
        data: mockTgSyncResult()
      }
    }
  },
  
  // 获取机器人收款配置
  {
    url: '/mock/bot/payment-config/:id',
    method: 'get',
    timeout,
    response: ({ url }: { url: string }) => {
      const botId = url.split('/').pop() || ''
      return {
        code: SUCCESS_CODE,
        data: getMockPaymentConfig(botId)
      }
    }
  },
  
  // 获取机器人时间能量价格配置
  {
    url: '/mock/bot/time-energy-config/:id',
    method: 'get',
    timeout,
    response: ({ url }: { url: string }) => {
      const botId = url.split('/').pop() || ''
      return {
        code: SUCCESS_CODE,
        data: getMockTimeEnergyConfig(botId)
      }
    }
  },
  
  // 获取机器人笔数能量价格配置
  {
    url: '/mock/bot/count-energy-config/:id',
    method: 'get',
    timeout,
    response: ({ url }: { url: string }) => {
      const botId = url.split('/').pop() || ''
      return {
        code: SUCCESS_CODE,
        data: getMockCountEnergyConfig(botId)
      }
    }
  },
  
  // 获取机器人托管模式价格配置
  {
    url: '/mock/bot/managed-mode-config/:id',
    method: 'get',
    timeout,
    response: ({ url }: { url: string }) => {
      const botId = url.split('/').pop() || ''
      return {
        code: SUCCESS_CODE,
        data: getMockManagedModeConfig(botId)
      }
    }
  },
  
  // 获取机器人批量下单价格配置
  {
    url: '/mock/bot/batch-order-config/:id',
    method: 'get',
    timeout,
    response: ({ url }: { url: string }) => {
      const botId = url.split('/').pop() || ''
      return {
        code: SUCCESS_CODE,
        data: getMockBatchOrderConfig(botId)
      }
    }
  },
  
  // 获取机器人闪兑配置
  {
    url: '/mock/bot/flash-exchange-config/:id',
    method: 'get',
    timeout,
    response: ({ url }: { url: string }) => {
      const botId = url.split('/').pop() || ''
      return {
        code: SUCCESS_CODE,
        data: getMockFlashExchangeConfig(botId)
      }
    }
  },
  
  // 更新所有机器人配置（一次性提交所有配置）
  {
    url: '/mock/bot/update-all-configs',
    method: 'put',
    timeout,
    response: (request: { body: any }) => {
      console.log('收到更新所有配置请求:', request.body)
      return {
        code: SUCCESS_CODE,
        data: {
          success: true,
          message: '配置更新成功'
        }
      }
    }
  },
  
  // 成本价接口
  {
    url: '/mock/bot/cost-prices',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: SUCCESS_CODE,
        data: mockCostPrices
      }
    }
  }
] 