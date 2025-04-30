<template>
  <div class="home-container">
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold">首页</span>
        </div>
      </template>
      <div class="p-5">
        <!-- 顶部用户信息区域 -->
        <div class="flex items-center space-x-4 mb-6">
          <!-- Avatar: 使用导入的 avatarUrl -->
          <ElAvatar :size="50" :src="avatarUrl" />
          <!-- User Info -->
          <div class="flex flex-col items-start space-y-1">
            <span class="text-base font-bold">{{ username }}</span>
            <div class="flex items-center space-x-2">
              <span class="text-red-600 text-2xl font-bold"
                >{{
                  Number(usdt_mount) ? Number(usdt_mount).toLocaleString('en-US') : usdt_mount
                }}
                USDT</span
              >
              <BaseButton type="primary" size="small" @click="openRechargeDialog">充值</BaseButton>
            </div>
          </div>
        </div>

        <!-- 主要内容区域：快捷充值 和 快捷导航 并排 -->
        <ElRow :gutter="20" class="mb-6">
          <!-- 快捷充值区域 -->
          <ElCol :span="16">
            <ElCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <span class="text-lg font-bold">快捷充值</span>
                  <ElLink type="primary" @click="goToTopupCenter">更多</ElLink>
                </div>
              </template>
              <div>
                <ElRow :gutter="16">
                  <!-- Loop through static data -->
                  <ElCol v-for="item in quickTopupList" :key="item.code" :span="8" class="mb-4">
                    <ElCard
                      class="quick-card cursor-pointer hover:shadow-lg transition"
                      @click="goToBatchTopup(item)"
                      shadow="hover"
                      body-style="padding: 16px;"
                    >
                      <div class="flex items-center mb-2">
                        <!-- Use item.code for flag -->
                        <div
                          :class="['imr-flag', 'imr-flag-' + item.code.toUpperCase(), 'mr-2']"
                        ></div>
                        <!-- Use item.country for name -->
                        <span class="font-bold text-base">{{ item.country }}</span>
                      </div>
                      <!-- Display item.operators -->
                      <div class="text-gray-500 text-sm mb-1 truncate">{{ item.operators }}</div>
                      <!-- Display item.countryEn -->
                      <div class="text-xs text-gray-400">{{ item.countryEn }}</div>
                    </ElCard>
                  </ElCol>
                </ElRow>
              </div>
            </ElCard>
          </ElCol>

          <!-- 快捷导航区域 -->
          <ElCol :span="8">
            <ElCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <span class="text-lg font-bold">快捷导航</span>
                </div>
              </template>
              <div>
                <ElRow :gutter="10" class="nav-grid">
                  <ElCol v-for="nav in quickNavList" :key="nav.name" :span="12">
                    <div
                      class="nav-item flex items-center justify-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-100 transition mb-2"
                      @click="navigateTo(nav)"
                    >
                      <!-- Use the custom Icon component -->
                      <Icon :icon="nav.icon" class="mr-2 text-lg" />
                      <span>{{ nav.name }}</span>
                    </div>
                  </ElCol>
                </ElRow>
              </div>
            </ElCard>
          </ElCol>
        </ElRow>

        <!-- 余额变动区域 -->
        <ElCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold">余额变动</span>
              <ElLink type="primary" @click="goToBalanceDetails">更多</ElLink>
            </div>
          </template>
          <div>
            <!-- Use the custom Table component -->
            <Table
              :columns="balanceTableColumns"
              :data="balanceChangeList"
              :showPagination="false"
              :loading="loadingBalance"
              :border="false"
              stripe
              style="width: 100%"
            />
          </div>
        </ElCard>
      </div>
    </ElCard>

    <!-- Use Custom Recharge Dialog -->
    <Dialog v-model="rechargeDialogVisible" title="付款" width="400px">
      <div class="text-center">
        <!-- QR Code Section -->
        <div class="p-4 border rounded-lg inline-block bg-white shadow mb-4">
          <img :src="qrCodeUrl" alt="QR Code" class="w-48 h-48 mx-auto block" />
          <div class="mt-2 text-sm flex items-center justify-center">
            <img
              src="https://cryptologos.cc/logos/tether-usdt-logo.png?v=032"
              alt="USDT"
              class="w-5 h-5 mr-1"
            />
            <!-- Example USDT Logo -->
            <span>泰达币 (TRC20) USDT</span>
          </div>
        </div>

        <!-- Amount Section -->
        <div class="mb-4">
          <div class="text-lg font-bold">金额 {{ rechargeAmount }} {{ rechargeCurrency }}</div>
          <div class="text-xs text-gray-500">(也可以转大于 1U 的任意金额)</div>
        </div>

        <!-- Address Section -->
        <div class="mb-4">
          <div class="text-sm text-gray-600 mb-1">地址</div>
          <div class="text-sm font-mono break-all mb-2">{{ rechargeAddress }}</div>
          <BaseButton type="info" plain size="small" @click="copyAddress">复制地址</BaseButton>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <BaseButton @click="rechargeDialogVisible = false">取消</BaseButton>
          <BaseButton type="primary" @click="confirmPayment">确定</BaseButton>
          <!-- Define confirmPayment if needed -->
        </span>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// 确保按需引入所有用到的 Element Plus 组件
