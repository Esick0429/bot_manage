import request from '@/axios'
// 移除 ProductInfo 导入
// import type { ProductInfo } from '@/api/credit/product'

// 定义请求参数的数据结构
export interface OperatorListParams {
  country: string // 国家英文名，例如 "Myanmar"
}

// 定义运营商信息的数据结构 (恢复)
export interface OperatorInfo {
  id: number
  operator: string // 运营商名称/标识符 (例如 "UltraMobile", "T-Mobile")
  country: string // 国家英文名 (例如 "UnitedStates")
  hot: number // 热度？
  status: number // 状态
  // 移除 products 字段
}

/**
 * @description: 根据国家英文名获取运营商列表
 * @param {OperatorListParams} params - 请求参数，包含国家英文名
 * @returns {Promise<IResponse<OperatorInfo[]>>}
 */
export const getOperatorListApi = (
  params: OperatorListParams
): Promise<IResponse<OperatorInfo[]>> => {
  return request.get<OperatorInfo[]>({
    url: '/v3/country/operator/get',
    params
  })
}
