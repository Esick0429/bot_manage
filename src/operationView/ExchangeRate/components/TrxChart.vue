<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <h3>TRX 交易量趋势图</h3>
      <div class="chart-filters">
        <div class="quick-filters">
          <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
            <el-radio-button label="1month">近一个月</el-radio-button>
            <el-radio-button label="3months">近三个月</el-radio-button>
            <el-radio-button label="1year">近一年</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
          </el-radio-group>
        </div>
        <div class="date-picker">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            :clearable="false"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            :disabledDate="disableFutureDates"
            @change="handleDateRangeChange"
          />
        </div>
      </div>
    </div>
    <ElCard shadow="hover">
      <div class="current-price-panel" v-if="currentPrice">
        <div class="price-display">
          <div class="price-main">
            <span class="price-label">当前价格</span>
            <span class="price-value" :class="{ 'price-flash': priceFlashing }">
              ${{ currentPrice.toFixed(4) }}
            </span>
            <div class="price-update-time">更新时间: {{ formatUpdateTime(lastUpdateTime) }}</div>
          </div>
          <div class="price-compare">
            <span :class="['price-change', priceChangeClass]">
              <i
                :class="
                  priceChangeClass === 'price-up'
                    ? 'el-icon-caret-top'
                    : priceChangeClass === 'price-down'
                      ? 'el-icon-caret-bottom'
                      : 'el-icon-minus'
                "
              ></i>
              {{ priceChangePercent > 0 ? '+' : '' }}{{ priceChangePercent.toFixed(2) }}%
              <!-- <Icon icon="mdi:refresh"  @click="fetchCurrentPrice"/> -->
            </span>
            <div class="price-vs-yesterday" v-if="yesterdayClosePrice !== null"
              >较昨日收盘: ${{ yesterdayClosePrice.toFixed(4) }}</div
            >
          </div>
        </div>
      </div>
      <ElSkeleton :loading="isLoading" animated :rows="4">
        <div v-if="!allChartData || (allChartData.length === 0 && !isLoading)" class="no-data">
          <el-empty description="暂无数据" />
        </div>
        <Echart
          v-else
          :options="chartOptions"
          :height="350"
          ref="chartRef"
          @init="handleChartInit"
        />
      </ElSkeleton>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, PropType, computed, onMounted, onUnmounted } from 'vue'
import { Echart } from '@/components/Echart'
import {
  ElCard,
  ElSkeleton,
  ElRadioGroup,
  ElRadioButton,
  ElDatePicker,
  ElButton
} from 'element-plus'
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts/core'
import { DataZoomComponent } from 'echarts/components'
import axios from 'axios'
import { debounce } from 'lodash-es'

// 注册DataZoom组件
echarts.use([DataZoomComponent])

// 定义图表实例类型
type EChartsInstance = echarts.ECharts

interface TrxVolumeData {
  volume: number
  timestamp: number
  time?: number
  date: string
  open: number | string
  high: number | string
  low: number | string
  close: number | string
  [key: string]: any
}

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

// 组件自身的加载状态
const localLoading = ref(false)

// 计算当前加载状态（组合外部和内部的加载状态）
const isLoading = computed(() => {
  return props.loading || localLoading.value
})

// 时间范围选择
const timeRange = ref('1month') // 默认显示近一个月数据

// 日期范围选择器的值
const dateRange = ref<[Date, Date]>([
  new Date(new Date().setMonth(new Date().getMonth() - 1)), // 默认一个月前
  new Date() // 当前日期
])

// 存储原始数据和筛选后的数据
const allChartData = ref<TrxVolumeData[]>([])
const chartData = ref<TrxVolumeData[]>([])

// 添加当前价格相关的状态
const currentPrice = ref<number | null>(null)
const yesterdayClosePrice = ref<number | null>(null)
const priceChangePercent = ref<number>(0)
const lastUpdateTime = ref<number>(0)
const isRefreshingPrice = ref<boolean>(false)
const priceFlashing = ref<boolean>(false)
let pricePollingInterval: number | null = null
let previousPrice: number | null = null

