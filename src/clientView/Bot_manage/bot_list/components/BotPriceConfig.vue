<template>
  <ContentWrap>
    <div class="mb-2 text-xl">配置机器人充值价格 (Bot ID: {{ botId }})</div>
    <ElRow :gutter="20">
      <!-- Left Column: Country List -->
      <ElCol :span="4">
        <ElCard shadow="never" class="country-list-card" v-loading="isLoadingCountries">
          <template #header>
            <div class="font-bold">选择国家</div>
          </template>
          <div
            v-if="!countries.length && !isLoadingCountries"
            class="text-center text-gray-500 p-4"
          >
            暂无国家数据
          </div>
          <div
            v-for="country in countries"
            :key="country.country_iso"
            :class="[
              'country-item',
              'flex items-center p-2 mb-1 cursor-pointer rounded',
              { 'bg-blue-100 text-blue-700': selectedCountryCode === country.country_iso }
            ]"
            @click="selectCountry(country)"
          >
            <div
              :class="['imr-flag', 'imr-flag-' + country.country_iso.toUpperCase(), 'mr-2']"
            ></div>
            <span class="text-sm font-medium"
              >{{ country.area_code }} {{ country.country_cn }}</span
            >
          </div>
        </ElCard>
      </ElCol>

      <!-- Right Column: Main Content -->
      <ElCol :span="20">
        <ElCard shadow="never" v-loading="isLoadingOperatorsAndProducts">
          <!-- Top-up Type Radio -->
          <div class="mb-4">
            <ElRadioGroup
              v-model="selectedProductType"
              class="mb-4"
              @change="handleProductTypeChange"
            >
              <ElRadioButton :value="1">话费充值</ElRadioButton>
              <ElRadioButton :value="2">套餐充值</ElRadioButton>
            </ElRadioGroup>
          </div>

          <!-- Operator Tabs (Data now comes from getProductPriceApi) -->
          <div v-if="selectedCountryCode && !isLoadingOperatorsAndProducts">
            <ElTabs
              v-model="selectedOperatorName"
              v-if="operatorProductData.length > 0"
              class="mb-4"
              @tab-change="handleOperatorTabChange"
            >
              <ElTabPane
                v-for="opData in operatorProductData"
                :key="opData.operator"
                :label="opData.operator"
                :name="opData.operator"
              />
            </ElTabs>
            <div
              v-else-if="!isLoadingOperatorsAndProducts && selectedCountryCode"
              class="text-center text-gray-500 p-4"
            >
              该国家/类型下暂无运营商或产品数据。
            </div>
          </div>

          <!-- Scrollable Container for Product Grid -->
          <div
            style="height: 400px; margin-bottom: 1.5rem; overflow-y: auto"
            v-if="currentOperatorProducts.length > 0"
          >
            <div class="amount-grid grid grid-cols-3 gap-4 p-1">
              <div
                v-for="(item, index) in currentOperatorProducts"
                :key="item.product_id + '-' + index"
                :class="[
                  'amount-card',
                  'border rounded p-3 cursor-pointer transition relative',
                  'flex flex-col justify-between',
                  selectedProduct?.product_id === item.product_id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                    : 'bg-gray-50 border-gray-200'
                ]"
                @click="selectProduct(item)"
                style="min-height: 150px"
              >
                <div>
                  <div class="font-bold text-sm mb-1">{{ item.product_name }}</div>
                  <div class="text-xs text-gray-600">成本价: {{ item.cost }} 元</div>
                  <div class="text-xs text-blue-600">
                    API返回售价:
                    {{
                      item.sale_price && parseFloat(item.sale_price) > 0
                        ? item.sale_price + ' USDT'
                        : '未设置'
                    }}
                  </div>
                </div>
                <!-- Price Input - Always Visible -->
                <div class="mt-2">
                  <ElFormItem label="新售价 (USDT)" class="mb-0">
                    <ElInputNumber
                      v-model="item.configured_sale_price"
                      :min="0"
                      :precision="2"
                      controls-position="right"
                      placeholder="输入新售价"
                      size="small"
                      class="w-full"
                      @click.stop
                    />
                  </ElFormItem>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="
              !isLoadingOperatorsAndProducts &&
              selectedCountryCode &&
              operatorProductData.length > 0 &&
              currentOperatorProducts.length === 0 &&
              selectedOperatorName
            "
            class="text-center text-gray-500 p-4"
          >
            当前运营商下暂无该类型产品。
          </div>
          <!-- End Scrollable Container -->

          <!-- Action Buttons -->
          <div class="flex justify-end mt-4">
            <BaseButton @click="handleOpenBatchAdjustDialog" class="ml-2">批量调整</BaseButton>
            <BaseButton @click="handleCancel" class="ml-2">取消</BaseButton>
            <BaseButton
              type="primary"
              @click="handleSubmit"
              :loading="isSubmitting"
              :disabled="
                !selectedProduct ||
                selectedProduct.configured_sale_price === undefined ||
                selectedProduct.configured_sale_price === null
              "
            >
              提交选中产品价格
            </BaseButton>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- Batch Adjust Price Dialog using custom Dialog & Form -->
    <Dialog
      v-model="batchAdjustDialogVisible"
      :title="`批量价格调整 (${selectedCountry?.country_cn || ''} - ${selectedOperatorName || ''})`"
      width="500px"
      max-height="200px"
    >
      <Form
        :schema="batchAdjustFormSchema"
        :is-col="false"
        label-position="right"
        label-width="100px"
        @register="batchAdjustFormRegister"
      />
      <template #footer>
        <BaseButton @click="batchAdjustDialogVisible = false">取消</BaseButton>
        <BaseButton type="primary" @click="handleBatchAdjustDialogConfirm">确定</BaseButton>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick, reactive } from 'vue'
