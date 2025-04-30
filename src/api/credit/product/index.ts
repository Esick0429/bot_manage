import request from '@/axios'

// 定义请求参数的数据结构
export interface ProductListParams {
  country: string // 国家英文名，例如 "Myanmar"
  operator: string // 运营商名称，例如 "MPT"
  type: number // 类型：1 表示话费，2 表示流量/套餐
}

// 定义产品/套餐信息的数据结构 (根据后端 /v3/country/product/get 返回更新)
export interface ProductInfo {
  id: number
  operator: string
  product_name: string // 例如 "1000泰铢"
  country: string
  create_time: number
  hot: number
  price: string // 注意：后端返回的是字符串
  details: string
  valid_date: number
  speed: string
  status: number
  // 移除旧的 amount 和 currency
  // amount: number
  // currency: string
}

/**
 * @description: 根据国家英文名、运营商和类型获取产品/套餐列表
 * @param {ProductListParams} params - 请求参数
 * @returns {Promise<IResponse<ProductInfo[]>>}
 */
export const getProductListApi = (params: ProductListParams): Promise<IResponse<ProductInfo[]>> => {
  return request.get<ProductInfo[]>({
    url: '/v3/country/product/get',
    params
  })
}
