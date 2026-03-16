export type ToolId = 'compress' | 'merge' | 'split' | 'convert' | 'watermark'

export type ToolConfig = {
  id: ToolId
  path: `/${string}`
  navLabel: string
  title: string
  description: string
  drawerTitle: string
  badge: string
  eyebrow: string
  accent: string
  tags: string[]
}

export const TOOL_CONFIGS: ToolConfig[] = [
  {
    id: 'compress',
    path: '/compress',
    navLabel: '压缩',
    title: '压缩 PDF 文件',
    description: '适合邮件发送、在线上传和归档整理，保留原文件并输出新的压缩结果。',
    drawerTitle: '压缩文件',
    badge: 'Compress PDF',
    eyebrow: '降低体积，保持可读性',
    accent: '#409eff',
    tags: ['批量处理', '等级可调', '保留原文件'],
  },
  {
    id: 'merge',
    path: '/merge',
    navLabel: '合并',
    title: '按顺序合并多个 PDF',
    description: '将多个文档整理为一个结果文件，适合合同附件、扫描件和统一归档。',
    drawerTitle: '合并队列',
    badge: 'Merge PDF',
    eyebrow: '把零散文档整理成一份成品',
    accent: '#e6a23c',
    tags: ['拖拽排序', '批量导入', '输出单文件'],
  },
  {
    id: 'split',
    path: '/split',
    navLabel: '拆分',
    title: '按页拆分或提取指定页',
    description: '支持按固定页数连续拆分，也可以通过页码范围提取需要的页面。',
    drawerTitle: '拆分文件',
    badge: 'Split PDF',
    eyebrow: '把长文档切成更适合流转的小文件',
    accent: '#14b8a6',
    tags: ['自动读页数', '区间提取', '单文件处理'],
  },
  {
    id: 'convert',
    path: '/convert',
    navLabel: '格式转换',
    title: '将 PDF 转换为图片',
    description: '当前支持导出 PNG 和 JPEG，可按不同 DPI 输出，适合预览图和素材图。',
    drawerTitle: '转换文件',
    badge: 'Convert PDF',
    eyebrow: '把页面内容变成可直接分发的图片资源',
    accent: '#67c23a',
    tags: ['PNG / JPEG', 'DPI 可调', '按文件夹输出'],
  },
  {
    id: 'watermark',
    path: '/watermark',
    navLabel: '水印',
    title: '批量添加水印',
    description: '支持文字和图片两种水印，可调透明度、大小、角度和铺满方式。',
    drawerTitle: '水印文件',
    badge: 'Watermark PDF',
    eyebrow: '让品牌标识和权限提示直接落在成品里',
    accent: '#f43f5e',
    tags: ['文字/图片', '批量处理', '居中或铺满'],
  },
]

export const TOOL_CONFIG_MAP = Object.fromEntries(
  TOOL_CONFIGS.map((tool) => [tool.id, tool]),
) as Record<ToolId, ToolConfig>