// 计算价格变化的样式类
const priceChangeClass = computed(() => {
  if (priceChangePercent.value > 0) return 'price-up'
  if (priceChangePercent.value < 0) return 'price-down'
  return 'price-unchanged'
})

// 格式化更新时间
const formatUpdateTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 时间处理工具函数
const timeUtils = {
  // 获取昨天的日期对象
  getYesterday() {
    // 当前时间
    const now = new Date()

    // 创建昨天的日期对象
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    console.log('昨天:', yesterday.toLocaleString())

    return yesterday
  },

  // 创建日期范围（起始时间戳和结束时间戳）
  createDateRange(startDate: Date, endDate: Date) {
    // 使用本地时间
    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      0,
      0,
      0 // 00:00:00
    )

    const end = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23,
      59,
      59,
      999 // 23:59:59.999
    )

    const startTimestamp = start.getTime()
    const endTimestamp = end.getTime()

    console.log(
      `创建日期范围: ${new Date(startTimestamp).toLocaleString()} 至 ${new Date(endTimestamp).toLocaleString()}`
    )

    return {
      startTimestamp,
      endTimestamp
    }
  },

  // 根据特定时间范围创建时间戳范围
  getRangeByType(rangeType: string) {
    const today = new Date()
    let startDate: Date

    if (rangeType === '1month') {
      startDate = new Date(today)
      startDate.setMonth(startDate.getMonth() - 1)
    } else if (rangeType === '3months') {
      startDate = new Date(today)
      startDate.setMonth(startDate.getMonth() - 3)
    } else if (rangeType === '1year') {
      startDate = new Date(today)
      startDate.setFullYear(startDate.getFullYear() - 1)
    } else if (rangeType === 'all') {
      // TRX 发行时间附近
      startDate = new Date(1507564800000)
    } else {
      // 默认一个月
      startDate = new Date(today)
      startDate.setMonth(startDate.getMonth() - 1)
    }

    return this.createDateRange(startDate, today)
  },

  // 检查日期是否不可选（今天或之后的日期）
  isDateDisabled(date: Date) {
    const yesterday = this.getYesterday()
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    // 禁用今天及以后的日期
    return date >= yesterdayEnd
  },

  // 获取日期的简单格式 YYYY-MM-DD
  getSimpleDate(timestamp: number) {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
}

// 处理时间范围选择
const handleTimeRangeChange = (value: string) => {
  console.log('handleTimeRangeChange', value)
  if (value === 'custom' && dateRange.value && dateRange.value.length === 2) {
    // 自定义时间范围，使用dateRange的值
    const { startTimestamp, endTimestamp } = timeUtils.createDateRange(
      new Date(dateRange.value[0]),
      new Date(dateRange.value[1])
    )
    console.log('startTimestamp', startTimestamp)
    console.log('endTimestamp', endTimestamp)
    // 过滤数据并调整dataZoom位置
    filterDataByTimeRange(startTimestamp, endTimestamp)
    return
  }

  // 使用预设的时间范围
  const { startTimestamp, endTimestamp } = timeUtils.getRangeByType(value)
  console.log('startTimestamp', startTimestamp)
  console.log('endTimestamp', endTimestamp)
  // 更新日期选择器的值
  dateRange.value = [new Date(startTimestamp), timeUtils.getYesterday()]

  // 过滤数据并调整dataZoom位置
  filterDataByTimeRange(startTimestamp, endTimestamp)
}

// 处理日期范围变化
const handleDateRangeChange = (value: [Date, Date]) => {
  if (!value || value.length !== 2) return
  console.log('handleDateRangeChange', value)
  // 设置为自定义模式
  timeRange.value = 'custom'

  // 创建日期范围
  const { startTimestamp, endTimestamp } = timeUtils.createDateRange(
    new Date(value[0]),
    new Date(value[1])
  )
  console.log('startTimestamp', startTimestamp)
  console.log('endTimestamp', endTimestamp)
  // 过滤数据并调整dataZoom位置
  filterDataByTimeRange(startTimestamp + 32 * 60 * 60 * 1000, endTimestamp + 32 * 60 * 60 * 1000)
}

