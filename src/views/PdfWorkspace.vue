<template>
  <div
    class="workspace-shell"
    :class="{ 'workspace-shell--collapsed': !fileListVisible }"
    v-loading="isLoading"
  >
    <el-scrollbar class="workspace-main">
      <header class="workspace-header">
        <div class="header-copy">
          <span class="header-kicker">PDF Squeezer</span>
          <h1>压缩、合并、拆分、格式转换与水印</h1>
          <p>上传文件后即可在当前页完成处理，右侧文件区支持查看、删除和拖拽排序。</p>
        </div>

        <div class="header-side">
          <div class="output-card">
            <span class="output-card__label">输出目录</span>
            <strong>{{ outputFolderName }}</strong>
            <p>{{ outputFolderPath || '尚未设置，处理前请先选择保存目录。' }}</p>
          </div>

          <button class="settings-button" type="button" @click="handleOpenSettings">
            输出设置
          </button>
        </div>
      </header>

      <el-tabs v-model="activeTab" class="tool-tabs">
        <el-tab-pane label="压缩" name="compress">
          <compress-view
            v-model:compression-level="compressionLevel"
            @update:fileList="handleCompressFileListUpdate"
            @handle-compress="handleCompress"
          />
        </el-tab-pane>

        <el-tab-pane label="合并" name="merge">
          <merge-view
            @update:fileList="handleMergeFileListUpdate"
            @handle-merge="handleMerge"
          />
        </el-tab-pane>

        <el-tab-pane label="拆分" name="split">
          <split-view
            :page-count="splitPageCount"
            :page-count-loading="splitPageCountLoading"
            @update:fileList="handleSplitFileListUpdate"
            @handle-split="handleSplit"
          />
        </el-tab-pane>

        <el-tab-pane label="格式转换" name="convert">
          <convert-view
            @update:fileList="handleConvertFileListUpdate"
            @handle-convert="handleConvert"
          />
        </el-tab-pane>

        <el-tab-pane label="水印" name="watermark">
          <watermark-view
            @update:fileList="handleWatermarkFileListUpdate"
            @handle-watermark="handleWatermark"
          />
        </el-tab-pane>
      </el-tabs>

      <!-- <div class="workspace-footer">Haoyang 设计</div> -->
    </el-scrollbar>

    <aside class="workspace-aside">
      <pdf-file-list
        v-model="currentFileList"
        :title="currentFileListTitle"
        :visible="fileListVisible"
        @update:visible="handleFileListVisibleChange"
      />
    </aside>
  </div>

  <system-setting-dialog v-model="settingsVisible" />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import CompressView from '@/views/components/CompressView.vue'
import ConvertView from '@/views/components/ConvertView.vue'
import MergeView from '@/views/components/MergeView.vue'
import PdfFileList from '@/views/components/PdfFileList.vue'
import SplitView from '@/views/components/SplitView.vue'
import SystemSettingDialog from '@/views/components/dialog/SystemSettingDialog.vue'
import WatermarkView from '@/views/components/WatermarkView.vue'

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default'
type ToolTab = 'compress' | 'merge' | 'split' | 'convert' | 'watermark'
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
}

const DEFAULT_COMPRESSION_LEVEL: CompressionLevel = 'ebook'
const compressionLevels: CompressionLevel[] = ['screen', 'ebook', 'printer', 'prepress', 'default']
const toolLabels: Record<ToolTab, string> = {
  compress: '压缩',
  merge: '合并',
  split: '拆分',
  convert: '格式转换',
  watermark: '水印',
}
const fileListTitles: Record<ToolTab, string> = {
  compress: '压缩文件',
  merge: '合并队列',
  split: '拆分文件',
  convert: '转换文件',
  watermark: '水印文件',
}

const getSavedCompressionLevel = (): CompressionLevel => {
  const savedLevel = localStorage.getItem('compressionLevel')

  if (compressionLevels.includes(savedLevel as CompressionLevel)) {
    return savedLevel as CompressionLevel
  }

  return DEFAULT_COMPRESSION_LEVEL
}

const activeTab = ref<ToolTab>('compress')
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
const splitPageCount = ref<number | null>(null)
const splitPageCountLoading = ref(false)
const splitPageCountRequestId = ref(0)

