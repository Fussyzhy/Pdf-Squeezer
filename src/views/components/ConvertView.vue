<template>
  <div class="convert-panel">
    <div
      id="dropArea"
      :class="{ hover: dropHover }"
      @dragover.prevent="dropHover = true"
      @dragleave.prevent="dropHover = false"
      @drop="handleDrop"
      @click="handleClickUpload"
    >
      <div class="upload-copy">
        <strong>上传源文件</strong>
        <span>{{ uploadPrompt }}</span>
      </div>
    </div>

    <section class="surface-card">
      <div class="section-head">
        <div>
          <span class="section-kicker">Mode</span>
          <h3>转换方式</h3>
        </div>
        <span class="section-note">当前先支持 PDF 转图片</span>
      </div>

      <div class="mode-grid">
        <button
          v-for="option in convertModeOptions"
          :key="option.value"
          type="button"
          class="mode-card"
          :class="{
            active: option.value === convertMode,
            disabled: !option.available,
          }"
          @click="handleModeSelect(option)"
        >
          <strong>{{ option.label }}</strong>
          <span>{{ option.available ? '可用' : '规划中' }}</span>
        </button>
      </div>
    </section>

    <div v-if="convertMode === 'pdf-to-image'" class="config-grid">
      <section class="surface-card">
        <div class="section-head">
          <div>
            <span class="section-kicker">Format</span>
            <h3>输出格式</h3>
          </div>
        </div>

        <el-radio-group v-model="imageFormat" class="format-switch">
          <el-radio-button label="png">PNG</el-radio-button>
          <el-radio-button label="jpeg">JPEG</el-radio-button>
        </el-radio-group>

        <p class="section-copy">{{ imageFormat === 'png' ? '更清晰，适合保留细节。' : '更轻量，适合快速分享。' }}</p>
      </section>

      <section class="surface-card summary-card">
        <div class="section-head">
          <div>
            <span class="section-kicker">Quality</span>
            <h3>清晰度</h3>
          </div>
        </div>

        <el-select v-model="dpi" class="dpi-select">
          <el-option
            v-for="option in dpiOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <div class="summary-tags">
          <span>{{ dpi }} DPI</span>
          <span>{{ imageFormat.toUpperCase() }}</span>
          <span>按页导出</span>
        </div>
      </section>
    </div>

    <div class="action-bar">
      <span class="action-hint">{{ currentModeMeta.hint }}</span>
      <button type="button" class="primary-button" @click="handleConvert">开始转换</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

type PdfFile = { name: string; buffer: ArrayBuffer }
type SupportedConvertMode = 'pdf-to-image'
type ConvertMode = SupportedConvertMode | 'image-to-pdf'
type ConvertSubmitOptions = {
  mode: 'pdf-to-image'
  imageFormat: 'png' | 'jpeg'
  dpi: number
}

type ConvertModeMeta = {
  label: string
  value: ConvertMode
  hint: string
  available: boolean
}

const convertModeOptions: ConvertModeMeta[] = [
  {
    label: 'PDF 转图片',
    value: 'pdf-to-image',
    hint: '会按页导出图片，并为每个 PDF 创建独立输出文件夹。',
    available: true,
  },
  {
    label: '图片转 PDF',
    value: 'image-to-pdf',
    hint: '该模式仍在规划中，当前先支持 PDF 转图片。',
    available: false,
  },
]

const dpiOptions = [
  { label: '150 DPI', value: 150 },
  { label: '200 DPI', value: 200 },
  { label: '300 DPI', value: 300 },
]

const emit = defineEmits<{
  (e: 'update:fileList', fileList: PdfFile[]): void
  (e: 'handleConvert', options: ConvertSubmitOptions): void
}>()

const dropHover = ref(false)
const convertMode = ref<ConvertMode>('pdf-to-image')
const imageFormat = ref<'png' | 'jpeg'>('png')
const dpi = ref(150)

const currentModeMeta = computed<ConvertModeMeta>(() => {
  return convertModeOptions.find((option) => option.value === convertMode.value) ?? convertModeOptions[0]
})

