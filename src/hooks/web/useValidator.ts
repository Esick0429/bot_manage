import { useI18n } from '@/hooks/web/useI18n'
import { FormItemRule } from 'element-plus'

const { t } = useI18n()

interface LengthRange {
  min: number
  max: number
  message?: string
}

export const useValidator = () => {
  const required = (message?: string): FormItemRule => {
    return {
      required: true,
      message: message || t('common.required')
    }
  }

  const lengthRange = (options: LengthRange): FormItemRule => {
    const { min, max, message } = options

    return {
      min,
      max,
      message: message || t('common.lengthRange', { min, max })
    }
  }

  const notSpace = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (val?.indexOf(' ') !== -1) {
          callback(new Error(message || t('common.notSpace')))
        } else {
          callback()
        }
      }
    }
  }

  const notSpecialCharacters = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (/[`~!@#$%^&*()_+<>?:"{},.\/;'[\]]/gi.test(val)) {
          callback(new Error(message || t('common.notSpecialCharacters')))
        } else {
          callback()
        }
      }
    }
  }

  const phone = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (!val) return callback()
        if (!/^1[3456789]\d{9}$/.test(val)) {
          callback(new Error(message || '请输入正确的手机号码'))
        } else {
          callback()
        }
      }
    }
  }

  const email = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (!val) return callback()
        if (!/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(val)) {
          callback(new Error(message || '请输入正确的邮箱'))
        } else {
          callback()
        }
      }
    }
  }

  const maxlength = (max: number): FormItemRule => {
    return {
      max,
      message: '长度不能超过' + max + '个字符'
    }
  }

  const check = (message?: string): FormItemRule => {
    return {
      validator: (_, val, callback) => {
        if (!val) {
          callback(new Error(message || t('common.required')))
        } else {
          callback()
        }
      }
    }
  }

  return {
    required,
    lengthRange,
    notSpace,
    notSpecialCharacters,
    phone,
    email,
    maxlength,
    check
  }
}

/**
 * 根据国家英文名称校验电话号码格式
 * @param {string} countryEn - 国家的英文名称 (e.g., 'Thailand', 'Malaysia', 'UnitedStates')
 * @param {string} phoneNumber - 需要校验的电话号码字符串
 * @returns {boolean} 如果号码格式有效则返回 true，否则返回 false
 */
export function checkPhone(countryEn: string, phoneNumber: string): boolean {
  let regex: RegExp
  let isValid = false

  if (!countryEn || !phoneNumber) {
    return false // 如果国家或号码为空，则无效
  }

  // 可选：移除号码中的常见非数字字符，例如空格或破折号
  // phoneNumber = phoneNumber.replace(/[-\s]/g, '');

  switch (countryEn) {
    case 'Thailand': {
      // 泰国: 以 09, 08, 06 开头，后面跟8位数字
      regex = /^(0[9|8|6])\d{8}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Malaysia': {
      // 马来西亚: 以 01 开头，后面跟8或9位数字
      regex = /^01\d{8,9}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Myanmar': {
      // 缅甸: 规则较复杂，包含多个运营商号段
      const mptRegex = /^09(2[0-6]|4[0-9]|5[0-6]|6[3-4]|70|71|73|81|8[3-9]|91)\d{4,7}/
      const ooredooRegex = /^09(9[4-8])\d{7}/
      const telenorRegex = /^09(7[4-9])\d{7}/
      const mecTelRegex = /^09(3[0-9])\d{6,7}/
      const myTelRegex = /^09(6[5-9])\d{7}/
      isValid =
        mptRegex.test(phoneNumber) ||
        ooredooRegex.test(phoneNumber) ||
        telenorRegex.test(phoneNumber) ||
        mecTelRegex.test(phoneNumber) ||
        myTelRegex.test(phoneNumber)
      break
    }
    case 'Cambodia': {
      // 柬埔寨: 以 855 开头，后面跟9位数字
      regex = /^855\d{9}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Philippines': {
      // 菲律宾: 以 09 开头，后面跟9位数字 (简化规则)
      regex = /^09\d{9}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Indonesia': {
      // 印度尼西亚: 以 08 开头，包含多个运营商号段
      const indosatRegex = /^08(1[4-6]|5[5-8])\d{7,9}$/
      const xlRegex = /^08(1[7-9]|59|7[7-8])\d{7,9}$/
      const axisRegex = /^08(3[1-2]|3[7-8])\d{7,9}$/
      const telkomselRegex = /^08(1[2-3]|2[1-3]|5[1-3])\d{7,9}$/
      const smartfrenRegex = /^08(8[1-8])\d{7,9}$/
      const threeRegex = /^08(9[5-9])\d{7,9}$/
      isValid =
        indosatRegex.test(phoneNumber) ||
        xlRegex.test(phoneNumber) ||
        axisRegex.test(phoneNumber) ||
        telkomselRegex.test(phoneNumber) ||
        smartfrenRegex.test(phoneNumber) ||
        threeRegex.test(phoneNumber)
      break
    }
    case 'UnitedStates': {
      // 美国: 以 1 开头，后面跟10位数字
      regex = /^1\d{10}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Vietnam': {
      // 越南: 以 84 开头，后面跟9位数字
      regex = /^84\d{9}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Singapore': {
      // 新加坡: 以 65 开头，后面跟8位数字
      regex = /^65\d{8}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'UnitedKingdom': {
      // 英国: 以 44 开头，后面跟10位数字
      regex = /^44\d{10}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Brazil': {
      // 巴西: 以 55 开头，后面跟11位数字
      regex = /^55\d{11}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'SouthAfrica': {
      // 南非: 以 27 开头，后面跟8到12位数字
      regex = /^27\d{8,12}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Russia': {
      // 俄罗斯: 以 7 开头，后面跟10到11位数字
      regex = /^7\d{10,11}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Mexico': {
      // 墨西哥: 以 52 开头，后面跟10到12位数字
      regex = /^52\d{10,12}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Argentina': {
      // 阿根廷: 以 54 开头，后面跟8到12位数字
      regex = /^54\d{8,12}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Peru': {
      // 秘鲁: 以 51 开头，后面跟8到12位数字
      regex = /^51\d{8,12}$/
      isValid = regex.test(phoneNumber)
      break
    }
    case 'Poland': {
      // 波兰: 以 48 开头，后面跟9位数字
      regex = /^48\d{9}$/
      isValid = regex.test(phoneNumber)
      break
    }
    // TODO: 添加更多国家的校验规则...
    default: {
      // 对于列表之外的国家，或者没有特定规则的国家，默认有效
      isValid = true // 或者 false
      // console.warn(`No specific validation rule found for country: ${countryEn}. Skipping strict validation.`); // 正式环境建议移除或调整日志级别
      break
    }
  }
  return isValid
}
