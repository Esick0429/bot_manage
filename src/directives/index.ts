import type { App } from 'vue'
import { setupPermissionDirective, setupLoadingDirective } from './utils'

/**
 * 导出指令：v-xxx
 * @methods hasPermi 按钮权限，用法: v-hasPermi
 * @methods loading 加载状态，用法: v-loading
 */
export const setupDirectives = (app: App<Element>) => {
  setupPermissionDirective(app)
  setupLoadingDirective(app)
}
