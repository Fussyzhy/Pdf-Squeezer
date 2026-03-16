<template>
  <div
    class="workspace-shell"
    :class="{ 'workspace-shell--collapsed': !fileListVisible }"
    :style="{ '--tool-accent': currentTool.accent }"
    v-loading="isLoading"
  >
    <el-scrollbar class="workspace-main">
      <header class="workspace-header">
        <div class="header-copy">
          <button class="back-button" type="button" @click="handleGoHome">
            <el-icon>
              <arrow-left/>
            </el-icon>
          </button>

          <span class="header-kicker">{{ currentTool.badge }}</span>
          <h1>{{ currentTool.title }}</h1>
          <p>{{ currentTool.description }}</p>

          <div class="header-tags">
            <span v-for="tag in currentTool.tags" :key="tag">{{ tag }}</span>
          </div>
        </div>

        <div class="header-side">
          <div class="output-card">
            <span class="output-card__label">输出目录</span>
            <strong>{{ outputFolderName }}</strong>
            <p>{{ outputFolderPath || '尚未设置，处理前请先选择保存目录。' }}</p>
          </div>

          <div class="header-actions">
            <button class="secondary-button" type="button" @click="handleGoHome">
              功能首页
            </button>
            <button class="settings-button" type="button" @click="handleOpenSettings">
              输出设置
            </button>
          </div>
        </div>
      </header>

      <compress-view
        v-if="tool === 'compress'"
        v-model:compression-level="compressionLevel"
        @update:fileList="handleCompressFileListUpdate"
        @handle-compress="handleCompress"
      />

      <merge-view
        v-else-if="tool === 'merge'"
        @update:fileList="handleMergeFileListUpdate"
        @handle-merge="handleMerge"
      />

      <split-view
        v-else-if="tool === 'split'"
        :page-count="splitPageCount"
        :page-count-loading="splitPageCountLoading"
        @update:fileList="handleSplitFileListUpdate"
        @handle-split="handleSplit"
      />

      <convert-view
        v-else-if="tool === 'convert'"
        @update:fileList="handleConvertFileListUpdate"
        @handle-convert="handleConvert"
      />

      <watermark-view
        v-else
        @update:fileList="handleWatermarkFileListUpdate"
        @handle-watermark="handleWatermark"
      />
    </el-scrollbar>

    <aside class="workspace-aside">
      <pdf-file-list
        v-model="currentFileList"
        :title="currentTool.drawerTitle"
        :visible="fileListVisible"
        @update:visible="handleFileListVisibleChange"
      />
    </aside>
  </div>

  <system-setting-dialog v-model="settingsVisible" />
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import CompressView from '@/views/components/CompressView.vue'
import ConvertView from '@/views/components/ConvertView.vue'
import MergeView from '@/views/components/MergeView.vue'
import PdfFileList from '@/views/components/PdfFileList.vue'
import SplitView from '@/views/components/SplitView.vue'
import SystemSettingDialog from '@/views/components/dialog/SystemSettingDialog.vue'
import WatermarkView from '@/views/components/WatermarkView.vue'
import { TOOL_CONFIG_MAP, type ToolId } from '@/views/tool-config'

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default'
type PdfFile = { name: string; buffer: ArrayBuffer }
type PdfBinaryPayload = { name: string; buffer: Uint8Array }
type SplitSubmitOptions =
  | { mode: 'interval'; pagesPerFile: number }
  | { mode: 'custom'; pageRanges: string }
type ConvertSubmitOptions = {
  mode: 'pdf-to-image'
  imageFormat: 'png' | 'jpeg'
  dpi: number
}
type WatermarkPlacement = 'center' | 'tile'
type WatermarkImagePayload = {
  data: Uint8Array
  width: number
  height: number
  format: 'png' | 'jpeg'
}
type WatermarkSubmitOptions = {
  watermarkImage: WatermarkImagePayload
  placement: WatermarkPlacement
  opacity: number
  rotation: number
  size: number
  tileGap: number
  offsetX: number
  offsetY: number
  pdfPasswords?: string[]
}
type WatermarkResponse =
  | { success: true; outputFiles?: string[] }
  | {
      success: false
      error?: string
      code?: 'PASSWORD_REQUIRED' | 'INVALID_PASSWORD'
      fileIndex?: number
      fileName?: string
    }