// 数据处理函数 - 确保数据格式一致
const processApiData = (data: any[]) => {
  // 处理数据，确保所有字段一致
  return data.map((item) => ({
    volume: item.volume || 0,
    timestamp: item.timestamp || item.time || 0,
    time: item.time || item.timestamp || 0,
    date: item.date || '',
    open: item.open || 0,
    high: item.high || 0,
    low: item.low || 0,
    close: item.close || 0
  }))
}

// 根据时间范围过滤数据并更新图表
const filterDataByTimeRange = (startTimestamp: number, endTimestamp: number) => {
  console.log(
    `过滤数据，时间范围: ${new Date(startTimestamp).toLocaleString()} 至 ${new Date(endTimestamp).toLocaleString()}`
  )

  if (!allChartData.value || allChartData.value.length === 0) {
    console.warn('没有可用的历史数据')
    return
  }

  // 找到时间范围在全部数据中的索引位置
  const startIndex = allChartData.value.findIndex((item) => {
    const itemTimestamp = item.time || item.timestamp
    return itemTimestamp >= startTimestamp
  })

  const endIndex = allChartData.value.findIndex((item) => {
    const itemTimestamp = item.time || item.timestamp
    return itemTimestamp > endTimestamp
  })

  // 计算在全部数据中的百分比位置
  let startPercent = 0
  let endPercent = 100

  if (startIndex !== -1) {
    startPercent = (startIndex / allChartData.value.length) * 100
  }

  if (endIndex !== -1) {
    endPercent = (endIndex / allChartData.value.length) * 100
  } else {
    endPercent = 100
  }

  console.log(`调整dataZoom位置: ${startPercent.toFixed(2)}% - ${endPercent.toFixed(2)}%`)

  // 如果图表已初始化，只调整dataZoom位置
  if (chartInstance.value) {
    // 调整数据缩放区域
    chartInstance.value.dispatchAction({
      type: 'dataZoom',
      start: startPercent,
      end: endPercent
    })
  }
}

// 获取所有历史数据
const fetchAllData = async () => {
  localLoading.value = true
  // 在请求开始前设置为空数组
  allChartData.value = []

  try {
    // 获取从TRX发行至今的所有数据
    const trxLaunchDate = new Date(1507564800000) // TRX发行时间附近
    const today = new Date()

    const startTimestamp = trxLaunchDate.getTime()
    const endTimestamp = today.getTime()

    console.log('获取TRX全部历史数据...')

    // 发起API请求，获取所有历史数据
    const { data } = await axios.get('https://apilist.tronscanapi.com/api/trx/volume', {
      params: {
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
        limit: 2700, // 足够获取全部历史数据
        source: 'coinmarketcap'
      }
    })

    // 确保data和data.data存在并且是数组
    if (data && data.data && Array.isArray(data.data)) {
      // 如果数据不为空，处理数据
      if (data.data.length > 0) {
        // 处理所有历史数据
        const processedData = processApiData(data.data)

        // 按时间升序排序
        processedData.sort((a, b) => (a.time || 0) - (b.time || 0))

        // 保存所有历史数据
        allChartData.value = processedData
        console.log(`成功获取${processedData.length}条TRX历史数据`)

        // 初始化图表并设置默认时间范围的dataZoom位置
        if (chartInstance.value) {
          chartInstance.value.setOption(chartOptions.value)

          // 根据当前选择的时间范围调整dataZoom位置
          const { startTimestamp, endTimestamp } = timeUtils.getRangeByType(timeRange.value)
          filterDataByTimeRange(startTimestamp, endTimestamp)
        }

        // 更新昨日收盘价
        updateYesterdayClosePrice()
      } else {
        console.warn('API返回的数据为空')
        allChartData.value = []
      }
    } else {
      console.error('API返回的数据格式不正确')
      allChartData.value = []
    }
  } catch (error) {
    console.error('获取TRX历史数据失败:', error)
    allChartData.value = []
  } finally {
    localLoading.value = false
  }
}

