<template>
  <Dialog v-model="visible" :title="dialogTitle">
    <Form :schema="formSchema" @register="formRegister" :isCol="true" :gridColumns="1" />
    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitting">确定</ElButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import {
  createResourcePoolAccountApi,
  updateResourcePoolAccountApi
} from '@/api/system/resource_pool_account'

// 定义类型
interface FormData {
  id?: number
  configType: string | number // 允许字符串或数字
  publicKey: string
  privateKey: string
  // status: number
  amount_limit?: number // 可选
  permission_name?: string // <--- 修改：从 permission_group 改为 permission_name，类型为 string
  [key: string]: any
}

interface OpenParams {
  mode: 'add' | 'edit'
  data?: Partial<FormData>
}

const emit = defineEmits(['success'])
const visible = ref(false)
const submitting = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const currentData = ref<Partial<FormData>>({})

// 弹窗标题
const dialogTitle = computed(() => {
  return formMode.value === 'add' ? '新增资源池账户' : '编辑资源池账户'
})

// --- Schema 定义 --- START ---
const baseSchema: FormSchema[] = [
  {
    field: 'publicKey',
    component: 'Input',
    label: '公钥：',
    componentProps: {
      placeholder: '请输入公钥',
      maxlength: 200,
      remark: () => {
        return <span class="text-red-500 text-xs">请填写拥有者账户公钥地址</span>
      }
    },
    formItemProps: {
      rules: [{ required: true, message: ' ', trigger: 'blur' }]
    }
  }
]

const trxPoolSchema: FormSchema[] = [
  {
    field: 'privateKey',
    component: 'Input',
    label: '私钥：',
    componentProps: {
      placeholder: '请输入私钥：',
      maxlength: 200,
      type: 'password',
      showPassword: true,
      remark: () => {
        return <span class="text-red-500 text-xs">请填写拥有者账户加密后的私钥</span>
      }
    },
    formItemProps: {
      rules: [{ required: true, message: ' ', trigger: 'blur' }]
    }
  }
]

const energyPoolSchema: FormSchema[] = [
  {
    field: 'privateKey',
    component: 'Input',
    label: '授权私钥',
    componentProps: {
      placeholder: '请输入授权私钥',
      maxlength: 200,
      type: 'password',
      showPassword: true,
      remark: () => {
        return (
          <span class="text-red-500 text-xs">请填写授权活跃账户加密后的私钥，填错无法成功代理</span>
        )
      }
    },
    formItemProps: {
      rules: [{ required: true, message: ' ', trigger: 'blur' }]
    }
  },
  {
    field: 'amount_limit',
    component: 'InputNumber',
    label: '阈值：',
    componentProps: {
      placeholder: '请输入阈值',
      precision: 2,
      remark: '说明：当达到阈值时，自动切换至最高优先级备用地址'
    }
  },
  {
    field: 'permission_name',
    component: 'Input',
    label: '授权账户权限名称：',
    componentProps: {
      placeholder: '请输入权限名称',
      maxlength: 100,
      remark: () => {
        return <span class="text-red-500 text-xs">请填写活跃权限名称</span>
      }
    },
    formItemProps: {
      rules: [{ required: true, message: ' ', trigger: 'blur' }]
    }
  }
]

// 构建完整 Schema 的函数
const buildSchema = (type: number | string | undefined): FormSchema[] => {
  let numericType: number | undefined = typeof type === 'string' ? parseInt(type, 10) : type
  if (numericType === undefined || isNaN(numericType)) {
    numericType = 1
  }

  const configSchema: FormSchema = {
    field: 'configType',
    component: 'Select',
    label: '配置类型：',
    componentProps: {
      placeholder: '请选择配置类型',
      options: [
        { label: 'TRX池子', value: 1 },
        { label: '能量池子', value: 3 }
      ],
      onChange: handleConfigTypeChange
    },
    formItemProps: {
      rules: [{ required: true, message: ' ', trigger: 'change' }]
    }
  }

  let specificSchema: FormSchema[] = []
  if (numericType === 1) {
    specificSchema = trxPoolSchema
  } else if (numericType === 3) {
    specificSchema = energyPoolSchema
  }

  return [configSchema, ...baseSchema, ...specificSchema]
}

// --- Schema 定义 --- END ---

// --- 处理函数 --- START ---
// 根据类型更新 Schema (现在是替换整个 schema)
const handleConfigTypeChange = (value: number | string | undefined) => {
  const newSchema = buildSchema(value)
  formSchema.value = newSchema // 直接替换 ref 的值

  // 清理逻辑现在应该能正确处理 permission_name (作为字符串被设为 undefined)
  nextTick(async () => {
    const { getFormData, setValues } = formMethods
    const currentValues = await getFormData()
    const newSchemaFields = new Set(newSchema.map((item) => item.field))
    const valuesToClear: Record<string, any> = {}

    for (const key in currentValues) {
      if (key === 'configType') continue
      if (!newSchemaFields.has(key)) {
        valuesToClear[key] = undefined
      }
    }

    if (Object.keys(valuesToClear).length > 0) {
      console.log('Clearing values:', valuesToClear)
      await setValues(valuesToClear)
    }
  })
}
// --- 处理函数 --- END ---

