<script setup lang="tsx">
import { ref, watch, nextTick, computed, defineExpose, defineEmits } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useI18n } from '@/hooks/web/useI18n'
import { ElTree, ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import operationRoutes from '@/router/modules/operation'
import { addRoleApi, updateRoleApi } from '@/api/role'
import { PropType } from 'vue'

const { t } = useI18n()

// Define interface for currentRow data
interface RoleFormData {
  id?: number
  name?: string
  Name?: string // Keep compatibility
  status?: number
  permissions?: (string | number)[] | null
}

const props = defineProps({
  currentRow: Object as PropType<RoleFormData | null | undefined>,
  dialogTitle: String,
  actionType: String,
  formLoading: Boolean
})

const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const saveLoading = ref(false)

// 递归构建菜单树
function buildMenuTree(routes) {
  return routes
    .filter((route) => route.name && route.meta && route.meta.title && !route.meta.hidden)
    .map((route) => ({
      id: route.name,
      label: route.meta.title,
      children: route.children ? buildMenuTree(route.children) : undefined
    }))
}
const menuTree = buildMenuTree(operationRoutes)

const treeRef = ref()

// 表单schema
const formSchema = computed<FormSchema[]>(() => [
  {
    field: 'name',
    label: t('role.roleName'),
    component: 'Input',
    componentProps: {
      placeholder: t('role.roleName')
    }
  },
  {
    field: 'status',
    label: t('menu.status'),
    component: 'Select',
    componentProps: {
      placeholder: t('menu.status'),
      options: [
        { label: t('userDemo.enable'), value: 1 },
        { label: t('userDemo.disable'), value: 2 }
      ]
    }
  },
  {
    field: 'permissions',
    label: t('role.menu'),
    colProps: { span: 24 },
    formItemProps: {
      slots: {
        default: () => (
          <ElTree
            ref={treeRef}
            data={menuTree}
            show-checkbox
            node-key="id"
            highlight-current
            check-strictly
            default-expand-all
            onCheck={handleCheckChange}
          />
        )
      }
    }
  }
])

// 校验规则
const rules = {
  name: [{ required: true, message: t('role.roleName') + t('common.isRequired'), trigger: 'blur' }],
  status: [
    { required: true, message: t('menu.status') + t('common.isRequired'), trigger: 'change' }
  ],
  permissions: [
    { required: true, message: t('role.menu') + t('common.isRequired'), trigger: 'change' }
  ]
}

// useForm
const { formRegister, formMethods } = useForm()
const { setValues, getFormData, getElFormExpose } = formMethods

// 权限树与表单数据联动
const handleCheckChange = () => {
  nextTick(() => {
    const checkedKeys = treeRef.value?.getCheckedKeys(false) ?? []
    console.log('[Role/Write.vue] handleCheckChange - checkedKeys:', checkedKeys)
    setValues({ permissions: checkedKeys })
  })
}

// 根据 currentRow 和 actionType 回显表单
watch(
  () => [props.currentRow, props.actionType],
  ([row, type]) => {
    if (type === 'add' || !row) {
      setValues({ name: '', status: 1, permissions: [] })
      nextTick(() => treeRef.value?.setCheckedKeys([], false))
    } else {
      const permissions = Array.isArray(row.permissions) ? row.permissions : []
      setValues({
        name: row.Name ?? row.name ?? '',
        status: row.status ?? 1,
        permissions: permissions
      })
      nextTick(() => {
        const stringPermissions = permissions.map(String)
        treeRef.value?.setCheckedKeys(stringPermissions, false)
      })
    }
  },
  { immediate: true, deep: true }
)

// 暴露open/close/submit方法
const open = () => {
  dialogVisible.value = true

  if (!props.currentRow) {
    setValues({ name: '', status: 1, permissions: [] })
    nextTick(() => {
      treeRef.value?.setCheckedKeys([], false) // 确保清空
    })
  } else {
    const rowData = props.currentRow
    const permissions = Array.isArray(rowData.permissions) ? rowData.permissions : []
    const valuesToSet = {
      name: rowData.Name ?? rowData.name ?? '',
      status: rowData.status ?? 1,
      permissions: permissions // 传递给 setValues 的还是原始 permissions
    }
    setValues(valuesToSet) // 调用 setValues

    // 在 nextTick 中设置 Tree，确保 DOM 更新和 setValues 生效
    nextTick(() => {
      const stringPermissions = permissions.map(String)
      // 先清空再设置，确保状态正确
      treeRef.value?.setCheckedKeys([], false)
      treeRef.value?.setCheckedKeys(stringPermissions, false)
    })
  }
}
const close = () => {
  dialogVisible.value = false
}

// Internal submit logic
const submit = async () => {
  const elForm = await getElFormExpose()
  const valid = await elForm?.validate().catch(() => {})
  if (!valid) return

  saveLoading.value = true
  const formData = await getFormData()
  const dataToSave = { ...formData }

  try {
    if (props.actionType === 'edit') {
      if (!props.currentRow?.id) {
        ElMessage.error('无法编辑角色：缺少角色ID。')
        saveLoading.value = false
        return
      }
      dataToSave.id = props.currentRow.id
      await updateRoleApi(dataToSave)
      ElMessage.success(t('common.editSuccess'))
    } else if (props.actionType === 'add') {
      await addRoleApi(dataToSave)
      ElMessage.success(t('common.addSuccess'))
    }
    close() // Close dialog on success
    emit('success') // Emit success event
  } catch (e: any) {
    const errMsg = e?.response?.data?.message || e?.message || t('common.apiError')
    ElMessage.error(errMsg)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ open, close, submit })
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" :fullscreen="false" width="50%">
    <Form
      :rules="rules"
      @register="formRegister"
      :schema="formSchema"
      :loading="props.formLoading || saveLoading"
    />
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </Dialog>
</template>
