export type ToolId = 'compress' | 'merge' | 'split' | 'convert' | 'watermark'

export type ToolConfig = {
  id: ToolId
  path: `/${string}`
  navLabel: string
  icon: string
  title: string
  description: string
  drawerTitle: string
  badge: string
  eyebrow: string
  accent: string
  tags: string[]
}

const compressIcon = new URL('../../assets/icon/compress.svg', import.meta.url).href
const mergeIcon = new URL('../../assets/icon/merge.svg', import.meta.url).href
const splitIcon = new URL('../../assets/icon/split.svg', import.meta.url).href
const convertIcon = new URL('../../assets/icon/convert.svg', import.meta.url).href
const watermarkIcon = new URL('../../assets/icon/watermark.svg', import.meta.url).href

export const TOOL_CONFIGS: ToolConfig[] = [
  {
    id: 'compress',
    path: '/compress',
    navLabel: '压缩',
    icon: compressIcon,
    title: '压缩 PDF',
    description: '减小文件体积，适合发送、上传和归档。',
    drawerTitle: '压缩文件',
    badge: 'Compress PDF',
    eyebrow: '更轻量的 PDF 输出',
    accent: '#409eff',
    tags: ['批量处理', '等级可调', '保留原件'],
  },
  {
    id: 'merge',
    path: '/merge',
    navLabel: '合并',
    icon: mergeIcon,
    title: '合并 PDF',
    description: '按当前顺序整理多个文件，输出一份新文档。',
    drawerTitle: '合并队列',
    badge: 'Merge PDF',
    eyebrow: '把零散文件合成一份',
    accent: '#e6a23c',
    tags: ['顺序可调', '批量导入', '单文件输出'],
  },
  {
    id: 'split',
    path: '/split',
    navLabel: '拆分',
    icon: splitIcon,
    title: '拆分 PDF',
    description: '按固定页数拆分，或提取指定页面。',
    drawerTitle: '拆分文件',
    badge: 'Split PDF',
    eyebrow: '让长文档更方便流转',
    accent: '#14b8a6',
    tags: ['自动读页数', '页码范围', '单文件处理'],
  },
  {
    id: 'convert',
    path: '/convert',
    navLabel: '格式转换',
    icon: convertIcon,
    title: 'PDF 转图片',
    description: '导出 PNG 或 JPEG 图片，支持不同清晰度。',
    drawerTitle: '转换文件',
    badge: 'Convert PDF',
    eyebrow: '把页面导出成图片',
    accent: '#67c23a',
    tags: ['PNG/JPEG', 'DPI 可调', '按文件夹输出'],
  },
  {
    id: 'watermark',
    path: '/watermark',
    navLabel: '水印',
    icon: watermarkIcon,
    title: '添加水印',
    description: '批量添加文字或图片水印，并实时预览效果。',
    drawerTitle: '水印文件',
    badge: 'Watermark PDF',
    eyebrow: '让标识直接落在成品里',
    accent: '#f43f5e',
    tags: ['文字/图片', '实时预览', '居中或铺满'],
  },
]

export const TOOL_CONFIG_MAP = Object.fromEntries(
  TOOL_CONFIGS.map((tool) => [tool.id, tool]),
) as Record<ToolId, ToolConfig>