import { ElCard, ElLink, ElAvatar, ElRow, ElCol, ElMessage } from 'element-plus'
// 正确导入图片资源
import avatarImage from '@/assets/imgs/credit_avatar.jpg' // 使用 @ 别名
// 1. Import the flag sprite sheet (May not be needed if CSS handles the background-image URL correctly)
// import flagSprite from '@/assets/imgs/all_country.png'
// 1. Import the custom Icon component
import Icon from '@/components/Icon/src/Icon.vue'
// Import the correct CSS file containing the flag rules
// REMOVED: import '@/assets/css/ProjectCard.css'
// 1. Import the custom Table component
import Table from '@/components/Table/src/Table.vue'
// 1. Import the custom Dialog component
import Dialog from '@/components/Dialog/src/Dialog.vue'
// 1. Import BaseButton
import { BaseButton } from '@/components/Button'
// 2. Import useClipboard hook
import { useClipboard } from '@/hooks/web/useClipboard'
// 导入用户详情API
import { getUserDetailApi } from '@/api/credit/home' // 假设 API 文件路径
// Import Country List API and Type
// import { getCountryListApi, type CountryInfo } from '@/api/credit/country'

const username = ref('Loading...') // 设置初始加载状态
const usdt_mount = ref('Loading...') // 设置初始加载状态
// 将导入的图片路径赋值给 ref
const avatarUrl = ref(avatarImage)
const loadingBalance = ref(false) // Loading state for the usdt_mount table
// const isLoadingQuickTopup = ref(false) // Loading state for quick topup

// Define structure for static quick topup list item (matching the image)
interface QuickTopupItem {
  country: string
  operators: string
  countryEn: string
  code: string // Country ISO code (e.g., 'TH')
}

// Restore static quickTopupList with data matching the image
const quickTopupList = ref<QuickTopupItem[]>([
  {
    country: '泰国',
    operators: 'ais, truemove, dtac, mycat, penguin',
    countryEn: 'Thailand',
    code: 'TH'
  },
  {
    country: '缅甸',
    operators: 'MPT, telenor, Ooredoo, mytel, MecTel',
    countryEn: 'Myanmar',
    code: 'MM'
  },
  {
    country: '美国',
    operators: 'Lycatmobile, T-mobile, ultra 橙色卡',
    countryEn: 'UnitedStates',
    code: 'US'
  },
  {
    country: '马来西亚',
    operators: 'HOTLINK, umobile, digi, celcom',
    countryEn: 'Malaysia',
    code: 'MY'
  },
  { country: '菲律宾', operators: 'Globe, sun, Smart', countryEn: 'Philippines', code: 'PH' },
  {
    country: '印度尼西亚',
    operators: 'XL, THREE, TELKOMSEL, SMARTFREN, INDOSAT, AXIS',
    countryEn: 'Indonesia',
    code: 'ID'
  }
])

// Define an interface for NavItem for better type safety
interface NavItem {
  name: string
  routeName?: string
  path?: string
  icon: string
}

// 3. Update quickNavList to use routeName where applicable
const quickNavList = ref<NavItem[]>([
  { name: '首页', path: '/home', icon: 'ant-design:home-outlined' }, // Keep path for root /home
  { name: '批量充值', routeName: 'WebUserBatchTopup', icon: 'ant-design:upload-outlined' },
  { name: '批次记录', routeName: 'UserTopupBatchList', icon: 'ant-design:ordered-list-outlined' },
  { name: '充值记录', routeName: 'UserTopupDataList', icon: 'ant-design:profile-outlined' },
  { name: '余额明细', routeName: 'BalanceDetails', icon: 'ant-design:dollar-circle-outlined' },
  { name: '价格设置', path: '/PriceSetting', icon: 'ant-design:setting-outlined' } // Assume /PriceSetting is a valid top-level path
])

