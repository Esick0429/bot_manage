// 读取环境变量 (构建时确定)
const systemTypeFromEnv = import.meta.env.VITE_SYSTEM_TYPE

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
  // 假设非 Management 即为 Operations
  return systemTypeFromEnv !== 'Management'
}

// 可选: 在模块加载时打印一次，方便调试
console.log(
  `[utils/system] VITE_SYSTEM_TYPE: ${systemTypeFromEnv}, isManagement: ${isManagementSystem()}`
)
