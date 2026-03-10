<template>
  <div class="split-panel">
    <div
      id="dropArea"
      :class="{ hover: dropHover }"
      @dragover.prevent="dropHover = true"
      @dragleave.prevent="dropHover = false"
      @drop="handleDrop"
      @click="handleClickUpload"
    >
      <span id="inputPath">
        点击或拖拽单个 PDF 文件到这里上传
      </span>
    </div>

    <div class="summary-card">
      <span class="summary-label">PDF 总页数</span>
      <span class="summary-value">{{ pageCountLoading ? '读取中...' : pageCount ?? '--' }}</span>
    </div>

    <div class="mode-group">
      <span class="option-title">拆分方式</span>
      <el-radio-group v-model="splitMode">
        <el-radio-button label="interval">平均拆分</el-radio-button>
        <el-radio-button label="custom">自定义提取</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="splitMode === 'interval'" class="form-group">
      <div class="option-row">
        <span class="option-title">每个文档页数</span>
        <el-input-number
          v-model="pagesPerFile"
          :min="1"
          :max="pageCount || 1"
          controls-position="right"
        />
      </div>
      <span class="option-tip">例如输入 3，则每 3 页生成一个新的 PDF 文档。</span>
    </div>

    <div v-else class="form-group">
      <span class="option-title">自定义页码范围</span>
      <el-input
        v-model="customPageRanges"
        placeholder="例如 1-3,5-6"
        clearable
      />
      <span class="option-tip">会把这些页提取出来，合并生成一个新的 PDF 文档。</span>
    </div>

    <button :disabled="pageCountLoading || !pageCount" @click="handleSplit">
      开始拆分
    </button>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'

type PdfFile = { name: string; buffer: ArrayBuffer }
type SplitSubmitOptions =
  | { mode: 'interval'; pagesPerFile: number }
  | { mode: 'custom'; pageRanges: string }

const props = defineProps<{
  pageCount: number | null
  pageCountLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:fileList', fileList: PdfFile[]): void
  (e: 'handleSplit', options: SplitSubmitOptions): void
}>()

const dropHover = ref(false)
const splitMode = ref<'interval' | 'custom'>('interval')
const pagesPerFile = ref(1)
const customPageRanges = ref('')

watch(() => props.pageCount, (pageCount) => {
  if (pageCount && pagesPerFile.value > pageCount) {
    pagesPerFile.value = pageCount
  }
})

const readPdfFile = (file: File) => {
  return new Promise<PdfFile | null>((resolve) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      ElMessage.error(`${file.name} 不是 PDF 文件`)
      return resolve(null)
    }

    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, buffer: reader.result as ArrayBuffer })
    reader.onerror = () => resolve(null)
    reader.readAsArrayBuffer(file)
  })
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  dropHover.value = false

  const files = event.dataTransfer?.files
  if (!files || !files.length) return

  if (files.length > 1) {
    ElMessage.warning('PDF 拆分一次只能处理一个文件，已保留第一个文件')
  }

  const firstFile = files.item(0)
  if (!firstFile) return

  const parsedFile = await readPdfFile(firstFile)

  if (parsedFile) {
    emit('update:fileList', [parsedFile])
  }
}

const handleClickUpload = async () => {
  const files = await window.electronAPI.selectInputFiles(false)
  const [firstFile] = files

  if (firstFile) {
    emit('update:fileList', [firstFile])
  }
}

const handleSplit = () => {
  if (props.pageCountLoading) {
    ElMessage.warning('正在读取页数，请稍候')
    return
  }

  if (!props.pageCount) {
    ElMessage.error('请先上传 PDF 文件')
    return
  }

  if (splitMode.value === 'interval') {
    emit('handleSplit', {
      mode: 'interval',
      pagesPerFile: pagesPerFile.value,
    })
    return
  }

  if (!customPageRanges.value.trim()) {
    ElMessage.error('请输入要提取的页码范围')
    return
  }

  emit('handleSplit', {
    mode: 'custom',
    pageRanges: customPageRanges.value,
  })
}
</script>

<style scoped lang="scss">
.split-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

#dropArea {
  border: 2px dashed #aaa;
  border-radius: 10px;
  padding: 30px;
  margin: 20px 0 0;
  color: #777;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;

  &:hover,
  &.hover {
    border-color: #409eff;
    background: #40a0ff1e;
    color: #333;

    #inputPath {
      color: #409eff;
    }
  }
}

.summary-card,
.mode-group,
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.summary-card {
  padding: 14px 16px;
  border-radius: 10px;
  background: #f7f9fc;
  border: 1px solid #e4ebf5;
}

.summary-label,
.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.summary-value {
  font-size: 28px;
  line-height: 1;
  color: #409eff;
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.option-tip {
  font-size: 12px;
  color: #909399;
}

:deep(.el-radio-group) {
  display: flex;
  width: 100%;
}

:deep(.el-radio-button) {
  flex: 1;
}

:deep(.el-radio-button__inner) {
  width: 100%;
}

button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 12px 20px;
  margin: 6px 0 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s, transform 0.2s;
}

button:hover:not(:disabled) {
  background-color: #40a0ffd0;
  transform: translateY(-2px);
}

button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style>
