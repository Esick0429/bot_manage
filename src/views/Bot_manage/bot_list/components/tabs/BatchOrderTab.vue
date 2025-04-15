<template>
  <div>
    <Form :schema="batchOrderSchema" @register="formRegister" :isCol="true" labelPosition="top" />
  </div>
</template>

<script setup lang="tsx">
import { reactive, defineExpose, defineProps, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { ElInputNumber } from 'element-plus'

// 定义 props 来接收 agentPrices
const props = defineProps({
  agentPrices: {
    type: Object,
    default: () => ({})
  }
})

// 使用 computed 来安全地访问嵌套属性
const computedAgentPrices = computed(() => props.agentPrices || {})

// 表单相关
const { formRegister, formMethods } = useForm()

// 批量下单价格表单
const batchOrderSchema = reactive<FormSchema[]>([
  {
    field: 'batch_energy_price',
    component: 'InputNumber' as const,
    label: '能量单价',
    componentProps: {
      placeholder: '请输入能量单价',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [{ required: true, message: '能量单价是必填项' }]
    }
  },
  {
    field: 'batch_active_price',
    component: 'InputNumber' as const,
    label: '激活地址单价',
    componentProps: {
      placeholder: '请输入激活地址单价',
      min: 1.1,
      precision: 2,
      remark: () => {
        return (
          <>
            <p>激活成本为：1.1TRX</p>
          </>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '激活地址单价是必填项' }]
    }
  }
])

// 暴露表单方法
defineExpose({
  formMethods
})
</script>
