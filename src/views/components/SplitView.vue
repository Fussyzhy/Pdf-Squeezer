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
      <span id="inputPath">点击或拖拽单个 PDF 文件到这里上传</span>
    </div>

    <div class="option-grid">
      <section class="form-card">
        <div class="card-header">
          <span class="card-title">文件信息</span>
          <span class="card-tip">拆分前会先读取总页数</span>
        </div>

        <div class="summary-row">
          <div class="summary-block">
            <span class="summary-label">PDF 总页数</span>
            <strong class="summary-value">{{ pageCountLoading ? '读取中...' : pageCount ?? '--' }}</strong>
          </div>

          <div class="summary-status">
            {{ pageCountLoading ? '正在解析文档页数，请稍候。' : '上传完成后即可选择拆分方式并开始处理。' }}
          </div>
        </div>
      </section>

      <section class="info-card">
        <span class="card-title">拆分方式</span>
        <el-radio-group v-model="splitMode">
          <el-radio-button label="interval">平均拆分</el-radio-button>
          <el-radio-button label="custom">自定义提取</el-radio-button>
        </el-radio-group>
        <strong>{{ currentModeMeta.title }}</strong>
        <p>{{ currentModeMeta.description }}</p>
        <span class="info-scene">{{ currentModeMeta.scene }}</span>
      </section>
    </div>

    <div class="config-grid">
      <section class="form-card">
        <div v-if="splitMode === 'interval'" class="form-group">
          <div class="option-row">
            <span class="option-title">每个文件页数</span>
            <el-input-number
              v-model="pagesPerFile"
              :min="1"
              :max="pageCount || 1"
              controls-position="right"
            />
          </div>
          <span class="option-tip">例如输入 3，则每 3 页生成一个新的 PDF 文件。</span>
        </div>

        <el-scrollbar v-else class="form-group list">
          <div class="option-row option-row--ranges">
            <span class="option-title">自定义页码范围</span>
            <button class="range-add-button" type="button" @click="handleAddRange">
              添加
            </button>
          </div>

          <div class="range-list">
            <div
              v-for="(pageRange, index) in customPageRanges"
              :key="pageRange.id"
              class="range-item"
            >
              <span class="range-index">#{{ index + 1 }}</span>

              <div class="range-field">
                <el-input
                  v-model="pageRange.startPage"
                  :min="1"
                  :max="pageCount || 9999"
                  controls-position="right"
                  type="number"
                  :controls="false"
                />
              </div>

              <span class="range-separator">至</span>

              <div class="range-field">
                <el-input
                  v-model="pageRange.endPage"
                  :min="1"
                  :max="pageCount || 9999"
                  controls-position="right"
                  type="number"
                  :controls="false"
                />
              </div>

              <button
                class="range-remove-button"
                type="button"
                :disabled="customPageRanges.length === 1"
                @click="handleRemoveRange(pageRange.id)"
              >
                <el-icon>
                  <Delete/>
                </el-icon>
              </button>
            </div>
          </div>

          <span class="option-tip">每条范围都会按顺序提取并合并到同一个新 PDF 中，单页可填写为 5 到 5。</span>
        </el-scrollbar>
      </section>

      <section class="tip-card">
        <strong>使用建议</strong>
        <p>{{ currentModeMeta.tip }}</p>
      </section>
    </div>

    <div class="step-strip">
      <div class="step-item">
        <span>1</span>
        <strong>上传 PDF</strong>
        <p>拆分功能一次只处理一个文档。</p>
      </div>
      <div class="step-item">
        <span>2</span>
        <strong>设置规则</strong>
        <p>可以按固定页数平均拆分，也可以用多条页码范围提取指定内容。</p>
      </div>
      <div class="step-item">
        <span>3</span>
        <strong>开始处理</strong>
        <p>处理结果会保存到你设置的输出目录中。</p>
      </div>
    </div>

    <div class="action-bar">
      <span class="action-hint">建议先确认页数读取完成，再执行拆分，避免范围设置超过文档页数。</span>
      <button :disabled="pageCountLoading || !pageCount" type="button" @click="handleSplit">
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
  scene: string
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
    title: '平均拆分',
    description: '按固定页数连续拆分，适合把大文档均匀切成多个小文件。',
    scene: '适用场景：章节整理、分批发送、按份归档。',
    tip: '如果文档页数较多，建议先按较小页数拆分，后续更方便单独发送和检查。',
  },
  custom: {
    title: '自定义提取',
    description: '按多条页码范围提取内容，适合只保留需要的页面组合。',
    scene: '适用场景：提取合同页、摘要页、封面和附件。',
    tip: '每条范围都需要填写起始页和结束页，处理时会按列表顺序合并到一个新文件中。',
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
    ElMessage.error('请至少添加一条页码范围')
    return null
  }

  const normalizedRanges: SplitPageRange[] = []

  for (const [index, pageRange] of customPageRanges.value.entries()) {
    const rowLabel = `第 ${index + 1} 条范围`
    const startPage = pageRange.startPage
    const endPage = pageRange.endPage

    if (typeof startPage !== 'number' || !Number.isInteger(startPage) || typeof endPage !== 'number' || !Number.isInteger(endPage)) {
      ElMessage.error(`${rowLabel} 请填写完整的起始页和结束页`)
      return null
    }

    if (startPage < 1 || endPage < 1) {
      ElMessage.error(`${rowLabel} 的页码必须大于 0`)
      return null
    }

    if (startPage > endPage) {
      ElMessage.error(`${rowLabel} 的起始页不能大于结束页`)
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
  border: 2px dashed #8fd2c7;
  border-radius: 14px;
  padding: 26px 24px;
  color: #63706d;
  transition: all 0.28s ease;
  cursor: pointer;
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #fbfffe;

  &:hover,
  &.hover {
    border-color: #14b8a6;
    background: #eefcf9;
    color: #1f2937;

    #inputPath {
      color: #0f9f92;
    }
  }
}

