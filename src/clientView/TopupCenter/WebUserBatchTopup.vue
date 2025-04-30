<template>
  <div>
    <ElRow :gutter="20">
      <!-- Left Column: Country List -->
      <ElCol :span="4">
        <ElCard shadow="never" class="country-list-card" v-loading="isLoadingCountries">
          <template #header>
            <div class="font-bold">请选择充值国家</div>
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
        <ElCard shadow="never" v-loading="isLoadingOperators">
          <!-- Operator Tabs -->
          <div class="mb-4">
            <span class="text-sm font-medium mr-4">请选择运营商</span>
            <span v-if="!operators.length && !isLoadingOperators" class="text-gray-500 text-sm">
              (请先选择国家)
            </span>
            <ElTabs v-model="selectedOperator" v-else class="inline-block">
              <ElTabPane
                v-for="op in operators"
                :key="op.operator"
                :label="op.operator"
                :name="op.operator"
              />
            </ElTabs>
          </div>

          <!-- Top-up Type Tabs -->
          <ElRadioGroup v-model="selectedTopupType" class="mb-4">
            <ElRadioButton label="话费充值" value="airtime" />
            <ElRadioButton label="套餐充值" value="package" />
          </ElRadioGroup>

          <!-- Scrollable Container for Amount Grid -->
          <div style="height: 345px; margin-bottom: 1.5rem; overflow-y: auto">
            <!-- Amount Grid -->
            <div v-if="isLoadingProducts" class="text-center text-gray-500 p-4">
              正在加载充值选项...
            </div>
            <div
              v-else-if="!topupAmounts.length && selectedCountryCode && selectedOperator"
              class="text-center text-gray-500 p-4"
            >
              暂无可用充值选项
            </div>
            <div v-else class="amount-grid grid grid-cols-4 gap-4 p-16px">
              <div
                v-for="item in topupAmounts"
                :key="item.id"
                :class="[
                  'amount-card',
                  'border rounded p-2 text-center cursor-pointer transition',
                  selectedAmount?.id === item.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                    : 'bg-gray-50 border-gray-200'
                ]"
                @click="selectAmount(item)"
              >
                <div class="font-bold text-sm mb-1">{{ item.product_name }}</div>
                <div class="text-xs text-gray-600">售价 {{ item.cost }} 元</div>
              </div>
            </div>
          </div>
          <!-- End Scrollable Container -->

          <!-- Phone Number Input -->
          <div class="mb-4">
            <!-- Display number format hint -->
            <div v-if="selectedCountryNumberFormat" class="text-sm text-gray-600 mb-2">
              {{ selectedCountryNumberFormat }}
            </div>
            <div v-else class="text-sm text-gray-600 mb-2">请先选择国家以查看号码格式提示</div>
            <ElInput
              v-model="phoneNumbers"
              type="textarea"
              :rows="8"
              placeholder="一次最多输入300个号码
一行一个号码
0987654321
0987654321
0987654321"
            />
          </div>

          <!-- Action Buttons -->
          <div>
            <BaseButton type="primary" @click="handleSubmit" :loading="isSubmitting"
              >提交</BaseButton
            >
            <BaseButton @click="handleCancel" class="ml-2">取消</BaseButton>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  ElRow,
  ElCol,
  ElCard,
  ElTabs,
  ElTabPane,
  ElInput,
  ElMessage,
  ElRadioGroup,
  ElRadioButton
} from 'element-plus'
import { BaseButton } from '@/components/Button'
import { useRoute } from 'vue-router'

import { getCountryListApi, type CountryInfo } from '@/api/credit/country'
import { getOperatorListApi, type OperatorInfo } from '@/api/credit/operator'
import { getProductListApi, type ProductInfo } from '@/api/credit/product'
import { submitBatchTopupApi } from '@/api/credit/batch_topup'
import { checkPhone } from '@/hooks/web/useValidator'

interface TopupType {
  label: string
  value: string
  apiType: number
}

