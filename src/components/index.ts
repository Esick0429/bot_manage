import type { App } from 'vue'
import { Icon } from './Icon'
import { Permission } from './Permission'
import { BaseButton } from './Button'

export const setupGlobCom = (app: App<Element>): void => {
  app.component('Icon', Icon)
  app.component('Permission', Permission)
  app.component('BaseButton', BaseButton)
}

export * from './Waterfall'
export * from './Form'
export * from './Table'
export * from './Search'
export * from './Dialog'
// export * from './Drawer' // 暂不存在此目录
export * from './Descriptions'
export * from './SearchTable'
export * from './Tips'
