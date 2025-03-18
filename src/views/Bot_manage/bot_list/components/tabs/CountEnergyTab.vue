<template>
  <div>
    <Form
      :isCol="true"
      labelPosition="top"
      :schema="countEnergySchema"
      @register="formRegister"
      :gridColumns="3"
    />
  </div>
</template>

<script setup lang="tsx">
import { reactive, defineExpose } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'

// 表单相关
const { formRegister, formMethods } = useForm()

// 笔数能量价格表单
const countEnergySchema = reactive<FormSchema[]>([
  {
    field: 'countEnergyEnabled',
    component: 'Tag' as const,
    label: '笔数能量：',
    value: '笔数能量',
    formItemProps: {
      rules: [{ required: true, message: '笔数能量是必填项' }]
    }
  },
  {
    field: 'count_price_trx',
    component: 'InputNumber' as const,
    label: {
      text: '[1笔]能量TRX价格：',
      tips: '只支持整数'
    },
    componentProps: {
      placeholder: '请输入TRX价格',
      min: 0,
      precision: 0,
      remark: () => {
        return (
          <>
            <p>使用6.5W能量成本为：2.55TRX/笔</p>
            <p>使用13.1W能量成本为：5.1TRX/笔</p>
          </>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '能量TRX价格是必填项' }]
    }
  },
  {
    field: 'count_price_usdt',
    component: 'InputNumber' as const,
    label: {
      text: '[1笔]能量USDT价格：',
      tips: '只支持保留一位小数'
    },
    componentProps: {
      placeholder: '请输入USDT价格',
      min: 0,
      precision: 1
    },
    formItemProps: {
      rules: [{ required: true, message: '能量USDT价格是必填项' }]
    }
  },
  {
    field: 'notifyUser',
    component: 'Switch' as const,
    label: '地址笔数变更通知(用户)：',
    value: 2,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    }
  },
  {
    field: 'notifyGroupOwner',
    component: 'Switch' as const,
    label: '地址笔数变更通知(群主)：',
    value: 2,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    }
  },
  {
    field: 'notifyAdmin',
    component: 'Switch' as const,
    label: '地址笔数变更通知(机器人管理员)：',
    value: 2,
    componentProps: {
      activeValue: 1,
      inactiveValue: 2
    }
  }
])

// 暴露表单方法
defineExpose({
  formMethods
})
</script>
