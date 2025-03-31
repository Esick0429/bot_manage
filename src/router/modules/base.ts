import { Layout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'

// Rely on global AppRouteRecordRaw type

const { t } = useI18n()

const baseRoutes: AppRouteRecordRaw[] = [
  // Note: Root route ('/') is kept in index.ts
  {
    path: '/redirect',
    component: Layout,
    name: 'RedirectWrap',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/login',
    component: () => import('@/views/Login/Login.vue'),
    name: 'Login',
    meta: {
      hidden: true,
      title: t('router.login'),
      noTagsView: true
    }
  },
  {
    path: '/reset-password',
    component: () => import('@/views/Login/ResetPassword.vue'),
    name: 'ResetPassword',
    meta: {
      hidden: true,
      title: t('router.resetPassword'),
      noTagsView: true
    }
  },
  {
    path: '/personal',
    component: Layout,
    redirect: '/personal/personal-center',
    name: 'Personal',
    meta: {
      title: t('router.personal'),
      hidden: true,
      canTo: true
    },
    children: [
      {
        path: 'personal-center',
        component: () => import('@/views/Personal/PersonalCenter/PersonalCenter.vue'),
        name: 'PersonalCenter',
        meta: {
          title: t('router.personalCenter'),
          hidden: true,
          canTo: true
        }
      }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    name: 'NoFind',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  }
]

export default baseRoutes