const currentFileList = computed<PdfFile[]>({
  get() {
    if (activeTab.value === 'merge') return mergeFiles.value
    if (activeTab.value === 'split') return splitFiles.value
    if (activeTab.value === 'convert') return convertFiles.value
    if (activeTab.value === 'watermark') return watermarkFiles.value
    return compressFiles.value
  },
  set(value) {
    if (activeTab.value === 'merge') {
      mergeFiles.value = value
      return
    }

    if (activeTab.value === 'split') {
      splitFiles.value = value
      return
    }

    if (activeTab.value === 'convert') {
      convertFiles.value = value
      return
    }

    if (activeTab.value === 'watermark') {
      watermarkFiles.value = value
      return
    }

    compressFiles.value = value
  },
})

const currentFileListTitle = computed(() => fileListTitles[activeTab.value])
const outputFolderName = computed(() => {
  if (!outputFolderPath.value) return '未设置'

  const parts = outputFolderPath.value.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] || outputFolderPath.value
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

const handleOpenSettings = () => {
  settingsVisible.value = true
}

const getFilesForTab = (tab: ToolTab) => {
  if (tab === 'merge') return mergeFiles.value
  if (tab === 'split') return splitFiles.value
  if (tab === 'convert') return convertFiles.value
  if (tab === 'watermark') return watermarkFiles.value
  return compressFiles.value
}

const setFilesForTab = (tab: ToolTab, files: PdfFile[]) => {
  if (tab === 'merge') {
    mergeFiles.value = files
    return
  }

  if (tab === 'split') {
    splitFiles.value = files
    return
  }

  if (tab === 'convert') {
    convertFiles.value = files
    return
  }

  if (tab === 'watermark') {
    watermarkFiles.value = files
    return
  }

  compressFiles.value = files
}

const updateFileList = (tab: ToolTab, incomingFiles: PdfFile[]) => {
  if (!incomingFiles.length) return

  fileListVisible.value = true

  if (tab === 'split') {
    if (incomingFiles.length > 1) {
      ElMessage.warning('拆分功能一次只能处理一个 PDF，已保留第一个文件')
    }

    const [firstFile] = incomingFiles
    if (!firstFile) return

    setFilesForTab(tab, [firstFile])
    ElMessage.success('已添加 1 个文件到拆分列表')
    return
  }

  setFilesForTab(tab, [...getFilesForTab(tab), ...incomingFiles])
  ElMessage.success(`已添加 ${incomingFiles.length} 个文件到${toolLabels[tab]}列表`)
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

const handleWatermark = async (options: WatermarkSubmitOptions) => {
  if (!watermarkFiles.value.length) {
    ElMessage.error('请先上传要加水印的 PDF 文件')
    return
  }

  const outputFolder = requireOutputFolder()
  if (!outputFolder) return

  isLoading.value = true

  try {
    const result = await window.electronAPI.watermarkPDFBuffer(
      toBinaryFiles(watermarkFiles.value),
      outputFolder,
      options,
    )

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
  width: min(920px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  max-height: calc(100vh - 48px);
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
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, #fdfefe 100%);
  border: 1px solid rgba(226, 232, 240, 0.88);
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
  max-width: 520px;

  h1 {
    margin: 10px 0 8px;
    font-size: 30px;
    line-height: 1.15;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
    line-height: 1.7;
  }
}

.header-kicker {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.1);
  color: #2b6cb0;
  font-size: 12px;
  font-weight: 600;
}

.header-side {
  min-width: 240px;
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

.settings-button {
  height: 46px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #409eff 0%, #267df2 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 14px 28px rgba(64, 158, 255, 0.24);
}

.settings-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 32px rgba(64, 158, 255, 0.3);
}

.tool-tabs {
  flex: 1;
  min-height: 0;
}

.workspace-footer {
  margin-top: 14px;
  font-size: 12px;
  color: #94a3b8;
  text-align: left;
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

:deep(.el-tabs__header) {
  margin-bottom: 18px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e7edf5;
}

:deep(.el-tabs__item) {
  height: 42px;
  padding: 0 18px;
  font-size: 15px;
  color: #64748b;
}

:deep(.el-tabs__item.is-active) {
  color: #1d4ed8;
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
}

:deep(.el-tabs__content) {
  overflow: visible;
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
  }
}

@media (max-width: 720px) {
  .workspace-main {
    padding: 18px;
  }

  .header-copy {
    h1 {
      font-size: 24px;
    }
  }
}
</style>
