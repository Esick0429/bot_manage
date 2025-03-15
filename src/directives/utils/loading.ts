import type { App, Directive, DirectiveBinding } from 'vue'
import { ElLoading } from 'element-plus'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'

interface LoadingOptions {
  text?: string
  background?: string
  fullscreen?: boolean
  target?: string | HTMLElement
  body?: boolean
  lock?: boolean
}

// 使用WeakMap存储元素与loading实例的关系
const loadingMap = new WeakMap<HTMLElement, LoadingInstance>()

/**
 * 自定义loading指令
 * 用法：
 * v-loading="isLoading"
 * v-loading="isLoading" loading-text="加载中..." loading-background="rgba(0,0,0,0.8)"
 */
const loading: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    // 初始化时如果值为true，创建loading实例
    if (binding.value) {
      const options = getOptions(el, binding)
      const instance = ElLoading.service(options)
      loadingMap.set(el, instance)
    }
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    // 值改变时处理loading状态
    if (binding.value !== binding.oldValue) {
      if (binding.value) {
        // 如果已经有实例，先销毁
        if (loadingMap.has(el)) {
          const instance = loadingMap.get(el)
          instance?.close()
        }
        
        // 创建新实例
        const options = getOptions(el, binding)
        const instance = ElLoading.service(options)
        loadingMap.set(el, instance)
      } else {
        // 关闭loading
        const instance = loadingMap.get(el)
        if (instance) {
          instance.close()
          loadingMap.delete(el)
        }
      }
    }
  },
  
  unmounted(el: HTMLElement) {
    // 组件卸载时关闭loading
    const instance = loadingMap.get(el)
    if (instance) {
      instance.close()
      loadingMap.delete(el)
    }
  }
}

/**
 * 获取loading选项
 */
function getOptions(el: HTMLElement, binding: DirectiveBinding): LoadingOptions {
  const options: LoadingOptions = {
    target: el
  }
  
  // 从元素属性中获取选项
  if (el.hasAttribute('loading-text')) {
    options.text = el.getAttribute('loading-text') || undefined
  }
  
  if (el.hasAttribute('loading-background')) {
    options.background = el.getAttribute('loading-background') || undefined
  }
  
  if (el.hasAttribute('loading-fullscreen')) {
    options.fullscreen = true
  }
  
  if (el.hasAttribute('loading-body')) {
    options.body = true
  }
  
  if (el.hasAttribute('loading-lock')) {
    options.lock = true
  }
  
  return options
}

export const setupLoadingDirective = (app: App<Element>) => {
  app.directive('loading', loading)
}

export default loading 