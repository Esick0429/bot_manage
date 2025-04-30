// 读取环境变量 (构建时确定)
const systemTypeFromEnv = import.meta.env.VITE_SYSTEM_TYPE || 'Management'

/**
 * 检查当前系统是否为管理系统
 * @returns {boolean}
 */
export function isManagementSystem(): boolean {
  return systemTypeFromEnv === 'Management'
}

/**
 * 检查当前系统是否为运营系统
 * @returns {boolean}
 */
export function isOperationSystem(): boolean {
  return systemTypeFromEnv === 'Operation'
}

export function isCreditSystem(): boolean {
  return systemTypeFromEnv === 'Credit'
}

// 可选: 在模块加载时打印一次，方便调试
console.log(
  `[utils/system] VITE_SYSTEM_TYPE: ${systemTypeFromEnv}, isManagement: ${isManagementSystem()}`
)

export function getHomeUrl(systemType: string) {
  if (systemType === 'Management') return '/bot_manage/bot_list'
  if (systemType === 'Operation') return '/exchange_rate/index'
  if (systemType === 'Credit') return '/home/index'
  return '/'
}

export function getSystemTitle(systemType: string) {
  if (systemType === 'Management') return '机器人后台管理系统'
  if (systemType === 'Operation') return '机器人后台运营系统'
  if (systemType === 'Credit') return '话费系统'
  return '系统'
}

export function getUserApiPrefix() {
  if (systemTypeFromEnv === 'Management') return '/v1/user'
  if (systemTypeFromEnv === 'Operation') return '/manage/user'
  if (systemTypeFromEnv === 'Credit') return '/v3/user'
  return '/user'
}
