export type UserBatchRecordListParams = {
  current_page?: number
  page_size?: number
  phone?: string
  status?: string // 根据 searchSchema，可能是 'success', 'processing' 等
  start_date?: string // 修改为 start_date
  end_date?: string // 修改为 end_date
}

// TODO: 根据实际接口返回定义准确的列表项类型
export type UserBatchRecordItem = {
  id: string | number
  orderId: string
  phone: string
  country: string
  operator: string
  product: string
  price: number
  costPrice: number
  paymentAmount: number
  profit: number
  topupType: string // '话费' | '套餐'
  numberCount: number
  successCount: number
  tgUsername: string
  paymentMethod: string // '余额' | 'USDT'
  status: string // '充值成功' | '处理中' | '失败' | '已退款' | '部分成功'
  createTime: string // YYYY-MM-DD HH:mm:ss
  // 可能还有其他字段...
}

export type UserBatchRecordListResponse = {
  list: UserBatchRecordItem[]
  totalCount: number
}

export type UserBatchRecordDetailListParams = {
  id: string | number // 接收外部传入的订单号或ID
  current_page?: number
  page_size?: number
}

// 更新以匹配 /v3/user/batch_record/detail_list 实际返回 v2
export type UserBatchRecordDetailItem = {
  mobile: string
  operator: string // 添加
  product_name: string // 添加
  country: string // 添加
  sale_price: string // 售价是字符串
  status: number // 状态码
  create_time: number // 时间戳
  describe: string // 描述
  // 移除 id, rechargeInfo, product, price
}

export type UserBatchRecordDetailListResponse = {
  list: UserBatchRecordDetailItem[]
  totalCount: number // 假设详情列表也返回 totalCount
}