const props = defineProps<{
  tool: ToolId
}>()

const router = useRouter()
const DEFAULT_COMPRESSION_LEVEL: CompressionLevel = 'ebook'
const compressionLevels: CompressionLevel[] = ['screen', 'ebook', 'printer', 'prepress', 'default']

const getSavedCompressionLevel = (): CompressionLevel => {
  const savedLevel = localStorage.getItem('compressionLevel')

  if (compressionLevels.includes(savedLevel as CompressionLevel)) {
    return savedLevel as CompressionLevel
  }

  return DEFAULT_COMPRESSION_LEVEL
}

const isLoading = ref(false)
const settingsVisible = ref(false)
const fileListVisible = ref(false)
const outputFolderPath = ref('')
const compressionLevel = ref<CompressionLevel>(getSavedCompressionLevel())
const compressFiles = ref<PdfFile[]>([])
const mergeFiles = ref<PdfFile[]>([])
const splitFiles = ref<PdfFile[]>([])
const convertFiles = ref<PdfFile[]>([])
const watermarkFiles = ref<PdfFile[]>([])
const watermarkPasswords = ref<string[]>([])
const splitPageCount = ref<number | null>(null)
const splitPageCountLoading = ref(false)
const splitPageCountRequestId = ref(0)

const currentTool = computed(() => TOOL_CONFIG_MAP[props.tool])
const outputFolderName = computed(() => {
  if (!outputFolderPath.value) return '未设置'

  const parts = outputFolderPath.value.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] || outputFolderPath.value
})

const getFilesForTool = (tool: ToolId) => {
  if (tool === 'merge') return mergeFiles.value
  if (tool === 'split') return splitFiles.value
  if (tool === 'convert') return convertFiles.value
  if (tool === 'watermark') return watermarkFiles.value
  return compressFiles.value
}

const setFilesForTool = (tool: ToolId, files: PdfFile[]) => {
  if (tool === 'merge') {
    mergeFiles.value = files
    return
  }

  if (tool === 'split') {
    splitFiles.value = files
    return
  }

  if (tool === 'convert') {
    convertFiles.value = files
    return
  }

  if (tool === 'watermark') {
    watermarkFiles.value = files
    return
  }

  compressFiles.value = files
}

const currentFileList = computed<PdfFile[]>({
  get() {
    return getFilesForTool(props.tool)
  },
  set(value) {
    setFilesForTool(props.tool, value)
  },
})

onMounted(() => {
  refreshOutputFolder()
})

watch(compressionLevel, (level) => {
  localStorage.setItem('compressionLevel', level)
})

watch(settingsVisible, (visible) => {
  if (!visible) {
    refreshOutputFolder()
  }
})

watch(
  () => props.tool,
  (tool) => {
    fileListVisible.value = getFilesForTool(tool).length > 0
  },
  { immediate: true },
)

watch(
  watermarkFiles,
  () => {
    watermarkPasswords.value = []
  },
  { deep: true },
)

watch(
  splitFiles,
  async (files) => {
    const requestId = ++splitPageCountRequestId.value

    if (!files.length) {
      splitPageCount.value = null
      splitPageCountLoading.value = false
      return
    }

    const [file] = files

    if (!file) {
      splitPageCount.value = null
      splitPageCountLoading.value = false
      return
    }

    splitPageCount.value = null
    splitPageCountLoading.value = true

    try {
      const result = await window.electronAPI.getPDFPageCount({
        name: file.name,
        buffer: new Uint8Array(file.buffer),
      })

      if (requestId !== splitPageCountRequestId.value) {
        return
      }

      if (result.success && typeof result.pageCount === 'number') {
        splitPageCount.value = result.pageCount
      } else {
        ElMessage.error(result.error || '读取 PDF 页数失败')
      }
    } catch (err) {
      if (requestId === splitPageCountRequestId.value) {
        ElMessage.error('读取 PDF 页数失败')
        console.error(err)
      }
    } finally {
      if (requestId === splitPageCountRequestId.value) {
        splitPageCountLoading.value = false
      }
    }
  },
  { deep: true },
)