// 加载所有图表数据
const loadAllData = async () => {
  try {
    localLoading.value = true
    console.log('开始加载图表数据...')

    // 获取所有历史数据
    await fetchAllData()

    // 如果图表已经初始化，则更新图表
    if (chartInstance.value) {
      // 应用完整的图表配置
      chartInstance.value.setOption(chartOptions.value)

      console.log('图表数据已更新并渲染')
    }
  } catch (error) {
    console.error('加载图表数据失败:', error)
  } finally {
    localLoading.value = false
  }
}

// 闪烁动画
const flashPrice = () => {
  if (!previousPrice || !currentPrice.value) return

  // 价格有变化才闪烁
  if (previousPrice !== currentPrice.value) {
    priceFlashing.value = true

    // 1.5秒后停止闪烁
    setTimeout(() => {
      priceFlashing.value = false
    }, 1500)
  }
}

// 获取当前TRX价格
const fetchCurrentPrice = async () => {
  isRefreshingPrice.value = true

  try {
    // 保存之前的价格，用于比较变化
    previousPrice = currentPrice.value

    const response = await axios.get('https://apilist.tronscanapi.com/api/token/price', {
      params: {
        token: 'trx'
      }
    })

    if (response.data && response.data.price_in_usd) {
      currentPrice.value = parseFloat(response.data.price_in_usd)
      lastUpdateTime.value = Date.now()

      // 如果已有昨日收盘价，计算涨跌幅
      if (yesterdayClosePrice.value) {
        calculatePriceChange()
      } else {
        // 否则获取昨日收盘价
        fetchYesterdayClosePrice()
      }

      // 价格更新后触发闪烁效果
      flashPrice()

      console.log('当前TRX价格更新:', currentPrice.value, '之前价格:', previousPrice)
    }
  } catch (error) {
    console.error('获取当前TRX价格失败:', error)
  } finally {
    isRefreshingPrice.value = false
  }
}

// 更新昨日收盘价并重新计算涨跌幅
const updateYesterdayClosePrice = () => {
  // 从历史数据中直接获取最后一条数据的收盘价作为昨日收盘价
  if (allChartData.value && allChartData.value.length > 0) {
    // 使用最后一条数据
    const latestData = allChartData.value[allChartData.value.length - 1]
    const closePrice =
      typeof latestData.close === 'string' ? parseFloat(latestData.close) : latestData.close || 0

    yesterdayClosePrice.value = closePrice
    console.log('使用最新历史数据作为昨日收盘价:', yesterdayClosePrice.value)
  }

  // 如果当前价格已有值，则重新计算涨跌幅
  if (currentPrice.value !== null) {
    calculatePriceChange()
  }
}

// 修改获取昨日收盘价函数，简化逻辑
const fetchYesterdayClosePrice = async () => {
  if (allChartData.value && allChartData.value.length > 0) {
    // 如果已有历史数据，直接使用最后一条数据的收盘价
    updateYesterdayClosePrice()
    return
  }

  // 如果当前价格已有值，重新计算涨跌幅
  if (currentPrice.value !== null) {
    calculatePriceChange()
  }
}

// 计算价格变化百分比
const calculatePriceChange = () => {
  if (
    currentPrice.value !== null &&
    yesterdayClosePrice.value !== null &&
    yesterdayClosePrice.value > 0
  ) {
    priceChangePercent.value =
      ((currentPrice.value - yesterdayClosePrice.value) / yesterdayClosePrice.value) * 100
  }
}

// 启动价格轮询
const startPricePolling = () => {
  fetchCurrentPrice()

  pricePollingInterval = window.setInterval(() => {
    fetchCurrentPrice()
  }, 60 * 1000)
}

// 停止价格轮询
const stopPricePolling = () => {
  if (pricePollingInterval !== null) {
    clearInterval(pricePollingInterval)
    pricePollingInterval = null
  }
}

// 格式化价格
const formatPrice = (price: number | string) => {
  if (!price) return '-'
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(4)
}

