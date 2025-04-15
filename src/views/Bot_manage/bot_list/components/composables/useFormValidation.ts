import { reactive } from 'vue'
import { useValidator } from '@/hooks/web/useValidator'

export function useFormValidation(agentPrices: Record<string, any>) {
  console.log('agentPrices', agentPrices)
  const { required } = useValidator()

  // 成本价验证函数
  const validateMinPrice = (rule: any, value: any, callback: any) => {
    const field = rule.field // e.g., 'day_1_price'
    if (value === null || value === undefined || value === '') {
      // 保留非空验证，如果需要的话
      // return callback(new Error('该项不能为空'))
      // 如果允许为空或者由 required 处理，则直接返回
      return callback()
    }

    // 从 agentPrices 获取对应的成本价
    // 注意：agentPrices 的 key 需要与表单的 field 完全匹配
    const minCost = agentPrices[field]
    console.log('minCost', minCost)
      console.log('value', value)
      if (value < minCost) {
        // 更新错误提示信息
        return callback(new Error(`不能低于成本价 ${minCost}`))
      }

    callback()
  }

  // 验证时间能量价格配置 - 注意：此函数可能需要根据实际使用情况调整或移除
  // const validateTimeEnergyPrices = (timeEnergyData: any) => {
  //   // 更新需要检查的字段名以匹配 TimeEnergyTab.vue 中的表单字段
  //   const priceFields = [
  //     'day_1_price',
  //     'day_3_price',
  //     'day_7_price',
  //     'day_15_price'
  //     // 'flash_price' 通常不与成本价直接比较，按需添加
  //   ]

  //   for (const field of priceFields) {
  //     const price = timeEnergyData[field]
  //     // 从 agentPrices 获取成本价
  //     const minCost = agentPrices[field]

  //     // 添加检查，确保 price 和 minCost 都是有效数字
  //     if (
  //       typeof price === 'number' &&
  //       minCost !== undefined &&
  //       minCost !== null &&
  //       typeof minCost === 'number'
  //     ) {
  //       if (price < minCost) {
  //         // 更新字段名和错误消息
  //         const fieldLabel = field.replace('_price', '').replace('day_', '天') // 简单转换标签
  //         return {
  //           valid: false,
  //           message: `${fieldLabel}的价格 (${price}) 不能低于成本价 (${minCost})`
  //         }
  //       }
  //     } else if (required(field).required && (price === null || price === undefined || price === '')) {
  //       // 如果字段是必填但值为空，也视为无效 (可选，取决于是否在表单规则中处理)
  //       // const fieldLabel = field.replace('_price', '').replace('day_', '天')
  //       // return { valid: false, message: `${fieldLabel}的价格不能为空` }
  //     }
  //   }

  //   return { valid: true }
  // }

  return {
    required,
    validateMinPrice
    // validateTimeEnergyPrices // 如果不再需要，可以考虑移除
  }
}
