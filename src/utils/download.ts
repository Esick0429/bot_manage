/**
 * 根据后端返回的二进制数据触发浏览器下载
 * @param data Blob 数据或包含 Blob 的响应对象
 * @param filename 要下载的文件名
 * @param mimeType 可选的文件 MIME 类型 (例如 'application/vnd.ms-excel')
 */
export function downloadByData(data: any, filename: string, mimeType?: string) {
  // 确保 data 存在
  if (!data) {
    console.error('Download data is empty.')
    return
  }

  // 尝试从响应对象中提取 Blob (如果 data 不是直接的 Blob)
  // 通常 Axios 设置 responseType: 'blob' 后，data 就直接是 Blob
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })

  // 创建一个指向 Blob 的 URL
  const blobUrl = URL.createObjectURL(blob)

  // 创建一个隐藏的 <a> 标签用于下载
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename || 'download' // 设置下载文件名
  link.style.display = 'none' // 隐藏标签

  // 将链接添加到文档中 (兼容 Firefox)
  document.body.appendChild(link)

  // 模拟点击链接
  link.click()

  // 清理：从文档中移除链接并释放 Blob URL
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
}
