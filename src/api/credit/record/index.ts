import request from '@/axios'
import type {
  UserBatchRecordListParams,
  UserBatchRecordListResponse,
  UserBatchRecordDetailListParams,
  UserBatchRecordDetailListResponse
} from './types'

/**
 * 获取用户批量充值记录列表
 * @param params 查询参数
 * @returns Promise<UserBatchRecordListResponse>
 */
export const getUserBatchRecordListApi = (params: any) => {
  // 不再进行分页参数转换，由 useSearchTable hook 处理
  return request.get<UserBatchRecordListResponse>({
    url: '/v3/user/batch_record/list',
    params: params // 直接传递 hook 处理后的参数
  })
}

/**
 * 获取用户批量充值记录详情列表
 * @param params 查询参数，包含 id, current_page, page_size
 * @returns Promise<UserBatchRecordDetailListResponse>
 */
export const getUserBatchRecordDetailListApi = (params: UserBatchRecordDetailListParams) => {
  // API 端点是 /v3/user/batch_record/detail_list?id=xxx
  // 分页参数通常也通过 query string 传递
  return request.get<UserBatchRecordDetailListResponse>({
    url: '/v3/user/batch_record/detail_list',
    params: params // 直接传递包含 id 和分页参数的对象
  })
}

// 余额明细
export const getBalanceDetailListApi = (params: any) => {
  return request.get({
    url: '/v3/user/balance_record',
    params: params
  })
}