const route = useRoute()
const countries = ref<CountryInfo[]>([])
const operators = ref<OperatorInfo[]>([])
const topupAmounts = ref<ProductInfo[]>([])
const topupTypes = ref<TopupType[]>([
  { label: '话费充值', value: 'airtime', apiType: 1 },
  { label: '套餐充值', value: 'package', apiType: 2 }
])
const selectedCountryCode = ref<string>('')
const selectedCountryEn = ref<string>('')
const selectedOperator = ref<string>('')
const selectedTopupType = ref<string>('airtime')
const selectedAmount = ref<ProductInfo | null>(null)
const phoneNumbers = ref<string>('')
const isLoadingCountries = ref(false)
const isLoadingOperators = ref(false)
const isLoadingProducts = ref(false)
const isSubmitting = ref(false)

const selectedCountryNumberFormat = computed(() => {
  const selected = countries.value.find((c) => c.country_iso === selectedCountryCode.value)
  return selected ? selected.number_format : ''
})

async function loadCountries() {
  isLoadingCountries.value = true
  let initialCountryEnValue = ''
  try {
    const res = await getCountryListApi()
    countries.value = res.data || []

    const queryCode = route.query.code
    let initialCountryCode = ''
    let initialCountry: CountryInfo | undefined

    if (queryCode && typeof queryCode === 'string') {
      initialCountry = countries.value.find((c) => c.country_iso === queryCode)
    }
    if (!initialCountry && countries.value.length > 0) {
      initialCountry = countries.value[0]
    }

    if (initialCountry) {
      initialCountryCode = initialCountry.country_iso
      initialCountryEnValue = initialCountry.country_en
      selectedCountryCode.value = initialCountryCode
      selectedCountryEn.value = initialCountryEnValue
      console.log(
        `Initial country selected: ISO=${initialCountryCode}, EN=${initialCountryEnValue}`
      )
    } else {
      console.warn('No country selected initially.')
      operators.value = []
      topupAmounts.value = []
    }
  } catch (error) {
    console.error('Failed to load countries:', error)
    ElMessage.error('加载国家列表失败')
    countries.value = []
  } finally {
    isLoadingCountries.value = false
    if (initialCountryEnValue) {
      await loadOperators(initialCountryEnValue)
    }
  }
}

async function loadOperators(countryEn: string) {
  if (!countryEn) {
    operators.value = []
    selectedOperator.value = ''
    topupAmounts.value = []
    selectedAmount.value = null
    return
  }
  isLoadingOperators.value = true
  operators.value = []
  selectedOperator.value = ''
  topupAmounts.value = []
  selectedAmount.value = null
  try {
    const res = await getOperatorListApi({ country: countryEn })
    operators.value = res.data || []
    if (operators.value.length > 0) {
      selectedOperator.value = operators.value[0].operator
    } else {
      ElMessage.info('该国家/地区暂无可用运营商')
    }
  } catch (error) {
    console.error('Failed to load operators:', error)
    ElMessage.error('加载运营商列表失败')
    operators.value = []
    topupAmounts.value = []
    selectedAmount.value = null
  } finally {
    isLoadingOperators.value = false
  }
}

async function loadProducts(countryEn: string, operatorName: string, topupTypeValue: string) {
  if (!countryEn || !operatorName || !topupTypeValue) {
    topupAmounts.value = []
    return
  }

  const selectedTypeObj = topupTypes.value.find((t) => t.value === topupTypeValue)
  if (!selectedTypeObj) {
    console.error('Invalid topup type selected:', topupTypeValue)
    return
  }

  isLoadingProducts.value = true
  topupAmounts.value = []
  selectedAmount.value = null

  try {
    const params = {
      country: countryEn,
      operator: operatorName,
      type: selectedTypeObj.apiType
    }
    const res = await getProductListApi(params)
    console.log('Raw products data from API:', res.data)
    topupAmounts.value = res.data || []
    if (topupAmounts.value.length === 0) {
      ElMessage.info('该选项下暂无可用充值产品')
    }
  } catch (error) {
    console.error('Failed to load products:', error)
    ElMessage.error('加载产品列表失败')
    topupAmounts.value = []
  } finally {
    isLoadingProducts.value = false
  }
}

