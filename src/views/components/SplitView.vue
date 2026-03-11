<template>
  <div class="tool-panel split-panel">
    <section class="hero-card hero-card--split">
      <div class="hero-badge">拆分工具</div>
      <h3>按页拆分或提取指定页面</h3>
      <p>适合把长文档拆成多个小文件，或者单独提取需要的页码，便于发送、归档和二次整理。</p>
      <div class="hero-tags">
        <span>单文件处理</span>
        <span>支持平均拆分</span>
        <span>支持自定义页码</span>
      </div>
    </section>

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
            {{ pageCountLoading ? '正在解析文档页数，请稍候。' : '上传后即可选择拆分方式并开始处理。' }}
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
          <span class="option-tip">会把这些页提取出来，并合并生成一个新的 PDF 文档。</span>
        </div>
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
        <strong>选择方式</strong>
        <p>可按固定页数拆分，也可提取指定页码。</p>
      </div>
      <div class="step-item">
        <span>3</span>
        <strong>开始拆分</strong>
        <p>输出结果会保存在你设置的输出目录中。</p>
      </div>
    </div>

    <div class="action-bar">
      <span class="action-hint">建议先确认页数读取完成，再执行拆分，避免参数设置不准确。</span>
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
type SplitSubmitOptions =
  | { mode: 'interval'; pagesPerFile: number }
  | { mode: 'custom'; pageRanges: string }
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
    description: '按固定页数连续拆分，适合把大文档均匀切分成多个小文件。',
    scene: '适用场景：章节整理、分批发送、按份归档。',
    tip: '如果文档页数很多，建议先按较小页数拆分，后续更方便单独发送和检查。',
  },
  custom: {
    title: '自定义提取',
    description: '按指定页码范围提取内容，适合只保留需要的页面组合。',
    scene: '适用场景：提取合同页、摘要页、封面和附件。',
    tip: '页码范围支持逗号和连字符，例如 1-3,5,8-10。建议先确认原文档总页数。',
  },
}

const dropHover = ref(false)
const splitMode = ref<'interval' | 'custom'>('interval')
const pagesPerFile = ref(1)
const customPageRanges = ref('')

const currentModeMeta = computed(() => splitModeMetaMap[splitMode.value])

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
.tool-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-card {
  padding: 18px 20px;
  border-radius: 16px;
  text-align: left;
  color: #1f2a37;
  background: linear-gradient(135deg, #effcfa 0%, #fbfefe 100%);
  border: 1px solid #cfeee8;

  h3 {
    margin: 8px 0 6px;
    font-size: 22px;
  }

  p {
    margin: 0;
    color: #5d6f6c;
    line-height: 1.6;
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.14);
  color: #0f766e;
  font-size: 12px;
  font-weight: 600;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;

  span {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(20, 184, 166, 0.18);
    color: #4b6360;
    font-size: 12px;
  }
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
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

:deep(.el-input-number) {
  width: 180px;
}

button {
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

button:hover:not(:disabled) {
  background-color: #0fa596;
  transform: translateY(-1px);
}

button:disabled {
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
  .option-row {
    flex-direction: column;
    align-items: stretch;
  }

  :deep(.el-input-number) {
    width: 100%;
  }
}
</style>