// 提取的日期数据
const dates = computed(() => {
  if (!allChartData.value || allChartData.value.length === 0) return []

  return allChartData.value.map((item) => {
    // 从时间戳创建日期 - 注意API时间戳是当天的结束时间
    // 确保time是数字
    const timeValue = typeof item.time === 'number' ? item.time : 0
    const date = new Date(timeValue)

    // 使用本地日期格式化
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  })
})

// 提取的价格数据
const closePrices = computed(() => {
  if (!allChartData.value || allChartData.value.length === 0) return []

  return allChartData.value.map((item) => {
    return typeof item.close === 'string' ? parseFloat(item.close) : item.close || 0
  })
})

// 计算默认的区域选择范围
const calculateDefaultZoomRange = computed(() => {
  if (!allChartData.value || allChartData.value.length <= 15) {
    // 数据少于15条，显示全部
    return { start: 0, end: 100 }
  } else if (allChartData.value.length <= 30) {
    // 数据少于30条，显示全部
    return { start: 0, end: 100 }
  } else if (allChartData.value.length <= 60) {
    // 数据在30-60条之间，显示最近的75%
    return { start: 25, end: 100 }
  } else {
    // 数据较多，显示最近的50%
    return { start: 80, end: 100 }
  }
})

// 初始化图表选项
const chartOptions = computed<EChartsOption>(() => {
  if (!allChartData.value || allChartData.value.length === 0) {
    return {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center'
      }
    } as EChartsOption
  }

  const zoomRange = calculateDefaultZoomRange.value

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      show: true,
      formatter: function (params: any) {
        if (!params || !params.length) return ''

        const dataIndex = params[0].dataIndex
        if (dataIndex === undefined || !allChartData.value) return ''

        if (dataIndex >= allChartData.value.length) return ''

        const data = allChartData.value[dataIndex]
        if (!data) return ''

        const timestamp = data.timestamp || data.time || 0
        const dateObj = new Date(timestamp)
        const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`

        const closePrice = typeof data.close === 'string' ? parseFloat(data.close) : data.close || 0

        return `<div style="padding:10px;font-size:14px;">
                  <div style="font-weight:bold;color:#ff5200;margin-bottom:5px;">${formattedDate}</div>
                  <div>收盘价: $${formatPrice(data.close)}</div>
                </div>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '13%', // 增加底部空间以容纳区域选择器
      containLabel: true
    },
    // 添加dataZoom组件，实现区域选择功能
    dataZoom: [
      {
        type: 'slider', // 滑动条型数据区域缩放组件
        show: true,
        xAxisIndex: [0],
        start: zoomRange.start,
        end: zoomRange.end,
        height: 30,
        bottom: 10,
        borderColor: 'rgba(255, 82, 0, 0.2)',
        dataBackground: {
          lineStyle: {
            color: '#ff5200',
            opacity: 0.5
          },
          areaStyle: {
            color: 'rgba(255, 82, 0, 0.2)'
          }
        },
        fillerColor: 'rgba(255, 82, 0, 0.1)',
        handleStyle: {
          color: '#ff5200',
          borderColor: '#ff5200'
        },
        textStyle: {
          color: '#666'
        },
        brushSelect: true, // 允许框选
        emphasis: {
          handleStyle: {
            borderWidth: 2,
            color: '#ff7a4d'
          }
        }
      },
      {
        type: 'inside', // 内置型数据区域缩放组件（通过鼠标滚轮或触摸板）
        xAxisIndex: [0],
        start: zoomRange.start,
        end: zoomRange.end,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true
      }
    ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates.value,
      axisLabel: {
        rotate: 45,
        interval: 'auto',
        formatter: function (value: string) {
          // 简化显示，只保留月-日
          const parts = value.split('-')
          if (parts.length === 3) {
            return `${parts[1]}-${parts[2]}`
          }
          return value
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function (value: number) {
          return formatPrice(value)
        }
      },
      scale: true, // 设置成true可以使y轴自适应数据范围
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '收盘价',
        type: 'line',
        smooth: true, // 设置为平滑的曲线
        symbol: 'circle',
        symbolSize: 5,
        data: closePrices.value,
        itemStyle: {
          color: '#ff5200'
        },
        lineStyle: {
          width: 1.5, // 稍微加粗线条
          color: '#ff5200',
          type: 'solid'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 82, 0, 0.3)' },
              { offset: 1, color: 'rgba(255, 82, 0, 0.05)' }
            ]
          }
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 40,
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' }
          ]
        },
        animationDuration: 2000,
        animationEasing: 'cubicInOut'
      }
    ]
  } as EChartsOption
})