onMounted(() => {
  loadCountries()
})

watch(
  [selectedOperator, selectedTopupType],
  ([newOperatorName, newType]) => {
    if (selectedCountryEn.value && newOperatorName) {
      loadProducts(selectedCountryEn.value, newOperatorName, newType)
    }
  },
  { immediate: false }
)

function selectCountry(country: CountryInfo) {
  const isoCode = country.country_iso
  const countryEnValue = country.country_en

  console.log('Selected Country EN:', countryEnValue)

  if (selectedCountryCode.value !== isoCode) {
    selectedCountryCode.value = isoCode
    selectedCountryEn.value = countryEnValue
    loadOperators(countryEnValue)
  }
}

function selectAmount(item: ProductInfo) {
  console.log('Clicked item object:', item)
  selectedAmount.value = item
  console.log(`Selected Product ID: ${item.id}, Name: ${item.product_name}`)
}

async function handleSubmit() {
  if (!selectedCountryEn.value) {
    ElMessage.warning('请选择国家')
    return
  }
  if (!selectedOperator.value) {
    ElMessage.warning('请选择运营商')
    return
  }
  if (!selectedAmount.value) {
    ElMessage.warning('请选择充值金额/套餐')
    return
  }
  const numbers = phoneNumbers.value
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n !== '')
  if (numbers.length === 0) {
    ElMessage.warning('请输入有效的手机号码')
    return
  }
  if (numbers.length > 300) {
    ElMessage.warning('一次最多提交300个号码')
    return
  }

  const currentCountryEn = selectedCountryEn.value
  const invalidNumbers = numbers.filter((num) => !checkPhone(currentCountryEn, num))

  if (invalidNumbers.length > 0) {
    console.warn('Invalid phone numbers found:', invalidNumbers)
    ElMessage.warning(
      `号码 ${invalidNumbers[0]} 格式不符合当前所选国家 (${selectedCountryCode.value || currentCountryEn}) 的规则，请检查。`
    )
    return
  }

  isSubmitting.value = true

  // Construct the payload based on the example
  const payload = {
    id: selectedAmount.value.id,
    phones: numbers
  }

  console.log('Submitting Payload:', payload)

  try {
    // Call the actual API function
    const res = await submitBatchTopupApi(payload)
    console.log('res', res)
    if (res.code === '000000') {
      ElMessage.success('下单成功')
    } else {
      ElMessage.error('下单失败')
    }
    handleCancel()
  } catch (error) {
    console.error('Submission failed:', error)
    // Attempt to get more specific error message if available
    const errorMsg = (error as any)?.response?.data?.message || '提交失败，请稍后重试'
    ElMessage.error(errorMsg)
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  selectedAmount.value = null
  phoneNumbers.value = ''
}
</script>

<style lang="less" scoped>
@import url('@/assets/css/ProjectCard.css');

.batch-topup-container {
  // Container styles if needed
}

.country-list-card {
  max-height: calc(100vh - 150px);
  min-height: 400px;
  overflow-y: auto;

  :deep(.el-card__body) {
    padding: 10px;
  }

  :deep(.el-card__header) {
    padding: 10px 15px;
    font-size: 14px;
  }
}

.country-item {
  &:hover {
    background-color: #f0f0f0;
  }
}

.amount-grid {
  min-height: 100px;
}

.amount-card {
  display: flex;
  min-height: 70px;
  flex-direction: column;
  justify-content: center;

  &:hover {
    border-color: #a0aec0;
  }
}

:deep(.el-tabs__header) {
  margin-bottom: 15px;
}

:deep(.el-tabs__nav-wrap::after) {
  // background-color: transparent;
}

.imr-flag {
  display: inline-block;
  width: 35px;
  height: 35px;
  vertical-align: middle;
  background-size: cover;
  flex-shrink: 0;
}
</style>
