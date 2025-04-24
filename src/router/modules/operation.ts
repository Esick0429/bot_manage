import { Layout, getParentLayout } from '@/utils/routerHelper'
// import { useI18n } from '@/hooks/web/useI18n' // Assuming t() is not directly used here, otherwise uncomment

// Rely on global AppRouteRecordRaw type

// const { t } = useI18n() // Assuming t() is not directly used here, otherwise uncomment
let operationRoutes: AppRouteRecordRaw[] = []
if (import.meta.env.VITE_SYSTEM_TYPE === 'Operation') {
  operationRoutes = [
    {
      path: '/data_statistics',
      component: Layout,
      name: 'DataStatistics',
      redirect: '/data_statistics/index',
      meta: {},
      children: [
        {
          path: 'index',
          component: () => import('@/operationView/DataStatistics/Analysis.vue'),
          name: 'Analysis',
          meta: {
            title: '数据统计',
            icon: 'vi-mdi:chart-bar'
          }
        }
      ]
    },
    {
      path: '/exchange_rate',
      component: Layout,
      name: 'ExchangeRate',
      redirect: '/exchange_rate/index',
      meta: {
        title: '实时汇率监听',
        icon: 'vi-mdi:currency-usd'
      },
      children: [
        {
          path: 'index',
          component: () => import('@/operationView/ExchangeRate/index.vue'),
          name: 'ExchangeRateIndex',
          meta: {
            title: '实时汇率监听',
            icon: 'vi-mdi:currency-usd'
          }
        }
      ]
    },
    {
      path: '/operation',
      component: Layout,
      name: 'Operation',
      meta: {
        title: '运营中心',
        icon: 'vi-mdi:view-dashboard',
        alwaysShow: true
      },
      children: [
        {
          path: 'energy_transaction',
          component: () => import('@/operationView/OperationCenter/EnergyTransaction/index.vue'),
          name: 'EnergyTransactionList',
          meta: {
            title: '能量交易订单'
          }
        },
        {
          path: 'flash_exchange',
          component: () => import('@/operationView/OperationCenter/ExchangeTransaction/index.vue'),
          name: 'FlashExchange',
          meta: {
            title: '闪兑明细'
          }
        },
        {
          path: 'custody_details',
          component: () => import('@/operationView/OperationCenter/TrustTransaction/index.vue'),
          name: 'CustodyDetails',
          meta: {
            title: '托管明细'
          }
        }
      ]
    },
    {
      path: '/marketing',
      component: Layout,
      name: 'Marketing',
      meta: {
        title: '营销管理',
        icon: 'vi-mdi:bullhorn',
        alwaysShow: true
      },
      children: [
        {
          path: 'agent_price',
          component: () => import('@/operationView/Marketing/AgentPrice.vue'),
          name: 'AgentPrice',
          meta: {
            title: '代理价格配置'
          }
        },
        {
          path: 'payment',
          component: () => import('@/operationView/Marketing/TrxAddress.vue'),
          name: 'Payment',
          meta: {
            title: '收款配置'
          }
        }
      ]
    },
    {
      path: '/agent',
      component: Layout,
      name: 'Agent',
      meta: {
        title: '代理管理',
        icon: 'vi-mdi:account-group',
        alwaysShow: true
      },
      children: [
        {
          path: 'agent_list',
          component: () => import('@/operationView/Agent/AgentList.vue'),
          name: 'AgentList',
          meta: {
            title: '代理信息'
          }
        },
        {
          path: 'ledger',
          component: () => import('@/operationView/Agent/Ledger.vue'),
          name: 'AgentLedger',
          meta: {
            title: '代理账本'
          }
        },
        {
          path: 'bot_list',
          component: () => import('@/operationView/Agent/BotList.vue'),
          name: 'AgentBotList',
          meta: {
            title: '机器人列表'
          }
        }
      ]
    },
    // 系统管理
    {
      path: '/authorization',
      component: Layout,
      redirect: '/authorization/user',
      name: 'Authorization',
      meta: {
        title: '权限管理',
        icon: 'vi-eos-icons:role-binding',
        alwaysShow: true
      },
      children: [
        {
          path: 'role',
          component: () => import('@/operationView/Authorization/Role/Role.vue'),
          name: 'Role',
          meta: {
            title: '角色管理'
          }
        }
      ]
    },
    {
      path: '/system_config',
      component: Layout,
      name: 'SystemConfig',
      meta: {
        title: '系统配置',
        icon: 'vi-mdi:wrench',
        alwaysShow: true
      },
      children: [
        {
          path: 'resource_pool',
          component: () => import('@/operationView/SystemConfig/ResourcePool.vue'),
          name: 'ResourcePool',
          meta: {
            title: '资源池账户'
          }
        }
      ]
    }
  ]
} else {
  operationRoutes = []
}

export default operationRoutes
