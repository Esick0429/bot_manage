import request from '@/axios'

// 定义国家信息的数据结构 (根据后端 /v3/country/country_list 返回更新)
export interface CountryInfo {
  id: number
  country_en: string // 英文名
  country_cn: string // 中文名
  country_iso: string // ISO 代码 (例如 "TH")
  pay_en: string // 货币英文
  pay_cn: string // 货币中文
  area_code: string // 区域代码/国际区号 (例如 "+66")
  number_format: string // 号码格式提示
  status: number // 状态
  create_time: number // 创建时间戳
}

/**
 * @description: 获取国家列表
 * @returns {Promise<IResponse<CountryInfo[]>>}
 */
export const getCountryListApi = (): Promise<IResponse<CountryInfo[]>> => {
  return request.get<CountryInfo[]>({
    url: '/v3/country/country_list'
  })
}
