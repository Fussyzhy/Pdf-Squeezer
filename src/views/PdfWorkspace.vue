<template>
  <div class="container" v-loading="isLoading">
    <h2>PDF 工具箱</h2>

    <el-tabs v-model="activeTab" class="tool-tabs">
      <el-tab-pane label="PDF 压缩" name="compress">
        <compress-view
          v-model:compression-level="compressionLevel"
          @update:fileList="handleCompressFileListUpdate"
          @handle-compress="handleCompress"
        />
      </el-tab-pane>

      <el-tab-pane label="PDF 合并" name="merge">
        <merge-view
          @update:fileList="handleMergeFileListUpdate"
          @handle-merge="handleMerge"
        />
      </el-tab-pane>

      <el-tab-pane label="PDF 拆分" name="split">
        <split-view
          :page-count="splitPageCount"
          :page-count-loading="splitPageCountLoading"
          @update:fileList="handleSplitFileListUpdate"
          @handle-split="handleSplit"
        />
      </el-tab-pane>

      <el-tab-pane label="格式转换" name="convert">
        <div class="placeholder">
          PDF 转换功能开发中
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="setting-btn">
      <el-icon @click="handleOpenSettings"><Setting /></el-icon>
    </div>

    <div
      v-if="activeTab !== 'convert'"
      class="file-list-container"
      :class="{ hide: !fileListVisible }"
    >
      <pdf-file-list
        v-model="currentFileList"
        :visible="fileListVisible"
        @update:visible="handleFileListVisibleChange"
      />
    </div>
  </div>

  <div class="tag">@Design by Haoyang</div>
  <system-setting-dialog v-model="settingsVisible" />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import CompressView from '@/views/components/CompressView.vue'
import MergeView from '@/views/components/MergeView.vue'
import PdfFileList from '@/views/components/PdfFileList.vue'
import SplitView from '@/views/components/SplitView.vue'
import SystemSettingDialog from '@/views/components/dialog/SystemSettingDialog.vue'

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default'
type ToolTab = 'compress' | 'merge' | 'split' | 'convert'
type FileTab = Exclude<ToolTab, 'convert'>
type PdfFile = { name: string; buffer: ArrayBuffer }
type SplitSubmitOptions =
  | { mode: 'interval'; pagesPerFile: number }
  | { mode: 'custom'; pageRanges: string }

const DEFAULT_COMPRESSION_LEVEL: CompressionLevel = 'ebook'
const compressionLevels: CompressionLevel[] = ['screen', 'ebook', 'printer', 'prepress', 'default']

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
const compressionLevel = ref<CompressionLevel>(getSavedCompressionLevel())
const compressFiles = ref<PdfFile[]>([])
const mergeFiles = ref<PdfFile[]>([])
const splitFiles = ref<PdfFile[]>([])
const splitPageCount = ref<number | null>(null)
const splitPageCountLoading = ref(false)
const splitPageCountRequestId = ref(0)

const currentFileList = computed<PdfFile[]>({
  get() {
    if (activeTab.value === 'merge') return mergeFiles.value
    if (activeTab.value === 'split') return splitFiles.value
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

    if (activeTab.value === 'compress') {
      compressFiles.value = value
    }
  },
})

watch(compressionLevel, (level) => {
  localStorage.setItem('compressionLevel', level)
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
        ElMessage.error(result.error || '读取 PDF 总页数失败')
      }
    } catch (err) {
      if (requestId === splitPageCountRequestId.value) {
        ElMessage.error('读取 PDF 总页数失败')
        console.log(err)
      }
    } finally {
      if (requestId === splitPageCountRequestId.value) {
        splitPageCountLoading.value = false
      }
    }
  },
  { deep: true },
)

const handleOpenSettings = () => {
  settingsVisible.value = true
}

const getFilesForTab = (tab: FileTab) => {
  if (tab === 'merge') return mergeFiles.value
  if (tab === 'split') return splitFiles.value
  return compressFiles.value
}

const setFilesForTab = (tab: FileTab, files: PdfFile[]) => {
  if (tab === 'merge') {
    mergeFiles.value = files
    return
  }

  if (tab === 'split') {
    splitFiles.value = files
    return
  }

  compressFiles.value = files
}

