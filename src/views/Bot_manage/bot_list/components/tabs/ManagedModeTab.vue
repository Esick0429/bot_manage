<template>
  <div>
    <Form labelPosition="top" :isCol="true" :schema="managedModeSchema" @register="formRegister" />
  </div>
</template>

<script setup lang="tsx">
import { reactive, defineExpose, defineProps, computed } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'

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

// 托管模式价格表单
const managedModeSchema = reactive<FormSchema[]>([
  // {
  //   field: 'delegate_price_trx',
  //   component: 'InputNumber' as const,
  //   label: '【托管模式】笔数价格（TRX）：',
  //   componentProps: {
  //     placeholder: '请输入笔数价格',
  //     min: 0,
  //     precision: 2
  //   },
  //   formItemProps: {
  //     rules: [{ required: true, message: '笔数价格是必填项' }]
  //   }
  // },
  // {
  //   field: 'divider',
  //   component: 'Divider' as const,
  //   label: '自定义【托管模式】笔数价格（TRX）：',
  //   componentProps: {
  //     content: '自定义笔数价格',
  //     direction: 'horizontal'
  //   }
  // },
  // {
  //   field: 'enable_custom_delegate',
  //   component: 'Switch' as const,
  //   label: {
  //     text: '是否开启',
  //     tips: '可以自定义65000或131000能量使用的不同价格'
  //   },
  //   value: false,
  //   colProps: {
  //     span: 24
  //   }
  // },
  {
    field: 'price_trx_65000',
    component: 'InputNumber' as const,
    label: '65000能量价格:',
    componentProps: {
      placeholder: '请输入65000能量价格',
      min: 0,
      precision: 2,
      remark: () => {
        const costKey = 'manage_price_65000'
        const costPrice = computedAgentPrices.value[costKey]
        return (
          <>
            <p>成本为：{costPrice !== undefined ? `${costPrice} TRX/笔` : 'N/A'}</p>
          </>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '65000能量价格是必填项' }]
    }
  },
  {
    field: 'price_trx_131000',
    component: 'InputNumber' as const,
    label: '131000能量价格:',
    componentProps: {
      placeholder: '请输入131000能量价格',
      min: 0,
      precision: 2,
      remark: () => {
        const costKey = 'manage_price_13100'
        const costPrice = computedAgentPrices.value[costKey]
        return (
          <>
            <p>成本为：{costPrice !== undefined ? `${costPrice} TRX/笔` : 'N/A'}</p>
          </>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '131000能量价格是必填项' }]
    }
  }
])

// 暴露表单方法
defineExpose({
  formMethods
})
</script>