const refreshOutputFolder = () => {
  outputFolderPath.value = localStorage.getItem('outputFolder') || ''
}

const handleGoHome = () => {
  router.push('/')
}

const handleOpenSettings = () => {
  settingsVisible.value = true
}

const updateFileList = (tool: ToolId, incomingFiles: PdfFile[]) => {
  if (!incomingFiles.length) return

  fileListVisible.value = true

  if (tool === 'split') {
    if (incomingFiles.length > 1) {
      ElMessage.warning('拆分功能一次只能处理一个 PDF，已保留第一个文件')
    }

    const [firstFile] = incomingFiles
    if (!firstFile) return

    setFilesForTool(tool, [firstFile])
    ElMessage.success('已添加 1 个文件到拆分列表')
    return
  }

  setFilesForTool(tool, [...getFilesForTool(tool), ...incomingFiles])
  ElMessage.success(`已添加 ${incomingFiles.length} 个文件到${TOOL_CONFIG_MAP[tool].drawerTitle}`)
}

const handleCompressFileListUpdate = (files: PdfFile[]) => updateFileList('compress', files)
const handleMergeFileListUpdate = (files: PdfFile[]) => updateFileList('merge', files)
const handleSplitFileListUpdate = (files: PdfFile[]) => updateFileList('split', files)
const handleConvertFileListUpdate = (files: PdfFile[]) => updateFileList('convert', files)
const handleWatermarkFileListUpdate = (files: PdfFile[]) => updateFileList('watermark', files)

const handleFileListVisibleChange = (visible: boolean) => {
  fileListVisible.value = visible
}

const requireOutputFolder = () => {
  refreshOutputFolder()
  const outputFolder = outputFolderPath.value

  if (!outputFolder) {
    ElMessage.error('请先在右上角设置输出目录')
    return null
  }

  return outputFolder
}

const toBinaryFiles = (files: PdfFile[]): PdfBinaryPayload[] => {
  return files.map((item) => ({
    name: item.name,
    buffer: new Uint8Array(item.buffer),
  }))
}