const uploadPrompt = computed(() => {
  if (convertMode.value === 'pdf-to-image') {
    return '点击或拖拽 PDF 到这里'
  }

  return '该模式暂未开放上传'
})

const handleModeSelect = (option: ConvertModeMeta) => {
  if (!option.available) {
    ElMessage.info('图片转 PDF 仍在规划中')
    return
  }

  convertMode.value = option.value
}

const readSourceFile = (file: File) => {
  return new Promise<PdfFile | null>((resolve) => {
    if (convertMode.value === 'pdf-to-image' && !file.name.toLowerCase().endsWith('.pdf')) {
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

  if (convertMode.value !== 'pdf-to-image') {
    ElMessage.info('当前仅支持 PDF 转图片')
    return
  }

  const files = event.dataTransfer?.files
  if (!files || !files.length) return

  const results = await Promise.all(Array.from(files).map(readSourceFile))
  const validFiles = results.filter((file) => file !== null) as PdfFile[]

  emit('update:fileList', validFiles)
}

const handleClickUpload = async () => {
  if (convertMode.value !== 'pdf-to-image') {
    ElMessage.info('当前仅支持 PDF 转图片')
    return
  }

  const files = await window.electronAPI.selectInputFiles()

  if (files.length) {
    emit('update:fileList', files)
  }
}

const handleConvert = () => {
  if (convertMode.value !== 'pdf-to-image') {
    ElMessage.info('当前仅支持 PDF 转图片')
    return
  }

  emit('handleConvert', {
    mode: 'pdf-to-image',
    imageFormat: imageFormat.value,
    dpi: dpi.value,
  })
}
</script>

<style scoped lang="scss">
.convert-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

#dropArea {
  border: 1px dashed rgba(103, 194, 58, 0.42);
  border-radius: 22px;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(103, 194, 58, 0.12), transparent 58%),
    linear-gradient(180deg, #fcfffc 0%, #f3fbef 100%);
  cursor: pointer;
  transition: border-color 0.24s ease, transform 0.24s ease;
}

#dropArea:hover,
#dropArea.hover {
  border-color: #67c23a;
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

.surface-card {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e1ebe1;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  text-align: left;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(103, 194, 58, 0.12);
  color: #2f8f2d;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.section-head h3 {
  margin: 10px 0 0;
  color: #0f172a;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.section-note {
  color: #94a3b8;
  font-size: 12px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mode-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid #d7e7d7;
  background: linear-gradient(180deg, #ffffff 0%, #f8fcf7 100%);
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  strong {
    display: block;
    color: #0f172a;
    font-size: 16px;
  }

  span {
    display: inline-flex;
    margin-top: 8px;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(103, 194, 58, 0.1);
    color: #2f8f2d;
    font-size: 12px;
    font-weight: 700;
  }
}

.mode-card:hover {
  transform: translateY(-1px);
}

.mode-card.active {
  border-color: #67c23a;
  box-shadow: 0 14px 28px rgba(103, 194, 58, 0.14);
}

.mode-card.disabled {
  opacity: 0.6;
}

.mode-card.disabled span {
  background: #eef2f0;
  color: #7b8a7d;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.section-copy {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

.summary-card {
  background:
    radial-gradient(circle at top right, rgba(103, 194, 58, 0.14), transparent 42%),
    linear-gradient(180deg, #fafff9 0%, #ffffff 100%);
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;

  span {
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid #d7e7d7;
    color: #51616f;
    font-size: 12px;
    font-weight: 600;
  }
}

.dpi-select {
  width: 100%;
}

.action-bar {
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fafff9 0%, #ffffff 100%);
  border: 1px solid #e1ebe1;
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
  background: linear-gradient(135deg, #67c23a 0%, #4ea828 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 14px 28px rgba(103, 194, 58, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(103, 194, 58, 0.28);
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

@media (max-width: 860px) {
  .mode-grid,
  .config-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .section-head,
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
