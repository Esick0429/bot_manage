import { defineStore } from 'pinia'
import { constantRouterMap } from '@/router'
import asyncCommonRoutes from '@/router/modules/asyncCommon'
import managementRoutes from '@/router/modules/management'
import operationRoutes from '@/router/modules/operation'
import {
  generateRoutesByFrontEnd,
  generateRoutesByServer,
  flatMultiLevelRoutes
} from '@/utils/routerHelper'
import { store } from '../index'
import { cloneDeep } from 'lodash-es'

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  isAddRouters: boolean
  menuTabRouters: AppRouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: [],
    isAddRouters: false,
    menuTabRouters: []
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      return this.routers
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters))
    },
    getIsAddRouters(): boolean {
      return this.isAddRouters
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    }
  },
  actions: {
    generateRoutes(
      type: 'server' | 'frontEnd' | 'static',
      routers?: AppCustomRouteRecordRaw[] | string[]
    ): Promise<unknown> {
      return new Promise<void>((resolve) => {
        const systemType = import.meta.env.VITE_SYSTEM_TYPE || 'Management'
        let baseDynamicRoutes: AppRouteRecordRaw[] = []
        if (systemType === 'Management') {
          baseDynamicRoutes = managementRoutes.filter((item) => item.path !== '/data_statistics')
        } else {
          baseDynamicRoutes = operationRoutes
        }

        let routerMap: AppRouteRecordRaw[] = []
        if (type === 'server') {
          routerMap = generateRoutesByServer(routers as AppCustomRouteRecordRaw[])
        } else if (type === 'frontEnd') {
          routerMap = generateRoutesByFrontEnd(cloneDeep(baseDynamicRoutes), routers as string[])
        } else {
          routerMap = cloneDeep(baseDynamicRoutes)
        }

        this.addRouters = routerMap.concat([
          {
            path: '/:path(.*)*',
            redirect: '/404',
            name: '404Page',
            meta: {
              hidden: true,
              breadcrumb: false
            }
          }
        ])
        this.routers = cloneDeep(constantRouterMap).concat(routerMap)
        resolve()
      })
    },
    setIsAddRouters(state: boolean): void {
      this.isAddRouters = state
    },
    setMenuTabRouters(routers: AppRouteRecordRaw[]): void {
      this.menuTabRouters = routers
    }
  },
  persist: [
    {
      pick: ['routers'],
      storage: localStorage
    },
    {
      pick: ['addRouters'],
      storage: localStorage
    },
    {
      pick: ['menuTabRouters'],
      storage: localStorage
    }
  ]
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}
