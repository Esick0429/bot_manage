<template>
  <div>
    <Form
      :schema="flashExchangeSchema"
      @register="formRegister"
      :isCol="true"
      labelPosition="top"
    />
  </div>
</template>

<script setup lang="tsx">
import { reactive, defineExpose, ref, watch } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { ElInputNumber } from 'element-plus'

// 表单相关
const { formRegister, formMethods } = useForm()

// 创建内部状态管理开关值
const insufficientStockEnabled = ref(false)

// 闪兑配置表单
const flashExchangeSchema = reactive<FormSchema[]>([
  {
    field: 'walletAddress',
    component: 'Input' as const,
    label: {
      text: '【闪兑TRX/USDT】收款钱包地址 ',
      tips: '当您的可兑换库存低于设置值时，将会发送通知机器人管理员'
    },
    componentProps: {
      placeholder: '请输入钱包地址'
    },
    formItemProps: {
      rules: [{ required: true, message: '收款钱包地址是必填项' }]
    }
  },
  {
    field: 'minBalance',
    component: 'InputNumber' as const,
    label: {
      text: '最低账号余额',
      tips: '当您的账号余额低于此值，兑换将会失效。请设置合理的值避免影响其他业务'
    },
    componentProps: {
      placeholder: '请输入最低余额',
      min: 0,
      precision: 2
    }
  },
  {
    field: 'exchangeProfit',
    component: 'InputNumber' as const,
    label: {
      text: 'USDT兑TRX利润',
      tips: '每笔兑换的利润金额'
    },
    componentProps: {
      placeholder: '请输入利润金额',
      min: 0,
      precision: 2,
      remark: () => {
        return (
          <>
            <p>成本：8 USDT</p>
          </>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: '利润金额是必填项' }]
    }
  },
  {
    field: 'exchangeLimit',
    component: 'InputNumber' as const,
    label: {
      text: 'USDT兑TRX可兑换上限',
      tips: '用户单次可兑换的上限'
    },
    componentProps: {
      placeholder: '请输入兑换上限',
      min: 0,
      precision: 2
    }
  },
  {
    field: 'insufficientStock',
    component: 'Switch' as const,
    label: {
      text: '启用库存不足提醒',
      tips: '当您的可兑换库存低于设置值时，将会发送通知机器人管理员'
    },
    componentProps: {
      activeValue: true,
      inactiveValue: false,
      onChange: async (value) => {
        insufficientStockEnabled.value = value
        await formMethods.setValues({
          insufficientStock: value
        })
      }
    }
  },
  {
    field: 'insufficientStockValue',
    component: 'InputNumber' as const,
    label: '库存告警值',
    componentProps: {
      placeholder: '请输入库存告警值',
      min: 0,
      precision: 2
    },
    hidden: () => !insufficientStockEnabled.value,
    formItemProps: {
      rules: [
        {
          required: true,
          message: '库存告警值是必填项'
        }
      ]
    }
  }
])

// 更新启用状态
const updateEnabled = async () => {
  const data = await formMethods.getFormData()
  insufficientStockEnabled.value = data.insufficientStock || false
}

// 初始化时更新状态
setTimeout(updateEnabled, 100)

// 暴露表单方法
defineExpose({
  formMethods
})
</script>
