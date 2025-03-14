export interface UserLoginType {
  username: string
  password: string
}

export interface UserType {
  username: string
  password: string
  role?: string
  roleId?: string
}

export interface PhoneRegisterParams {
  phone: string
  password: string
  verify_code: string
}

export interface EmailRegisterParams {
  username: string
  email: string
  password: string
  verify_code: string
}

export interface PasswordLoginParams {
  username: string
  password: string
}

export interface VerifyCodeLoginParams {
  username: string
  verify_code: string
}

export interface ChangePasswordParams {
  phone?: string
  email?: string
  verify_code: string
  password: string
}

export interface EmailCodeParams {
  email: string
  channel: 'login' | 'register' | 'change_passwd'
}

export interface PhoneCodeParams {
  country_code?: string
  mobile: string
  channel: 'login' | 'register' | 'change_passwd'
}

export interface LoginResponse {
  code: string
  data: string // token
  msg: string
  trace: {
    destIp: string
    id: string
    srcIp: string
    timestamp: number
  }
}
