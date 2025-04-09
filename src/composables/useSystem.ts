import { computed } from 'vue'

// 读取环境变量 (构建时确定)
const systemTypeFromEnv = import.meta.env.VITE_SYSTEM_TYPE

// 判断是否为管理系统 ('admin')
const isManagementSystem = computed(() => systemTypeFromEnv === 'Management')
// 判断是否为运营系统 ('ops')
const isOperationSystem = computed(() => systemTypeFromEnv !== 'Management') // 假设非 Management 即为 Operations

/**
 * 提供当前系统类型的响应式状态
 * @returns {{ isManagement: Readonly<Ref<boolean>>, isOperation: Readonly<Ref<boolean>> }}
 */
export function useSystem() {
  return {
    /**
     * 是否为管理系统
     */
    isManagement: isManagementSystem,
    /**
     * 是否为运营系统
     */
    isOperation: isOperationSystem
  }
}

// 可选: 在模块加载时打印一次，方便调试
console.log(
  `[useSystem] VITE_SYSTEM_TYPE: ${systemTypeFromEnv}, isManagement: ${isManagementSystem.value}`
)
