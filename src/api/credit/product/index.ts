import request from '@/axios'

// 定义请求参数的数据结构 for getBotProductPriceConfigApi
export interface BotProductPriceParams {
  tg_bot_id: number
  country: string // 国家英文名，例如 "Thailand"
  product_type: number // 类型：1 表示话费，2 表示流量/套餐
}

// 定义从 getBotProductPriceConfigApi 返回的单个产品信息结构
export interface ProductPriceInfo {
  product_id: number | string
  product_name: string
  cost: string // 成本价
  sale_price: string // 机器人已配置的销售价 (可能为 "0" 或空)
  // 可能还有其他字段，根据实际API添加
}

// 定义 getBotProductPriceConfigApi 返回的 data.all_operators 内的单个运营商及其产品结构
export interface OperatorWithProducts {
  operator: string
  products: ProductPriceInfo[]
}

// 定义 getBotProductPriceConfigApi 的完整响应数据结构
export interface BotProductPriceApiResponse {
  country: string
  all_operators: OperatorWithProducts[]
}

/**
 * @description: 根据机器人ID、国家和产品类型获取产品价格配置列表
 * @param {BotProductPriceParams} params - 请求参数
 * @returns {Promise<IResponse<BotProductPriceApiResponse>>}
 */
// 新的API，用于获取机器人特定产品的价格配置
export const getBotProductPriceConfigApi = (
  data: BotProductPriceParams
): Promise<IResponse<BotProductPriceApiResponse>> => {
  // TODO: 确认此接口的实际请求URL和方法 (GET or POST)
  return request.post<BotProductPriceApiResponse>({
    url: '/v3/bot/product_price/get', // 假设的获取接口URL，请替换为实际的
    data
  })
}

// --- 保留旧的 getProductListApi ---
// 定义请求参数的数据结构
export interface ProductListParams {
  country: string // 国家英文名，例如 "Myanmar"
  operator: string // 运营商名称，例如 "MPT"
  type: number // 类型：1 表示话费，2 表示流量/套餐
}

// 定义产品/套餐信息的数据结构
export interface ProductInfo {
  id: number
  operator: string
  product_name: string
  country: string
  create_time: number
  hot: number
  cost: string
  details: string
  valid_date: number
  speed: string
  status: number
  // sale_price: string; // 如果此接口也返回售价，则添加
}

/**
 * @description: 根据国家英文名、运营商和类型获取产品/套餐列表 (旧版/通用列表)
 * @param {ProductListParams} params - 请求参数
 * @returns {Promise<IResponse<ProductInfo[]>>}
 */
export const getProductListApi = (params: ProductListParams): Promise<IResponse<ProductInfo[]>> => {
  return request.get<ProductInfo[]>({
    // 此处泛型为 ProductInfo[]
    url: '/v3/country/product/get', // 这是旧接口/通用产品列表的URL
    params
  })
}
