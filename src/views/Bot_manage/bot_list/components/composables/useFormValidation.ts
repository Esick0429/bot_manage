import { reactive } from 'vue'
import { useValidator } from '@/hooks/web/useValidator'

export function useFormValidation(costPrices: Record<string, number>) {
  const { required } = useValidator()

  // 成本价验证函数
  const validateMinPrice = (rule: any, value: any, callback: any) => {
    const field = rule.field

    if (value === null || value === undefined || value === '') {
      return callback(new Error('该项不能为空'))
    }

    const minCost = costPrices[field] || 0

    if (value < minCost) {
      return callback(new Error(`价格不能低于运营后台配置的成本价`))
    }

    callback()
  }

  // 验证时间能量价格配置
  const validateTimeEnergyPrices = (timeEnergyData: any) => {
    // 检查所有价格是否低于成本价
    const priceFields = [
      'timeEnergy1Hour',
      'timeEnergy1Day',
      'timeEnergy3Days',
      'timeEnergy7Days',
      'timeEnergy15Days'
    ]

    for (const field of priceFields) {
      const price = timeEnergyData[field]
      const minCost = costPrices[field]

      if (price < minCost) {
        return {
          valid: false,
          message: `${field.replace('timeEnergy', '')}的价格不能低于成本价${minCost}`
        }
      }
    }

    return { valid: true }
  }

  return {
    required,
    validateMinPrice,
    validateTimeEnergyPrices
  }
}