// 表单 Schema Ref
const formSchema = ref<FormSchema[]>(buildSchema(1)) // 默认使用 TRX 池子 Schema 初始化

// 使用表单Hook
const { formRegister, formMethods } = useForm()
const { setValues, getFormData, getElFormExpose, getFormExpose } = formMethods

// 打开弹窗
const open = async (params: OpenParams) => {
  formMode.value = params.mode
  visible.value = true
  currentData.value = params.data || {}

  // 确保 initialConfigType 是数字，并处理默认值
  let initialConfigType: number | undefined =
    typeof currentData.value.configType === 'string'
      ? parseInt(currentData.value.configType, 10) // 尝试解析字符串
      : currentData.value.configType // 如果已经是数字或undefined

  // 如果解析失败(NaN)或本来就是undefined，则设为默认值 1 (TRX Pool)
  if (initialConfigType === undefined || isNaN(initialConfigType)) {
    initialConfigType = 1
  }

  // 1. 根据初始类型构建 Schema
  formSchema.value = buildSchema(initialConfigType)

  // 2. 等待 Form 组件更新完毕
  await nextTick()

  // 3. 获取 Form 实例 (可选)
  // const formExpose = await getFormExpose();
  // if (!formExpose) return;

  // 4. 设置表单值
  const valuesToSet: Record<string, any> = {
    configType: initialConfigType, // 使用处理过的数字类型
    publicKey: currentData.value.publicKey || ''
  }
  // 现在可以安全地用 === 比较数字
  if (initialConfigType === 1) {
    // TRX
    valuesToSet.privateKey = currentData.value.privateKey || ''
  } else if (initialConfigType === 3) {
    // Energy
    valuesToSet.privateKey = currentData.value.privateKey || '' // 注意字段名一致
    // 使用 ?? undefined 确保数字字段在没有值时设置为 undefined
    valuesToSet.amount_limit = currentData.value.amount_limit ?? undefined
    valuesToSet.permission_name = currentData.value.permission_name || '' // <--- 修改：使用 permission_name，默认为空字符串
  }
  await setValues(valuesToSet)
}

// 提交表单
const handleSubmit = async () => {
  const elForm = await getElFormExpose()
  await elForm?.validate(async (valid: boolean) => {
    if (!valid) return

    const formData = await getFormData()

    // 确保 formData.configType 是数字用于后续逻辑
    const configTypeNum =
      typeof formData.configType === 'string'
        ? parseInt(formData.configType, 10)
        : formData.configType

    submitting.value = true

    // const statusValue = currentData.value?.status ?? 2

    // 根据最终的 formData 构建提交数据
    const dataToSubmit: any = {
      resource_type: configTypeNum, // 使用数字类型
      public_key: formData.publicKey,
      private_key: formData.privateKey // 两个类型都需要
      // status: statusValue
    }

    if (configTypeNum === 3) {
      // 能量池子
      dataToSubmit.amount_limit = formData.amount_limit
      dataToSubmit.permission_name = formData.permission_name
    } else if (configTypeNum === 1) {
      // TRX 池子 - 确保不提交能量池字段 (如果清理逻辑未生效)
      delete dataToSubmit.amount_limit
      delete dataToSubmit.permission_name // <--- 修改：确保清理 permission_name
    } else {
      console.error('Unhandled configType in handleSubmit:', configTypeNum)
      ElMessage.error('未知的配置类型，无法提交')
      submitting.value = false
      return
    }

    // 再次清理确保只有需要的字段被提交
    if (configTypeNum === 1) {
      delete dataToSubmit.amount_limit
      delete dataToSubmit.permission_name // <--- 修改：确保清理 permission_name
    }

    try {
      if (formMode.value === 'add') {
        const res = await createResourcePoolAccountApi(dataToSubmit)
        if (res.code === '000000') {
          visible.value = false
          ElMessage.success('新增成功')
        }
      } else {
        const res = await updateResourcePoolAccountApi({
          id: currentData.value.id,
          ...dataToSubmit
        })
        if (res.code === '000000') {
          visible.value = false
          ElMessage.success('更新成功')
        }
      }
      emit('success')
    } catch (error) {
      console.error('提交失败:', error)
      const message = error instanceof Error ? error.message : '未知错误'
      ElMessage.error(`操作失败: ${message}`)
    } finally {
      submitting.value = false
    }
  })
}

defineExpose({
  open
})
</script>