// 2. Define columns for the usdt_mount table
const balanceTableColumns = ref([
  { field: 'type', label: '类型' },
  { field: 'time', label: '时间' },
  { field: 'amount', label: '变动金额' },
  { field: 'after', label: '变动后余额' }
])

// 3. Define data for the usdt_mount table (use mock data for now)
const balanceChangeList = ref([
  { type: '充值消费', time: '2025-04-28 14:08:37', amount: '-108.75', after: '9898.91' },
  { type: '充值消费', time: '2025-04-28 14:08:37', amount: '-108.75', after: '10007.66' },
  { type: '充值消费', time: '2025-04-28 14:08:37', amount: '-108.75', after: '10116.41' },
  { type: '账户充值', time: '2025-04-27 10:00:00', amount: '+500.00', after: '10225.16' } // Example
])

const router = useRouter()

// --- Dialog State ---
const rechargeDialogVisible = ref(false)
const qrCodeUrl = ref('') // URL for the QR code image
const rechargeAmount = ref('7.14') // Example amount
const rechargeCurrency = ref('USDT') // Example currency
const rechargeAddress = ref('TWDtoqUfZuEHLFsuppdo6iZmGK7onmT6sd7') // Example address

// 3. Initialize clipboard hook without arguments
const { copy, copied, isSupported } = useClipboard()

function openRechargeDialog() {
  // TODO: Fetch actual QR code, address, amount from API here
  // For now, use mock data and just open the dialog
  qrCodeUrl.value =
    'https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=' +
    encodeURIComponent(rechargeAddress.value) // Generate a sample QR code
  rechargeDialogVisible.value = true
}

async function copyAddress() {
  if (!isSupported) {
    console.error('Clipboard API not supported')
    // You might want to add a fallback or show a message here using ElMessage if kept
    return
  }
  await copy(rechargeAddress.value)
  ElMessage.success('复制成功')
  // Check copied.value if the hook provides feedback
  // if (copied.value) { ElMessage.success('Copied!'); } // Example with ElMessage
}

function confirmPayment() {
  // Handle payment confirmation logic if needed
  console.log('Payment confirmed (Placeholder)')
  rechargeDialogVisible.value = false
}

function onRecharge() {
  openRechargeDialog()
}

// Pass the static item to the function
function goToBatchTopup(item: QuickTopupItem) {
  router.push({
    name: 'WebUserBatchTopup',
    query: { code: item.code } // Pass country ISO code
  })
}

function goToTopupCenter() {
  // Use named route
  router.push({ name: 'WebUserBatchTopup' })
}

function goToBalanceDetails() {
  // Use named route
  router.push({ name: 'BalanceDetails' })
}

// 4. Update navigateTo to handle routeName and path
function navigateTo(navItem: NavItem) {
  if (navItem.routeName) {
    router.push({ name: navItem.routeName })
  } else if (navItem.path) {
    router.push(navItem.path)
  } else {
    console.error('Navigation item has no routeName or path:', navItem)
  }
}

// Remove loadQuickTopupCountries function
// async function loadQuickTopupCountries() { ... }

// 4. Fetch actual data on mount (Example)
onMounted(async () => {
  // Load user details
  try {
    const userRes = await getUserDetailApi()
    if (userRes && userRes.data) {
      username.value = userRes.data.username
      // Correctly use usdt_mount from the API response type
      usdt_mount.value = String(userRes.data.usdt_mount)
    }
  } catch (error) {
    console.error('Failed to fetch user details:', error)
    ElMessage.error('获取用户信息失败')
    username.value = '获取失败'
    usdt_mount.value = '获取失败'
  }

  // Remove call to loadQuickTopupCountries
  // await loadQuickTopupCountries();

  // Load balance changes (placeholder)
  // loadingBalance.value = true;
  try {
    console.log('Fetching balance changes...')
  } catch (error) {
    console.error('Failed to fetch balance changes:', error)
  } finally {
    // loadingBalance.value = false;
  }
})
</script>

<!-- Non-scoped style block for importing global-like CSS rules -->
<style>
@import url('@/assets/css/ProjectCard.css'); /* Corrected path */
</style>

<style lang="less" scoped>
.home-container {
  padding: 20px;
}

.quick-card {
  display: flex;
  min-height: 120px; // 调整最小高度以适应内容
  flex-direction: column;
  justify-content: space-between; // 使内容垂直分布
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-grid .nav-item {
  font-size: 14px;
}
</style>