import {
  ElRow,
  ElCol,
  ElCard,
  ElTabs,
  ElTabPane,
  ElMessage,
  ElRadioGroup,
  ElRadioButton,
  ElInputNumber,
  ElFormItem,
  type FormInstance
} from 'element-plus'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { useRoute, useRouter } from 'vue-router'
import { Dialog } from '@/components/Dialog'
import { Form, type FormSchema } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'

import { getCountryListApi, type CountryInfo } from '@/api/credit/country'
import {
  getBotProductPriceConfigApi,
  type ProductPriceInfo as ApiProductPriceInfo,
  type OperatorWithProducts
} from '@/api/credit/product'
import {
  updateBotProductPriceApi,
  batchUpdateBotProductPriceApi,
  type UpdateBotProductPricePayload,
  type BatchUpdateBotProductPricePayload
} from '@/api/credit/botlist'

const route = useRoute()
const router = useRouter()

const botId = ref<string | null>(null)

// State for Country selection
const countries = ref<CountryInfo[]>([])
const selectedCountry = ref<CountryInfo | null>(null) // Store the whole country object
const selectedCountryCode = ref<string>('') // ISO code for styling selected country

// State for Product Type selection
const selectedProductType = ref<number>(1) // 1 for airtime, 2 for package

// Extend ApiProductPriceInfo for UI-specific temporary state
interface ProductUIData extends ApiProductPriceInfo {
  configured_sale_price?: number // For the input field
}
interface OperatorWithUIData extends Omit<OperatorWithProducts, 'products'> {
  products: ProductUIData[]
}

const operatorProductData = ref<OperatorWithUIData[]>([])
const selectedProduct = ref<ProductUIData | null>(null)
const selectedOperatorName = ref<string>('') // Name of the currently selected operator tab

// State for loading indicators
const isLoadingCountries = ref(false)
const isLoadingOperatorsAndProducts = ref(false) // Combined loading state
const isSubmitting = ref(false)

// Batch Adjust Dialog State & Logic using custom components
const batchAdjustDialogVisible = ref(false)
const { formRegister: batchAdjustFormRegister, formMethods: batchAdjustFormMethods } = useForm()

// Define the schema for the batch adjust form
const batchAdjustFormSchema = reactive<FormSchema[]>([
  {
    field: 'type',
    label: '调整方式:',
    component: 'RadioGroup' as const,
    value: 'fixed',
    componentProps: {
      options: [
        { label: '固定金额', value: 1 },
        { label: '按百分比', value: 2 }
      ]
    },
    formItemProps: {
      rules: { required: true, message: '请选择调整方式' }
    }
  },
  {
    field: 'value',
    label: '调整值:',
    component: 'InputNumber' as const,
    value: undefined,
    componentProps: {
      placeholder: '请输入调整值 (可为负数)',
      precision: 2,
      controlsPosition: 'right',
      class: 'w-full'
    },
    formItemProps: {
      rules: [{ required: true, message: '请输入调整值' }]
    }
  }
])

