<template>
  <div class="tool-panel split-panel">
    <div
      id="dropArea"
      :class="{ hover: dropHover }"
      @dragover.prevent="dropHover = true"
      @dragleave.prevent="dropHover = false"
      @drop="handleDrop"
      @click="handleClickUpload"
    >
      <div class="upload-copy">
        <strong>上传单个 PDF</strong>
        <span>拆分页一次处理一个文件</span>
      </div>
    </div>

    <div class="top-grid">
      <section class="surface-card status-card">
        <span class="section-kicker">Pages</span>
        <div class="page-row">
          <strong>{{ pageCountLoading ? '...' : pageCount ?? '--' }}</strong>
          <span>总页数</span>
        </div>
        <p>{{ pageStatusText }}</p>
      </section>

      <section class="surface-card">
        <div class="section-head">
          <div>
            <span class="section-kicker">Mode</span>
            <h3>拆分方式</h3>
          </div>
          <span class="section-note">先选规则，再填写参数</span>
        </div>

        <el-radio-group v-model="splitMode" class="mode-switch">
          <el-radio-button label="interval">按页数拆分</el-radio-button>
          <el-radio-button label="custom">提取指定页</el-radio-button>
        </el-radio-group>

        <p class="mode-description">{{ currentModeMeta.description }}</p>
      </section>
    </div>

    <div class="config-grid">
      <section class="surface-card">
        <div class="section-head">
          <div>
            <span class="section-kicker">Rule</span>
            <h3>{{ splitMode === 'interval' ? '拆分参数' : '页码范围' }}</h3>
          </div>
          <span class="section-note">{{ splitMode === 'interval' ? '连续输出多个文件' : '多个区间会合并为一个结果' }}</span>
        </div>

        <div v-if="splitMode === 'interval'" class="interval-panel">
          <div class="field-row">
            <span class="field-label">每个文件页数</span>
            <el-input-number
              v-model="pagesPerFile"
              :min="1"
              :max="pageCount || 1"
              controls-position="right"
            />
          </div>

          <div class="mini-tags">
            <span v-if="estimatedParts">预计输出 {{ estimatedParts }} 个文件</span>
            <span>适合均匀拆分</span>
          </div>
        </div>

        <div v-else class="custom-panel">
          <div class="range-toolbar">
            <span class="field-label">页码区间</span>
            <button class="ghost-button" type="button" @click="handleAddRange">添加一行</button>
          </div>

          <div class="range-list">
            <div
              v-for="(pageRange, index) in customPageRanges"
              :key="pageRange.id"
              class="range-item"
            >
              <span class="range-index">{{ index + 1 }}</span>

              <div class="range-field">
                <span>开始</span>
                <el-input-number
                  v-model="pageRange.startPage"
                  :min="1"
                  :max="pageCount || 9999"
                  controls-position="right"
                />
              </div>

              <div class="range-field">
                <span>结束</span>
                <el-input-number
                  v-model="pageRange.endPage"
                  :min="1"
                  :max="pageCount || 9999"
                  controls-position="right"
                />
              </div>

              <button
                class="remove-button"
                type="button"
                :disabled="customPageRanges.length === 1"
                @click="handleRemoveRange(pageRange.id)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="surface-card note-card">
        <span class="section-kicker">Hint</span>
        <h3>{{ currentModeMeta.title }}</h3>
        <p>{{ currentModeMeta.tip }}</p>

        <div class="mini-tags">
          <span>自动校验页码</span>
          <span>输出到目录</span>
          <span>保留原件</span>
        </div>
      </section>
    </div>

    <div class="action-bar">
      <span class="action-hint">页数读取完成后即可开始处理。</span>
      <button :disabled="pageCountLoading || !pageCount" type="button" class="primary-button" @click="handleSplit">
        开始拆分
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'

