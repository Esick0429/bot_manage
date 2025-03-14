<template>
  <div>
    <Form
      labelPosition="top"
      :schema="timeEnergySchema"
      @register="formRegister"
      :gridColumns="3"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, defineExpose, defineProps } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useFormValidation } from '../composables/useFormValidation'

const props = defineProps({
  costPrices: {
    type: Object,
    default: () => ({
      timeEnergy1Hour: 1.0,
      timeEnergy1Day: 3.0,
      timeEnergy3Days: 8.0,
      timeEnergy7Days: 15.0,
      timeEnergy15Days: 28.0
    })
  }
})

// 表单相关
const { formRegister, formMethods } = useForm()
const { required, validateMinPrice } = useFormValidation(props.costPrices)

// 时间能量价格表单
const timeEnergySchema = reactive<FormSchema[]>([
  {
    field: 'timeEnergyPrice',
    component: 'InputNumber' as const,
    label: {
      text: '【1小时】能量闪租价格（TRX ）（1笔6.5W能量）',
      tips: '最多支持保留一位小数，注意：此为1笔65000能量价格，不要设置0.1结尾的价格，避免和笔数价格冲突'
    },
    componentProps: {
      placeholder: '请输入价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [{ required: true, message: '时间能量价格是必填项' }]
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'timeEnergyMultiplier',
    component: 'InputNumber' as const,
    label: {
      text: '【1小时】能量闪租最大倍数',
      tips: '如果转账金额超过设置的倍数 * 单价，则不发货'
    },
    componentProps: {
      placeholder: '请输入倍数',
      min: 1,
      precision: 2
    },
    colProps: {
      span: 12
    }
  },
  {
    field: 'priceConfig',
    component: 'Divider' as const,
    label: '按时间购买能量价格配置（1笔6.5W能量）：',
    componentProps: {
      contentPosition: 'left'
    }
  },
  {
    field: 'timeEnergy1Hour',
    component: 'InputNumber' as const,
    label: '1小时配置：',
    componentProps: {
      placeholder: '请输入1小时配置',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '1小时配置是必填项' },
        { validator: validateMinPrice, trigger: 'blur' }
      ]
    }
  },
  {
    field: 'timeEnergy1Day',
    component: 'InputNumber' as const,
    label: '1天配置：',
    componentProps: {
      placeholder: '请输入1天配置',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '1天配置是必填项' },
        { validator: validateMinPrice, trigger: 'blur' }
      ]
    }
  },
  {
    field: 'timeEnergy3Days',
    component: 'InputNumber' as const,
    label: '3天配置：',
    componentProps: {
      placeholder: '请输入3天配置',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '3天配置是必填项' },
        { validator: validateMinPrice, trigger: 'blur' }
      ]
    }
  },
  {
    field: 'timeEnergy7Days',
    component: 'InputNumber' as const,
    label: '7天配置：',
    componentProps: {
      placeholder: '请输入7天配置',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '7天配置是必填项' },
        { validator: validateMinPrice, trigger: 'blur' }
      ]
    }
  },
  {
    field: 'timeEnergy15Days',
    component: 'InputNumber' as const,
    label: '15天配置：',
    componentProps: {
      placeholder: '请输入15天配置',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        { required: true, message: '15天配置是必填项' },
        { validator: validateMinPrice, trigger: 'blur' }
      ]
    }
  }
])

// 暴露表单方法
defineExpose({
  formMethods
})
</script>