// Computed property to get products of the currently selected operator
const currentOperatorProducts = computed(() => {
  if (!selectedOperatorName.value || operatorProductData.value.length === 0) {
    return []
  }
  const operator = operatorProductData.value.find(
    (op) => op.operator === selectedOperatorName.value
  )
  return operator ? operator.products : []
})

const isBatchUpdating = ref(false) // Add a specific loading state for batch update

async function loadCountries() {
  isLoadingCountries.value = true
  countries.value = []
  try {
    const res = await getCountryListApi()
    countries.value = res.data || []
    if (countries.value.length > 0) {
      // TODO: 默认选中第一个国家并加载其数据
      await selectCountry(countries.value[0])
    }
  } catch (error) {
    console.error('Failed to load countries:', error)
    ElMessage.error('加载国家列表失败')
  } finally {
    isLoadingCountries.value = false
  }
}

async function selectCountry(country: CountryInfo) {
  if (selectedCountry.value?.country_iso === country.country_iso) {
    // If same country is clicked, maybe force reload products for current type
    if (botId.value) {
      await loadOperatorAndProductPrices(botId.value, country.country_en, selectedProductType.value)
    }
    return
  }
  console.log('Selecting country:', country)
  selectedCountry.value = country
  selectedCountryCode.value = country.country_iso

  // Reset downstream selections
  operatorProductData.value = []
  selectedOperatorName.value = ''
  selectedProduct.value = null

  if (botId.value) {
    await loadOperatorAndProductPrices(botId.value, country.country_en, selectedProductType.value)
  }
}

async function handleProductTypeChange(type: number | string | boolean) {
  console.log('Product type changed to:', type)
  selectedProductType.value = type as number
  // Reset selections when type changes
  selectedProduct.value = null

  if (botId.value && selectedCountry.value) {
    await loadOperatorAndProductPrices(
      botId.value,
      selectedCountry.value.country_en,
      selectedProductType.value
    )
  }
}

async function loadOperatorAndProductPrices(
  currentBotId: string,
  countryEnName: string,
  productType: number
) {
  if (!currentBotId || !countryEnName) {
    operatorProductData.value = []
    return
  }
  isLoadingOperatorsAndProducts.value = true
  operatorProductData.value = []
  selectedOperatorName.value = '' // Reset operator tab selection
  selectedProduct.value = null

  try {
    const params = {
      tg_bot_id: parseInt(currentBotId),
      country: countryEnName,
      product_type: productType
    }
    console.log('Loading products with params:', params)
    const res = await getBotProductPriceConfigApi(params) // 使用正确的API名称

    if (res && res.data && res.data.all_operators) {
      // Initialize configured_sale_price for each product
      operatorProductData.value = res.data.all_operators.map((op) => ({
        ...op,
        products: op.products.map((p) => ({
          ...p,
          // 将API返回的sale_price（字符串）转为数字给输入框，如果无效则为undefined
          configured_sale_price:
            p.sale_price && parseFloat(p.sale_price) > 0 ? parseFloat(p.sale_price) : undefined
        }))
      }))
    } else {
      operatorProductData.value = []
    }

    if (operatorProductData.value.length > 0) {
      await nextTick()
      selectedOperatorName.value = operatorProductData.value[0].operator
    } else {
      ElMessage.info('未查询到相关产品数据')
    }
  } catch (error) {
    console.error('Failed to load product prices:', error)
    ElMessage.error('加载产品价格数据失败')
    operatorProductData.value = []
  } finally {
    isLoadingOperatorsAndProducts.value = false
  }
}

function handleOperatorTabChange(tabName: string | number | null) {
  console.log('Operator tab changed to:', tabName)
  selectedOperatorName.value = tabName as string
  selectedProduct.value = null // Reset product selection when operator changes
}

async function selectProduct(product: ProductUIData) {
  console.log('Selecting product:', product)
  selectedProduct.value = product
}