.option-grid,
.config-grid,
.step-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.step-strip {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.form-card,
.info-card,
.tip-card {
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e3efed;
  text-align: left;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.card-title,
.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.card-tip,
.option-tip,
.info-scene {
  font-size: 12px;
  color: #909399;
}

.summary-row {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
}

.summary-block {
  min-width: 132px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  font-size: 13px;
  color: #5f6b68;
}

.summary-value {
  font-size: 30px;
  line-height: 1;
  color: #0f9f92;
}

.summary-status {
  flex: 1;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f4fbfa;
  border: 1px solid #ddf2ef;
  color: #5f6b68;
  font-size: 13px;
  line-height: 1.6;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 10px;

  strong {
    color: #1f2937;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: #606266;
    line-height: 1.6;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.list {
    min-height: 300px;
    max-height: 300px;
    overflow: auto;
  }
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.option-row--ranges {
  align-items: flex-start;
  margin-bottom: 20px;
}

.range-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.range-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fbfb;
  border: 1px solid #e2efec;
}

.range-index {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
}

.range-field {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;

  :deep(.el-input) {
    .el-input__wrapper {
      box-shadow: none;
      background-color: #ffffff;
    }
  }
}

.range-label {
  font-size: 12px;
  color: #667085;
}

.range-separator {
  color: #5f6b68;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.range-add-button,
.range-remove-button {
  border: none;
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}

.range-add-button {
  height: 24px;
  padding: 0 14px;
  background: #e9fbf8;
  color: #0f766e;
  font-size: 13px;
  font-weight: 600;
}

.range-add-button:hover {
  background: #d8f7f1;
}

.range-remove-button {
  align-self: flex-end;
  height: 34px;
  padding: 0 12px;
  color: #ff6d6d;
  font-size: 18px;
  display: flex;
  align-items: center;
  background-color: transparent;
}

.range-remove-button:hover:not(:disabled) {
  color: #ff8f8f;
}

.range-remove-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.tip-card {
  strong {
    display: block;
    margin-bottom: 8px;
    color: #245b55;
    font-size: 15px;
  }

  p {
    margin: 0;
    color: #667085;
    line-height: 1.7;
  }
}

.step-item {
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfffe 0%, #ffffff 100%);
  border: 1px solid #dcefeb;
  text-align: left;

  span {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(20, 184, 166, 0.14);
    color: #0f766e;
    font-size: 12px;
    font-weight: 700;
  }

  strong {
    display: block;
    margin: 10px 0 6px;
    color: #244540;
  }

  p {
    margin: 0;
    color: #667085;
    line-height: 1.6;
    font-size: 13px;
  }
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e9eef5;
}

.action-hint {
  font-size: 13px;
  color: #667085;
  text-align: left;
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

.option-row :deep(.el-input-number) {
  width: 180px;
}

.range-field :deep(.el-input-number) {
  width: 100%;
}

.action-bar > button {
  background-color: #14b8a6;
  color: white;
  border: none;
  padding: 12px 22px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  white-space: nowrap;
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  box-shadow: 0 10px 20px rgba(20, 184, 166, 0.2);
}

.action-bar > button:hover:not(:disabled) {
  background-color: #0fa596;
  transform: translateY(-1px);
}

.action-bar > button:disabled {
  background-color: #8ad8cf;
  box-shadow: none;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .option-grid,
  .config-grid,
  .step-strip {
    grid-template-columns: 1fr;
  }

  .summary-row,
  .action-bar,
  .card-header,
  .option-row,
  .range-item {
    flex-direction: column;
    align-items: stretch;
  }

  .range-index {
    align-self: flex-start;
  }

  .range-separator {
    padding-top: 0;
    align-self: center;
  }

  .range-add-button,
  .range-remove-button {
    width: 100%;
    justify-content: center;
  }

  .option-row :deep(.el-input-number),
  .range-field :deep(.el-input-number) {
    width: 100%;
  }
}
</style>