const handleCompress = async () => {
  if (!compressFiles.value.length) {
    ElMessage.error('请先上传要压缩的 PDF 文件')
    return
  }

  const outputFolder = requireOutputFolder()
  if (!outputFolder) return

  isLoading.value = true

  try {
    const result = await window.electronAPI.compressPDFBuffer(
      toBinaryFiles(compressFiles.value),
      outputFolder,
      compressionLevel.value,
    )

    if (result.success) {
      ElMessage.success('压缩完成，结果已保存到输出目录')
    } else {
      ElMessage.error(result.error || '压缩失败，请稍后重试')
      console.error(result.error)
    }
  } catch (err) {
    ElMessage.error('压缩失败，请稍后重试')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const handleMerge = async () => {
  if (!mergeFiles.value.length) {
    ElMessage.error('请先上传要合并的 PDF 文件')
    return
  }

  const outputFolder = requireOutputFolder()
  if (!outputFolder) return

  isLoading.value = true

  try {
    const result = await window.electronAPI.mergePDFBuffer(toBinaryFiles(mergeFiles.value), outputFolder)

    if (result.success) {
      ElMessage.success('合并完成，结果已保存到输出目录')
    } else {
      ElMessage.error(result.error || '合并失败，请稍后重试')
      console.error(result.error)
    }
  } catch (err) {
    ElMessage.error('合并失败，请稍后重试')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const handleSplit = async (options: SplitSubmitOptions) => {
  if (!splitFiles.value.length) {
    ElMessage.error('请先上传要拆分的 PDF 文件')
    return
  }

  if (splitPageCountLoading.value) {
    ElMessage.warning('正在读取 PDF 页数，请稍候')
    return
  }

  if (!splitPageCount.value) {
    ElMessage.error('暂时无法读取 PDF 页数')
    return
  }

  const outputFolder = requireOutputFolder()
  if (!outputFolder) return

  const [file] = splitFiles.value
  if (!file) return

  isLoading.value = true

  try {
    const result = await window.electronAPI.splitPDFBuffer(
      {
        name: file.name,
        buffer: new Uint8Array(file.buffer),
      },
      outputFolder,
      options,
    )

    if (result.success) {
      const outputFilesCount = result.outputFiles?.length ?? 0
      if (outputFilesCount > 1) {
        ElMessage.success(`拆分完成，已生成 ${outputFilesCount} 个文件`)
      } else {
        ElMessage.success('拆分完成，结果已保存到输出目录')
      }
    } else {
      ElMessage.error(result.error || '拆分失败，请稍后重试')
      console.error(result.error)
    }
  } catch (err) {
    ElMessage.error('拆分失败，请稍后重试')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const handleConvert = async (options: ConvertSubmitOptions) => {
  if (!convertFiles.value.length) {
    ElMessage.error('请先上传要转换的 PDF 文件')
    return
  }

  const outputFolder = requireOutputFolder()
  if (!outputFolder) return

  isLoading.value = true

  try {
    const result = await window.electronAPI.convertPDFBuffer(
      toBinaryFiles(convertFiles.value),
      outputFolder,
      options,
    )

    if (result.success) {
      const convertResults = result.results ?? []
      const totalImages = convertResults.reduce((count, item) => count + item.outputFiles.length, 0)
      const outputFolders = convertResults.length

      if (totalImages > 0) {
        if (outputFolders > 1) {
          ElMessage.success(`格式转换完成，已导出 ${totalImages} 张图片，共 ${outputFolders} 个文件夹`)
        } else {
          ElMessage.success(`格式转换完成，已导出 ${totalImages} 张图片`)
        }
      } else {
        ElMessage.success('格式转换完成，结果已保存到输出目录')
      }
    } else {
      ElMessage.error(result.error || '格式转换失败，请稍后重试')
      console.error(result.error)
    }
  } catch (err) {
    ElMessage.error('格式转换失败，请稍后重试')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const promptForPdfPassword = async (fileName: string, invalidPassword = false) => {
  try {
    const { value } = await ElMessageBox.prompt(
      invalidPassword
        ? `"${fileName}" 的密码不正确，请重新输入。`
        : `"${fileName}" 已加密码保护，请输入密码后继续生成可编辑副本。`,
      'PDF 密码',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        inputType: 'password',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        inputValidator: (inputValue) => {
          return inputValue.trim() ? true : '请输入 PDF 密码'
        },
      },
    )

    return value.trim()
  } catch {
    return null
  }
}

const runWatermarkWithPasswordHandling = async (
  outputFolder: string,
  options: WatermarkSubmitOptions,
): Promise<WatermarkResponse | null> => {
  let result = await window.electronAPI.watermarkPDFBuffer(
    toBinaryFiles(watermarkFiles.value),
    outputFolder,
    {
      ...options,
      pdfPasswords: [...watermarkPasswords.value],
    },
  )

  while (!result.success && (result.code === 'PASSWORD_REQUIRED' || result.code === 'INVALID_PASSWORD')) {
    if (typeof result.fileIndex !== 'number') {
      return result
    }

    const targetFileName = result.fileName || watermarkFiles.value[result.fileIndex]?.name || `PDF ${result.fileIndex + 1}`
    const password = await promptForPdfPassword(targetFileName, result.code === 'INVALID_PASSWORD')

    if (password === null) {
      return null
    }

    watermarkPasswords.value[result.fileIndex] = password
    result = await window.electronAPI.watermarkPDFBuffer(
      toBinaryFiles(watermarkFiles.value),
      outputFolder,
      {
        ...options,
        pdfPasswords: [...watermarkPasswords.value],
      },
    )
  }

  return result
}

const handleWatermark = async (options: WatermarkSubmitOptions) => {
  if (!watermarkFiles.value.length) {
    ElMessage.error('请先上传要加水印的 PDF 文件')
    return
  }

  const outputFolder = requireOutputFolder()
  if (!outputFolder) return

  isLoading.value = true

  try {
    const result = await runWatermarkWithPasswordHandling(outputFolder, options)

    if (!result) {
      ElMessage.info('已取消加密 PDF 的水印处理')
      return
    }

    if (result.success) {
      const outputFilesCount = result.outputFiles?.length ?? 0
      if (outputFilesCount > 1) {
        ElMessage.success(`水印完成，已生成 ${outputFilesCount} 个文件`)
      } else {
        ElMessage.success('水印完成，结果已保存到输出目录')
      }
    } else {
      ElMessage.error(result.error || '水印失败，请稍后重试')
      console.error(result.error)
    }
  } catch (err) {
    ElMessage.error('水印失败，请稍后重试')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.workspace-shell {
  width: min(980px, calc(100vw - 48px));
  max-height: calc(100vh - 100px);
  padding: 18px;
  display: flex;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.76);
  box-shadow: 0 24px 60px rgba(31, 41, 55, 0.14);
  backdrop-filter: blur(18px);
  flex: 1;
  gap: 24px;
  position: relative;
}

.workspace-shell--collapsed {
  grid-template-columns: minmax(0, 1fr) 76px;
}

.workspace-main,
.workspace-aside {
  min-height: 0;
}

.workspace-main {
  display: flex;
  flex-direction: column;
  padding: 24px;
  // border-radius: 22px;
  // background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, #fdfefe 100%);
  // border: 1px solid rgba(226, 232, 240, 0.88);
  overflow: auto;
  height: 100%;
  margin-right: 60px;
  flex: 1;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  text-align: left;
}

.header-copy {
  max-width: 560px;

  h1 {
    margin: 12px 0 8px;
    font-size: 32px;
    line-height: 1.1;
    color: #0f172a;
    letter-spacing: -0.04em;
  }

  p {
    margin: 0;
    color: #64748b;
    line-height: 1.8;
  }
}

.back-button {
  margin-bottom: 14px;
  margin-right: 12px;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.36);
  background: rgba(255, 255, 255, 0.86);
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  border-color: var(--tool-accent);
  color: var(--tool-accent);
}

.header-kicker {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tool-accent) 12%, white);
  color: var(--tool-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.header-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;

  span {
    padding: 6px 10px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e5edf6;
    color: #5b6776;
    font-size: 12px;
  }
}

.header-side {
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.output-card {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f3f8ff 0%, #fafcff 100%);
  border: 1px solid #dbe9f8;
  text-align: left;

  strong {
    display: block;
    margin: 6px 0 8px;
    font-size: 18px;
    color: #0f172a;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
    line-height: 1.6;
    word-break: break-all;
  }
}

.output-card__label {
  font-size: 12px;
  font-weight: 600;
  color: #2b6cb0;
}

.header-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.secondary-button,
.settings-button {
  height: 46px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.94);
  color: #334155;
  border: 1px solid rgba(203, 213, 225, 0.88);
}

.secondary-button:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--tool-accent) 32%, white);
  color: var(--tool-accent);
}

.settings-button {
  background: linear-gradient(135deg, var(--tool-accent) 0%, color-mix(in srgb, var(--tool-accent) 78%, black) 100%);
  color: #fff;
  box-shadow: 0 14px 28px color-mix(in srgb, var(--tool-accent) 24%, transparent);
}

.settings-button:hover {
  transform: translateY(-1px);
}

.workspace-aside {
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(252, 254, 255, 0.96) 0%, rgba(244, 248, 251, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.9);
  overflow: hidden;
  position: absolute;
  top: 18px;
  right: 18px;
  bottom: 18px;
  z-index: 1000;
}

@media (max-width: 900px) {
  .workspace-shell,
  .workspace-shell--collapsed {
    width: calc(100vw - 32px);
    max-height: none;
    grid-template-columns: 1fr;
  }

  .workspace-header {
    flex-direction: column;
  }

  .header-side {
    min-width: 0;
  }

  .workspace-aside {
    min-height: 120px;
    position: static;
  }
}

@media (max-width: 720px) {
  .workspace-main {
    padding: 18px;
    margin-right: 0;
  }

  .header-copy {
    h1 {
      font-size: 26px;
    }
  }

  .header-actions {
    grid-template-columns: 1fr;
  }
}
</style>

