import axios, { AxiosError } from 'axios'
import { defaultRequestInterceptors, defaultResponseInterceptors } from './config'
import { AxiosInstance, InternalAxiosRequestConfig, RequestConfig, AxiosResponse } from './types'
import { ElMessage } from 'element-plus'
import { REQUEST_TIMEOUT } from '@/constants'
import {
  getSystemConfig,
  SystemType,
  getCurrentSystemType,
  hasVersionPrefix,
  getUrlVersionPrefix,
  removeVersionPrefix,
  isUrlPrefixMatchingSystem
} from '@/constants/system'
// Remove system store import
// import { useAppStore } from '@/store/modules/app' // Keep app store if used elsewhere, remove if not
// import { useSystemStore } from '@/store/modules/system'

export const PATH_URL = import.meta.env.VITE_API_BASE_PATH

const abortControllerMap: Map<string, AbortController> = new Map()

const axiosInstance: AxiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  baseURL: PATH_URL // 如果使用mock，则不使用API基础路径
})

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const controller = new AbortController()
  const originalUrl = config.url || ''

  // --- Mock 逻辑判断 ---
  const MOCK_LIST = (import.meta.env.VITE_MOCK_LIST || '').split(',')
  const useMock = import.meta.env.VITE_USE_MOCK === 'true'
  const isMockRequest = useMock && MOCK_LIST.some((item) => item && originalUrl.includes(item)) // 确保 item 非空

  if (isMockRequest) {
    // 如果是 Mock 请求, 修改 URL 并设置 baseURL 为空
    config.url = '/mock' + originalUrl
    config.baseURL = ''
  } else {
    // --- 非 Mock 请求: 处理 API 版本前缀 ---
    const { prefix } = getSystemConfig()
    const currentUrl = config.url || ''

    // 如果是公共接口，不添加前缀
    if (currentUrl.includes('/public')) {
      // 不做任何处理
    }
    // 如果URL已经有版本前缀
    else if (hasVersionPrefix(currentUrl)) {
      // 检查前缀是否与当前系统类型匹配
      if (!isUrlPrefixMatchingSystem(currentUrl)) {
        console.warn(
          `请求 URL [${currentUrl}] 与当前系统类型不匹配 (当前系统: ${getCurrentSystemType()})`
        )

        // 如果需要强制使用当前系统的前缀，可以取消下面的注释
        // const urlWithoutPrefix = removeVersionPrefix(currentUrl)
        // config.url = `${prefix}${urlWithoutPrefix}`
      }
    }
    // 如果URL没有版本前缀，添加当前系统的前缀
    else {
      config.url = `${prefix}${currentUrl}`
    }
  }

  // --- 设置 AbortController ---
  const finalUrl = config.url || '' // 使用最终确定的 URL
  config.signal = controller.signal
  abortControllerMap.set(finalUrl, controller)

  return config
})

// Response interceptor remains the same (handles abort cleanup)
axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => {
    const url = res.config.url || ''
    abortControllerMap.delete(url)
    return res
  },
  (error: AxiosError) => {
    console.log('err： ' + error) // for debug
    const url = error.config?.url || ''
    if (url) {
      abortControllerMap.delete(url)
    }
    ElMessage.error(error.message)
    return Promise.reject(error)
  }
)

// Apply default interceptors (assuming they don't depend on Pinia)
axiosInstance.interceptors.request.use(defaultRequestInterceptors)
axiosInstance.interceptors.response.use(defaultResponseInterceptors)

// Export the configured instance
// The service object might need adjustment if its methods relied on the prefix being added here
const service = {
  request: (config: RequestConfig): Promise<AxiosResponse> => {
    // Keep explicit Promise type
    return new Promise((resolve, reject) => {
      // Apply per-request interceptors if provided
      if (config.interceptors?.requestInterceptors) {
        config = config.interceptors.requestInterceptors(config as InternalAxiosRequestConfig)
      }

      axiosInstance
        .request(config) // Use the globally configured axiosInstance
        .then((res) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        })
    })
  },
  cancelRequest: (url: string | string[]) => {
    const urlList = Array.isArray(url) ? url : [url]
    for (const _url of urlList) {
      abortControllerMap.get(_url)?.abort()
      abortControllerMap.delete(_url)
    }
  },
  cancelAllRequest() {
    for (const [_, controller] of abortControllerMap) {
      controller.abort()
    }
    abortControllerMap.clear()
  }
}

// Export both the instance (for adding interceptors later) and the service object
export { axiosInstance }
export default service