type PdfFile = { name: string; buffer: ArrayBuffer }
type SplitPageRange = {
  startPage: number
  endPage: number
}
type SplitSubmitOptions =
  | { mode: 'interval'; pagesPerFile: number }
  | { mode: 'custom'; pageRanges: SplitPageRange[] }
type EditableSplitPageRange = {
  id: number
  startPage: number | undefined
  endPage: number | undefined
}
type SplitModeMeta = {
  title: string
  description: string
  tip: string
}

const props = defineProps<{
  pageCount: number | null
  pageCountLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:fileList', fileList: PdfFile[]): void
  (e: 'handleSplit', options: SplitSubmitOptions): void
}>()

const splitModeMetaMap: Record<'interval' | 'custom', SplitModeMeta> = {
  interval: {
    title: '按页数拆分',
    description: '按固定页数连续拆开，适合均匀分发和分批归档。',
    tip: '输入每份保留多少页，系统会自动连续拆分。',
  },
  custom: {
    title: '提取指定页',
    description: '按多个页码区间提取内容，适合保留封面、合同页或附件页。',
    tip: '每行填写一个开始页和结束页，多个区间会按顺序合并到一个结果里。',
  },
}

const createRangeItem = (id: number): EditableSplitPageRange => ({
  id,
  startPage: undefined,
  endPage: undefined,
})

const dropHover = ref(false)
const splitMode = ref<'interval' | 'custom'>('interval')
const pagesPerFile = ref(1)
const customPageRanges = ref<EditableSplitPageRange[]>([createRangeItem(1)])
const nextRangeId = ref(2)

const currentModeMeta = computed(() => splitModeMetaMap[splitMode.value])

const pageStatusText = computed(() => {
  if (props.pageCountLoading) {
    return '正在读取页数，请稍候。'
  }

  if (!props.pageCount) {
    return '上传文件后，这里会显示总页数。'
  }

  return `已识别 ${props.pageCount} 页，可以开始设置拆分规则。`
})

const estimatedParts = computed(() => {
  if (!props.pageCount || !pagesPerFile.value) {
    return null
  }

  return Math.ceil(props.pageCount / pagesPerFile.value)
})

watch(() => props.pageCount, (pageCount) => {
  if (pageCount && pagesPerFile.value > pageCount) {
    pagesPerFile.value = pageCount
  }

  if (!pageCount) {
    return
  }

  customPageRanges.value = customPageRanges.value.map((range) => ({
    ...range,
    startPage: typeof range.startPage === 'number' ? Math.min(range.startPage, pageCount) : range.startPage,
    endPage: typeof range.endPage === 'number' ? Math.min(range.endPage, pageCount) : range.endPage,
  }))
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
    ElMessage.warning('拆分页一次只能处理一个文件，已保留第一个。')
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

const handleAddRange = () => {
  customPageRanges.value.push(createRangeItem(nextRangeId.value))
  nextRangeId.value += 1
}

const handleRemoveRange = (id: number) => {
  if (customPageRanges.value.length === 1) {
    return
  }

  customPageRanges.value = customPageRanges.value.filter((range) => range.id !== id)
}

const getNormalizedCustomRanges = () => {
  if (!customPageRanges.value.length) {
    ElMessage.error('请至少填写一组页码范围')
    return null
  }

  const normalizedRanges: SplitPageRange[] = []

  for (const [index, pageRange] of customPageRanges.value.entries()) {
    const startPage = pageRange.startPage
    const endPage = pageRange.endPage
    const rowLabel = `第 ${index + 1} 行`

    if (typeof startPage !== 'number' || !Number.isInteger(startPage) || typeof endPage !== 'number' || !Number.isInteger(endPage)) {
      ElMessage.error(`${rowLabel} 需要填写完整的开始页和结束页`)
      return null
    }

    if (startPage < 1 || endPage < 1) {
      ElMessage.error(`${rowLabel} 的页码必须大于 0`)
      return null
    }

    if (startPage > endPage) {
      ElMessage.error(`${rowLabel} 的开始页不能大于结束页`)
      return null
    }

    if (props.pageCount && endPage > props.pageCount) {
      ElMessage.error(`${rowLabel} 超出了文档总页数`)
      return null
    }

    normalizedRanges.push({ startPage, endPage })
  }

  return normalizedRanges
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

  const normalizedRanges = getNormalizedCustomRanges()

  if (!normalizedRanges) {
    return
  }

  emit('handleSplit', {
    mode: 'custom',
    pageRanges: normalizedRanges,
  })
}
</script>

<style scoped lang="scss">
.tool-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

#dropArea {
  border: 1px dashed rgba(20, 184, 166, 0.42);
  border-radius: 22px;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(20, 184, 166, 0.12), transparent 58%),
    linear-gradient(180deg, #fbfffe 0%, #f1fcf9 100%);
  cursor: pointer;
  transition: border-color 0.24s ease, transform 0.24s ease;
}

#dropArea:hover,
#dropArea.hover {
  border-color: #14b8a6;
  transform: translateY(-1px);
}

