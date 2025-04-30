import request from '@/axios'

// 定义批量充值提交的请求体结构
export interface SubmitBatchTopupPayload {
  id: number // 选中的产品/套餐 ID
  phones: string[] // 手机号数组
}

/**
 * @description: 提交批量充值请求
 * @param {SubmitBatchTopupPayload} data - 请求体数据
 * @returns {Promise<IResponse<any>>} // 假设后端返回标准 IResponse 结构，data 类型未知，暂定 any
 */
export const submitBatchTopupApi = (data: SubmitBatchTopupPayload): Promise<IResponse<any>> => {
  // 假设提交接口是 POST /v3/topup/batch_submit，请根据实际情况修改 URL 和方法
  return request.post<any>({
    url: '/user/batch/web_batch',
    data
  })
}
