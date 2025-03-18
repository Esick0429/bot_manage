<template>
  <div>
    <Form labelPosition="top" :isCol="true" :schema="managedModeSchema" @register="formRegister" />
  </div>
</template>

<script setup lang="tsx">
import { reactive, defineExpose } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { ElInputNumber } from 'element-plus'

// 表单相关
const { formRegister, formMethods } = useForm()

// 托管模式价格表单
const managedModeSchema = reactive<FormSchema[]>([
  {
    field: 'delegate_price_trx',
    component: 'InputNumber' as const,
    label: '笔数价格:',
    componentProps: {
      placeholder: '请输入笔数价格',
      min: 0,
      precision: 2
    },
    formItemProps: {
      rules: [{ required: true, message: '笔数价格是必填项' }]
    }
  },
  {
    field: 'divider',
    component: 'Divider' as const,
    label: '自定义笔数价格',
    componentProps: {
      content: '自定义笔数价格',
      direction: 'horizontal'
    }
  },
  {
    field: 'enable_custom_delegate',
    component: 'Switch' as const,
    label: {
      text: '是否开启',
      tips: '可以自定义65000或131000能量使用的不同价格'
    },
    value: 2,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    },
    colProps: {
      span: 24
    }
  },
  {
    field: 'price_trx_65000',
    component: 'InputNumber' as const,
    label: '65000能量价格:',
    componentProps: {
      placeholder: '请输入65000能量价格',
      min: 0,
      precision: 2,
      remark: () => {
        return (
          <>
            <p>成本为：2.55TRX/笔</p>
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
        return (
          <>
            <p>成本为：5.1TRX/笔</p>
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
