export enum SystemType {
  MANAGEMENT = 'Management',
  OPERATION = 'Operation',
  CREDIT = 'Credit' // 新增
}

export interface SystemConfig {
  prefix: string
  description: string
}

export const SYSTEM_CONFIG: Record<SystemType, SystemConfig> = {
  [SystemType.MANAGEMENT]: {
    prefix: '/v1',
    description: '管理系统'
  },
  [SystemType.OPERATION]: {
    prefix: '/v2',
    description: '运营系统'
  },
  [SystemType.CREDIT]: {
    prefix: '/v3',
    description: '话费系统'
  }
}

// 获取当前系统类型
export const getCurrentSystemType = (): SystemType => {
  return (import.meta.env.VITE_SYSTEM_TYPE as SystemType) || SystemType.MANAGEMENT
}

// 获取系统配置
export const getSystemConfig = (): SystemConfig => {
  const systemType = getCurrentSystemType()
  return SYSTEM_CONFIG[systemType]
}

// 检查URL是否包含版本前缀
export const hasVersionPrefix = (url: string): boolean => {
  return url.startsWith('/v1') || url.startsWith('/v2') || url.startsWith('/v3')
}

// 获取URL中的版本前缀
export const getUrlVersionPrefix = (url: string): string | null => {
  if (url.startsWith('/v1')) return '/v1'
  if (url.startsWith('/v2')) return '/v2'
  if (url.startsWith('/v3')) return '/v3'
  return null
}

// 移除URL中的版本前缀
export const removeVersionPrefix = (url: string): string => {
  if (url.startsWith('/v1')) return url.substring(3)
  if (url.startsWith('/v2')) return url.substring(3)
  if (url.startsWith('/v3')) return url.substring(3)
  return url
}

// 检查URL前缀是否与当前系统类型匹配
export const isUrlPrefixMatchingSystem = (url: string): boolean => {
  const currentSystem = getCurrentSystemType()
  const urlPrefix = getUrlVersionPrefix(url)

  if (!urlPrefix) return true // 没有前缀的URL视为匹配

  return (
    (currentSystem === SystemType.MANAGEMENT && urlPrefix === '/v1') ||
    (currentSystem === SystemType.OPERATION && urlPrefix === '/v2') ||
    // 对于/v3前缀，我们暂时认为它与任何系统类型都匹配
    urlPrefix === '/v3'
  )
}