// 添加图表实例引用
const chartRef = ref(null)
const chartInstance = ref<EChartsInstance | null>(null)

// 添加handleChartInit函数
const handleChartInit = (chart: any) => {
  console.log('图表已初始化')
  chartInstance.value = chart

  // 如果数据已加载，则设置初始视图
  if (allChartData.value && allChartData.value.length > 0) {
    // 完整设置图表选项
    chart.setOption(chartOptions.value, true)

    // 根据当前选择的时间范围调整dataZoom位置
    const { startTimestamp, endTimestamp } = timeUtils.getRangeByType(timeRange.value)
    filterDataByTimeRange(startTimestamp, endTimestamp)

    // 添加dataZoom事件监听器
    chart.on('datazoom', function () {
      console.log('数据缩放事件被触发')
      // 延迟一点时间，等待缩放完成
      setTimeout(() => {
        // 确保tooltip仍然可用
        const tooltipConfig = {
          trigger: 'axis',
          show: true,
          axisPointer: {
            type: 'cross'
          }
        }
        // 重新设置tooltip
        chart.setOption(
          {
            tooltip: tooltipConfig
          },
          false
        )
      }, 100)
    })
  }
}

// 禁用今天和未来日期，只允许选择今天之前的日期
const disableFutureDates = (time: Date) => {
  return timeUtils.isDateDisabled(time)
}

// 初始化
onMounted(async () => {
  console.log('TrxChart组件已挂载，准备加载数据...')

  // 初始加载所有数据
  await loadAllData()

  // 启动价格轮询
  startPricePolling()

  // 监听窗口大小变化，自动调整图表大小
  window.addEventListener('resize', () => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  })
})

// 在组件卸载时清理资源
onUnmounted(() => {
  // 停止价格轮询
  stopPricePolling()

  // 移除窗口大小变化监听
  window.removeEventListener('resize', () => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  })

  // 释放图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 18px;
  margin: 0;
  color: #333;
  margin-bottom: 12px;
}

.chart-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.quick-filters {
  flex: 1;
}

.date-picker {
  min-width: 300px;
}

@media (max-width: 768px) {
  .chart-filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .date-picker {
    width: 100%;
  }
}

.current-price-panel {
  width: 20%;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #ff5200;
}

.price-display {
  display: flex;
  align-items: center;
  gap: 20px;
}

.price-main {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.price-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  transition: all 0.5s;
}

.price-flash {
  animation: priceFlash 1.5s ease;
}

@keyframes priceFlash {
  0% {
    color: #333;
    background-color: transparent;
  }
  30% {
    color: #fff;
    background-color: #ff5200;
    padding: 2px 8px;
    border-radius: 4px;
  }
  100% {
    color: #333;
    background-color: transparent;
  }
}

.price-compare {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-change {
  font-size: 16px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 4px;
  justify-content: center;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.price-vs-yesterday {
  font-size: 12px;
  color: #666;
}

.price-up {
  color: #41b883;
  background-color: rgba(65, 184, 131, 0.1);
}

.price-down {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
}

.price-unchanged {
  color: #7f8c8d;
  background-color: rgba(127, 140, 141, 0.1);
}

.price-update {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.price-update-time {
  font-size: 12px;
  color: #999;
}

.refresh-btn {
  font-size: 12px;
  color: #666;
  padding: 2px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.refresh-btn:hover {
  color: #ff5200;
}

@media (max-width: 768px) {
  .current-price-panel {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .price-update {
    align-items: flex-start;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
}

.chart-controls {
  margin: 10px 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.refresh-chart-btn,
.fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

.fullscreen {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999;
  border-radius: 0;
  margin: 0;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.98);
  overflow: auto;
}
</style>