.upload-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;

  strong {
    color: #0f172a;
    font-size: 18px;
    letter-spacing: -0.03em;
  }

  span {
    color: #64748b;
    font-size: 14px;
  }
}

.top-grid,
.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.surface-card {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #dcefeb;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  text-align: left;
}

.status-card {
  background:
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 42%),
    linear-gradient(180deg, #f8fffd 0%, #ffffff 100%);
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.page-row {
  margin-top: 14px;
  display: flex;
  align-items: flex-end;
  gap: 10px;

  strong {
    color: #0f766e;
    font-size: 42px;
    line-height: 1;
    letter-spacing: -0.05em;
  }

  span {
    color: #64748b;
    font-size: 14px;
    padding-bottom: 4px;
  }
}

.status-card p,
.mode-description,
.note-card p {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-head h3,
.note-card h3 {
  margin: 10px 0 0;
  color: #0f172a;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.section-note {
  color: #94a3b8;
  font-size: 12px;
}

.mode-switch {
  width: 100%;
}

.interval-panel,
.custom-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-row,
.range-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.field-label {
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.mini-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    padding: 7px 10px;
    border-radius: 999px;
    background: #f4fbfa;
    border: 1px solid #dcefeb;
    color: #51616f;
    font-size: 12px;
    font-weight: 600;
  }
}

.ghost-button,
.remove-button {
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}

.ghost-button {
  padding: 10px 14px;
  background: #e9fbf8;
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
}

.ghost-button:hover {
  transform: translateY(-1px);
}

.range-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.range-item {
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fbfffe 0%, #f7fbfb 100%);
  border: 1px solid #dcefeb;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 10px;
  align-items: end;
}

.range-index {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
  font-size: 13px;
  font-weight: 800;
}

.range-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.remove-button {
  padding: 10px 14px;
  background: #fff1f2;
  color: #e11d48;
  font-size: 13px;
  font-weight: 700;
}

.remove-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.remove-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.note-card {
  background:
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 40%),
    linear-gradient(180deg, #f8fffd 0%, #ffffff 100%);
}

.action-bar {
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fffd 0%, #ffffff 100%);
  border: 1px solid #dcefeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-hint {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
  text-align: left;
}

.primary-button {
  border: none;
  border-radius: 12px;
  padding: 12px 22px;
  background: linear-gradient(135deg, #14b8a6 0%, #0f9889 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 14px 28px rgba(20, 184, 166, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(20, 184, 166, 0.28);
}

.primary-button:disabled {
  background: #8ad8cf;
  box-shadow: none;
  cursor: not-allowed;
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

:deep(.el-input-number) {
  width: 180px;
}

.range-field :deep(.el-input-number) {
  width: 100%;
}

@media (max-width: 900px) {
  .top-grid,
  .config-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .section-head,
  .field-row,
  .range-toolbar,
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .range-item {
    grid-template-columns: 1fr;
  }
}
</style>