const updateFileList = (tab: FileTab, incomingFiles: PdfFile[]) => {
  if (!incomingFiles.length) return

  fileListVisible.value = true

  if (tab === 'split') {
    if (incomingFiles.length > 1) {
      ElMessage.warning('PDF 拆分一次只能处理一个文件，已保留第一个文件')
    }

    const [firstFile] = incomingFiles
    if (!firstFile) return

    setFilesForTab(tab, [firstFile])
    ElMessage.success('文件已添加到列表')
    return
  }

  setFilesForTab(tab, [...getFilesForTab(tab), ...incomingFiles])
  ElMessage.success('文件已添加到列表')
}

const handleCompressFileListUpdate = (files: PdfFile[]) => updateFileList('compress', files)
const handleMergeFileListUpdate = (files: PdfFile[]) => updateFileList('merge', files)
const handleSplitFileListUpdate = (files: PdfFile[]) => updateFileList('split', files)
const handleFileListVisibleChange = (visible: boolean) => {
  fileListVisible.value = visible
}

const requireOutputFolder = () => {
  const outputFolder = localStorage.getItem('outputFolder')

  if (!outputFolder) {
    ElMessage.error('请先设置输出文件夹')
    return null
  }

  return outputFolder
}

const handleCompress = async () => {
  if (!compressFiles.value.length) {
    ElMessage.error('请先上传 PDF 文件')
    return
  }

  const outputFolder = requireOutputFolder()
  if (!outputFolder) return

  isLoading.value = true

  try {
    const files = compressFiles.value.map((item) => ({
      name: item.name,
      buffer: new Uint8Array(item.buffer),
    }))

    const result = await window.electronAPI.compressPDFBuffer(files, outputFolder, compressionLevel.value)

    if (result.success) {
      ElMessage.success('压缩完成')
    } else {
      ElMessage.error('压缩失败')
      console.log(result.error)
    }
  } catch (err) {
    ElMessage.error('压缩失败')
    console.log(err)
  } finally {
    isLoading.value = false
  }
}

const handleMerge = async () => {
  if (!mergeFiles.value.length) {
    ElMessage.error('请先上传 PDF 文件')
    return
  }

  const outputFolder = requireOutputFolder()
  if (!outputFolder) return

  isLoading.value = true

  try {
    const files = mergeFiles.value.map((item) => ({
      name: item.name,
      buffer: new Uint8Array(item.buffer),
    }))

    const result = await window.electronAPI.mergePDFBuffer(files, outputFolder)

    if (result.success) {
      ElMessage.success('合并完成')
    } else {
      ElMessage.error('合并失败')
      console.log(result.error)
    }
  } catch (err) {
    ElMessage.error('合并失败')
    console.log(err)
  } finally {
    isLoading.value = false
  }
}

const handleSplit = async (options: SplitSubmitOptions) => {
  if (!splitFiles.value.length) {
    ElMessage.error('请先上传 PDF 文件')
    return
  }

  if (splitPageCountLoading.value) {
    ElMessage.warning('正在读取 PDF 总页数，请稍候')
    return
  }

  if (!splitPageCount.value) {
    ElMessage.error('暂时无法读取 PDF 总页数')
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
        ElMessage.success(`拆分完成，已生成 ${outputFilesCount} 个文档`)
      } else {
        ElMessage.success('拆分完成')
      }
    } else {
      ElMessage.error('拆分失败')
      console.log(result.error)
    }
  } catch (err) {
    ElMessage.error('拆分失败')
    console.log(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.container {
  background: #fff;
  padding: 40px 50px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 540px;
  position: relative;
  min-height: 620px;
  overflow: hidden;

  .setting-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 20px;
    cursor: pointer;
    color: #333;
    transition: color 0.3s;

    &:hover {
      color: #409eff;
    }
  }

  .file-list-container {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 320px;
    bottom: 16px;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 10px;
    z-index: 10;
    transition: all 0.3s ease;
    display: flex;
    overflow: visible;

    &.hide {
      transform: translateX(104%);
    }

    &:hover {
      &.hide {
        transform: translateX(100%);
      }
    }
  }
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

.tool-tabs {
  margin-top: 10px;
}

.placeholder {
  padding: 40px;
  color: #888;
}

.tag {
  font-size: 12px;
  color: #999;
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 720px) {
  .container {
    width: calc(100vw - 32px);
    min-height: 520px;
    padding: 32px 20px;
  }
}
</style>
