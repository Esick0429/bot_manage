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
  agentPrices: {
    type: Object,
    default: () => ({})
  }
})

// 表单相关
const { formRegister, formMethods } = useForm()
const { required, validateMinPrice } = useFormValidation(props.agentPrices)

// 时间能量价格表单
const timeEnergySchema = reactive<FormSchema[]>([
  {
    field: 'flash_price',
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
    field: 'flash_time_max_num',
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
    label: '按时间购买能量价格（1笔6.5W能量）：',
    componentProps: {
      contentPosition: 'left'
    }
  },
  // {
  //   field: 'hour_1_price',
  //   component: 'InputNumber' as const,
  //   label: '1小时价格：',
  //   componentProps: {
  //     placeholder: '请输入1小时价格',
  //     min: 0,
  //     precision: 1
  //   },
  //   formItemProps: {
  //     rules: [
  //       { required: true, message: '1小时价格是必填项' },
  //       { validator: validateMinPrice, trigger: 'blur' }
  //     ]
  //   }
  // },
  {
    field: 'day_1_price',
    component: 'InputNumber' as const,
    label: '1天价格：',
    componentProps: {
      placeholder: '请输入1天价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        required('1天价格'),
        { validator: validateMinPrice, trigger: 'blur' }
      ]
    }
  },
  {
    field: 'day_3_price',
    component: 'InputNumber' as const,
    label: '3天价格：',
    componentProps: {
      placeholder: '请输入3天价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        required('3天价格'),
        { validator: validateMinPrice, trigger: 'blur' }
      ]
    }
  },
  {
    field: 'day_7_price',
    component: 'InputNumber' as const,
    label: '7天价格：',
    componentProps: {
      placeholder: '请输入7天价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        required('7天价格'),
        { validator: validateMinPrice, trigger: 'blur' }
      ]
    }
  },
  {
    field: 'day_15_price',
    component: 'InputNumber' as const,
    label: '15天价格：',
    componentProps: {
      placeholder: '请输入15天价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [
        required('15天价格'),
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
