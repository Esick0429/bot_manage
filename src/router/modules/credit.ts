import type { RouteRecordRaw } from 'vue-router'
import { Layout } from '@/utils/routerHelper'

let creditRoutes: AppRouteRecordRaw[] = []

if (import.meta.env.VITE_SYSTEM_TYPE === 'Credit') {
  creditRoutes = [
    {
      path: '/home',
      component: Layout,
      redirect: '/home/index',
      name: 'Home',
      meta: {
        title: '首页',
        keepAlive: false
      },
      children: [
        {
          path: 'index',
          component: () => import('@/clientView/home/index.vue'),
          name: 'realHome',
          meta: {
            title: '首页',
            icon: 'ant-design:bank-twotone'
          }
        }
      ]
    },
    {
      path: '/TopupCenter',
      component: Layout,
      name: 'TopupCenter',
      meta: {
        title: '充值中心',
        icon: 'ant-design:account-book-filled',
        keepAlive: false
      },
      children: [
        {
          path: 'WebUserBatchTopup',
          component: () => import('@/clientView/TopupCenter/WebUserBatchTopup.vue'),
          name: 'WebUserBatchTopup',
          meta: {
            title: '批量充值',
            icon: 'ant-design:bold-outlined',
            keepAlive: false
          }
        },
        {
          path: 'UserTopupDataList',
          component: () => import('@/clientView/TopupCenter/UserTopupDataList.vue'),
          name: 'UserTopupDataList',
          meta: {
            title: '充值记录',
            icon: 'ant-design:android-outlined',
            keepAlive: true
          }
        }
      ]
    },
    {
      path: '/AccountCenter',
      component: Layout,
      name: 'AccountCenter',
      meta: {
        title: '账户中心',
        icon: 'ant-design:user-switch-outlined',
        keepAlive: false
      },
      children: [
        {
          path: 'BalanceDetails',
          component: () => import('@/clientView/AccountCenter/BalanceDetails.vue'),
          name: 'BalanceDetails',
          meta: {
            title: '余额明细',
            icon: 'ant-design:align-left-outlined',
            keepAlive: false
          }
        }
      ]
    },
    {
      path: '/bot_manage',
      component: Layout,
      name: 'BotManage',
      redirect: '/bot_manage/bot_list',
      meta: {
        title: '机器人管理',
        icon: 'lucide:bot',
        alwaysShow: true
      },
      children: [
        {
          path: 'bot_list',
          component: () => import('@/clientView/Bot_manage/bot_list/index.vue'),
          name: 'BotList',
          meta: {
            title: '机器人列表'
          }
        },
        {
          path: 'menu_list',
          component: () => import('@/clientView/Bot_manage/menu_list/index.vue'),
          name: 'MenuList',
          meta: {
            title: '菜单列表'
          }
        }
        // {
        //   path: 'reply_list',
        //   component: () => import('@/views/Bot_manage/reply_list/index.vue'),
        //   name: 'ReplyList',
        //   meta: {
        //     title: '关键词回复'
        //   }
        // }
      ]
    }
  ]
} else {
  creditRoutes = []
}

export default creditRoutes
