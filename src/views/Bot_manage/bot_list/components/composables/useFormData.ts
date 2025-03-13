import { ref, onMounted, Ref } from 'vue'
import type { FormExpose } from '@/components/Form'

/**
 * 表单数据绑定组合式函数
 * @param formMethods 表单方法对象
 * @param defaultValues 默认值
 * @returns 表单数据和更新方法
 */
export function useFormData(formMethods: any, defaultValues: Record<string, any> = {}) {
  // 创建响应式变量存储表单数据
  const formData = ref<Record<string, any>>(defaultValues)

  // 在组件挂载时获取表单数据
  onMounted(async () => {
    const data = await formMethods.getFormData(false)
    formData.value = { ...defaultValues, ...data }
  })

  // 更新表单数据的方法
  const updateFormData = async (field: string, value: any) => {
    // 更新本地表单数据
    formData.value[field] = value
    
    // 更新Form组件内部的数据
    const form = await formMethods.getFormExpose()
    const data = { [field]: value }
    form?.setValues(data)
  }

  return {
    formData,
    updateFormData
  }
} 