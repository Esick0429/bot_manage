type BotPaymentConfig = {
  id: number
  botId: number
  username: string
  flashPaymentWallet: string
  balancePaymentWallet: string
}

type BotTimeEnergyConfig = {
  id: number
  botId: number
  timeEnergyPrice: number
  timeEnergyMultiplier: number
}

type BotCountEnergyConfig = {
  id: number
  botId: number
  countEnergyPriceTRX: number
  countEnergyPriceUSDT: number
}

type BotManagedModeConfig = {
  id: number
  botId: number
  enabled: boolean
  countPrice: number
  customPriceEnabled: boolean
  price65000: number
  price131000: number
}

type BotBatchOrderConfig = {
  id: number
  botId: number
  enabled: boolean
  energyPrice: number
  activatePrice: number
}

type BotFlashExchangeConfig = {
  id: number
  botId: number
  enabled: boolean
  walletAddress: string
  minBalance: number
  exchangeProfit: number
  exchangeLimit: number
  insufficientStock: boolean
  insufficientStockValue: number
}

export type {
  BotPaymentConfig,
  BotTimeEnergyConfig,
  BotCountEnergyConfig,
  BotManagedModeConfig,
  BotBatchOrderConfig,
  BotFlashExchangeConfig
}
