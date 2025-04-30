import { ElTag } from 'element-plus' // Import ElTag if needed for more complex return types like getStatusInfo

export const getProductTypeText = (type: number | string): string => {
  switch (Number(type)) {
    case 1:
      return '话费'
    case 2:
      return '流量'
    default:
      return '未知'
  }
}

export const getPaymentMethodText = (type: number | string): string => {
  switch (Number(type)) {
    case 1:
      return '余额'
    case 2:
      return 'USDT'
    default:
      return '未知' // Handle 0
  }
}

export const getStatusInfo = (
  status: number | string
): { text: string; type: 'success' | 'danger' | 'warning' | 'info' } => {
  switch (Number(status)) {
    case 1:
      return { text: '已完成', type: 'success' }
    case 2:
      return { text: '充值中', type: 'warning' }
    case 3:
      return { text: '已退款', type: 'danger' }
    default:
      return { text: '未知', type: 'info' }
  }
}

// You could also move formatToDateTime logic here if desired, or keep importing it separately.