async function handleSubmit() {
  // Ensure botId is not null before using it
  if (!botId.value) {
    ElMessage.error('机器人ID无效，无法提交')
    return
  }
  if (
    !selectedProduct.value ||
    selectedProduct.value.configured_sale_price === undefined ||
    selectedProduct.value.configured_sale_price === null
  ) {
    ElMessage.warning('请确保已选中一个产品，并为其设置了有效的销售价格')
    return
  }
  if (selectedProduct.value.configured_sale_price <= 0) {
    ElMessage.warning('销售价格必须大于0')
    return
  }

  isSubmitting.value = true
  let res: any = null
  try {
    const params: UpdateBotProductPricePayload = {
      tg_bot_id: parseInt(botId.value), // 使用 tg_bot_id 作为字段名，值为组件中的 botId (来自路由)
      products: [
        {
          product_id: selectedProduct.value.product_id,
          sale_price: selectedProduct.value.configured_sale_price
        }
      ]
    }
    console.log('Submitting price config:', params)

    res = await updateBotProductPriceApi(params)

    ElMessage.success(
      `产品 "${selectedProduct.value.product_name}" 的销售价格已更新为 ${selectedProduct.value.configured_sale_price} USDT`
    )

    const opIndex = operatorProductData.value.findIndex(
      (op) => op.operator === selectedOperatorName.value
    )
    if (opIndex !== -1) {
      const prodIndex = operatorProductData.value[opIndex].products.findIndex(
        (p) => p.product_id === selectedProduct.value!.product_id
      )
      if (prodIndex !== -1) {
        operatorProductData.value[opIndex].products[prodIndex].sale_price =
          selectedProduct.value.configured_sale_price!.toString()
      }
    }
  } catch (error: any) {
    console.error('Failed to update price config:', error)
    const message = error?.response?.data?.message || error?.message || '更新价格配置失败'
    ElMessage.error(message)
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  router.back()
}

const handleOpenBatchAdjustDialog = async () => {
  if (!selectedCountry.value || !selectedOperatorName.value) {
    ElMessage.warning('请先选择一个国家和运营商，再进行批量调整。')
    return
  }
  batchAdjustDialogVisible.value = true
  await nextTick()
  try {
    batchAdjustFormMethods.setValues({
      type: 1,
      value: undefined
    })
    const formExpose = await batchAdjustFormMethods.getElFormExpose()
    formExpose?.clearValidate()
  } catch (e) {
    console.error('Error resetting batch adjust form:', e)
  }
}

const handleBatchAdjustDialogConfirm = async () => {
  if (!batchAdjustFormMethods?.getFormData || !batchAdjustFormMethods?.getElFormExpose) {
    console.error('Form methods not available')
    return
  }
  try {
    const elForm = await batchAdjustFormMethods.getElFormExpose()
    await elForm?.validate()

    const formData = await batchAdjustFormMethods.getFormData()

    if (formData.value === undefined || formData.value === null) {
      ElMessage.warning('请输入有效的调整值')
      return
    }

    if (!botId.value || !selectedCountry.value || !selectedOperatorName.value) {
      ElMessage.error('必要参数缺失，无法进行批量调整。')
      return
    }
    const params: BatchUpdateBotProductPricePayload = {
      tg_bot_id: parseInt(botId.value),
      country: selectedCountry.value.country_en,
      operator: selectedOperatorName.value,
      product_type: selectedProductType.value,
      op_type: formData.type,
      amount: formData.value
    }
    console.log('批量调整参数:', params)

    // Call the batch update API
    isBatchUpdating.value = true
    await batchUpdateBotProductPriceApi(params)
    ElMessage.success('批量价格调整成功')
    batchAdjustDialogVisible.value = false

    // Refresh the product list after successful update
    await loadOperatorAndProductPrices(
      botId.value,
      selectedCountry.value.country_en,
      selectedProductType.value
    )
  } catch (error: any) {
    console.log('批量调整表单校验失败或API调用失败', error)
    // Error message can be improved based on actual API error structure
    const message = error?.response?.data?.message || error?.message || '批量调整失败'
    ElMessage.error(message)
  } finally {
    isBatchUpdating.value = false
  }
}

onMounted(() => {
  const idFromRoute = route.params.botId
  if (idFromRoute && typeof idFromRoute === 'string') {
    botId.value = idFromRoute
    loadCountries()
  } else {
    ElMessage.error('无效的机器人ID')
    router.replace({ name: 'BotList' })
  }
})
</script>

<style scoped>
/* 左侧国家列表卡片样式 */
:deep(.country-list-card .el-card__body) {
  max-height: 600px;
  padding: 10px;
  overflow-y: auto;
}

.country-item:hover {
  background-color: #f5f7fa;
}

.amount-grid {
  padding-right: 5px;
}

.amount-card:hover {
  border-color: #a0cfff;
}

.el-input-number--small {
  width: 100%;
}

.el-form-item--small .el-form-item__label {
  margin-bottom: 2px !important;
  line-height: 22px;
}

.el-form-item.mb-0 {
  margin-bottom: 0 !important;
}

.w-full {
  width: 100%;
}
</style>
