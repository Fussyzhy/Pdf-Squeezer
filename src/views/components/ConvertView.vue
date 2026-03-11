<template>
  <div class="convert-panel">
    <section class="hero-card">
      <div class="hero-badge">格式转换</div>
      <h3>先选择转换方式，再配置输出格式</h3>
      <p>当前先支持 PDF 转图片，后续可以继续扩展图片转 PDF 等更多转换类型。</p>
    </section>

    <div
      id="dropArea"
      :class="{ hover: dropHover }"
      @dragover.prevent="dropHover = true"
      @dragleave.prevent="dropHover = false"
      @drop="handleDrop"
      @click="handleClickUpload"
    >
      <span id="inputPath">{{ uploadPrompt }}</span>
    </div>

    <section class="form-group">
      <div class="section-header">
        <span class="option-title">转换方式</span>
        <span class="option-tip">先选处理方向，再配置输出细节</span>
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
          <div class="mode-card__header">
            <strong>{{ option.label }}</strong>
            <span>{{ option.available ? '已支持' : '规划中' }}</span>
          </div>
          <p>{{ option.description }}</p>
        </button>
      </div>
    </section>

    <div v-if="convertMode === 'pdf-to-image'" class="config-grid">
      <section class="form-group">
        <span class="option-title">输出图片格式</span>
        <el-radio-group v-model="imageFormat">
          <el-radio-button label="png">PNG</el-radio-button>
          <el-radio-button label="jpeg">JPEG</el-radio-button>
        </el-radio-group>
        <span class="option-tip">PNG 更清晰，JPEG 文件更小，适合快速分享。</span>
      </section>

      <section class="form-group">
        <div class="option-row">
          <span class="option-title">输出清晰度</span>
          <el-select v-model="dpi" class="dpi-select">
            <el-option
              v-for="option in dpiOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        <span class="option-tip">DPI 越高越清晰，但导出的图片体积也会更大。</span>
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
  description: string
  hint: string
  available: boolean
}

const convertModeOptions: ConvertModeMeta[] = [
  {
    label: 'PDF 转图片',
    value: 'pdf-to-image',
    description: '把 PDF 的每一页导出成独立图片，适合做预览图、素材图和分发浏览。',
    hint: '当前会为每个 PDF 创建独立文件夹，并按页码顺序输出图片。',
    available: true,
  },
  {
    label: '图片转 PDF',
    value: 'image-to-pdf',
    description: '未来可把多张图片按顺序整理成一个 PDF，适合票据、截图和扫描件归档。',
    hint: '该模式还在规划中，当前先支持 PDF 转图片。',
    available: false,
  },
]

const dpiOptions = [
  { label: '150 DPI（推荐）', value: 150 },
  { label: '200 DPI', value: 200 },
  { label: '300 DPI（更清晰）', value: 300 },
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
  return convertModeOptions.find((option) => option.value === convertMode.value) ?? convertModeOptions[0]!
})

const uploadPrompt = computed(() => {
  if (convertMode.value === 'pdf-to-image') {
    return '点击或拖拽 PDF 文件到这里上传'
  }

  return '该转换方式暂未开放上传'
})

const handleModeSelect = (option: ConvertModeMeta) => {
  if (!option.available) {
    ElMessage.info('该转换方式正在规划中，当前先支持 PDF 转图片')
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
    ElMessage.info('该转换方式正在规划中，当前先支持 PDF 转图片')
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
    ElMessage.info('该转换方式正在规划中，当前先支持 PDF 转图片')
    return
  }

  const files = await window.electronAPI.selectInputFiles()

  if (files.length) {
    emit('update:fileList', files)
  }
}

const handleConvert = () => {
  if (convertMode.value !== 'pdf-to-image') {
    ElMessage.info('该转换方式正在规划中，当前先支持 PDF 转图片')
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
  gap: 14px;
}

.hero-card {
  padding: 18px 20px;
  border-radius: 16px;
  text-align: left;
  color: #1f2a37;
  background: linear-gradient(135deg, #eef8f1 0%, #fbfefb 100%);
  border: 1px solid #d7ecd9;

  h3 {
    margin: 8px 0 6px;
    font-size: 22px;
  }

  p {
    margin: 0;
    color: #5d6b61;
    line-height: 1.6;
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(103, 194, 58, 0.14);
  color: #2f8f2d;
  font-size: 12px;
  font-weight: 600;
}

#dropArea {
  border: 2px dashed #9ec7a4;
  border-radius: 14px;
  padding: 30px;
  color: #6b7280;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #fcfffc;

  &:hover,
  &.hover {
    border-color: #67c23a;
    background: #f3fbef;
    color: #1f2937;

    #inputPath {
      color: #4eaf2b;
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e7efe7;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.section-header,
.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mode-card {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #dbe8dd;
  background: #fcfffc;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  p {
    margin: 10px 0 0;
    color: #647067;
    line-height: 1.6;
    font-size: 13px;
  }
}

.mode-card:hover {
  transform: translateY(-1px);
  border-color: #67c23a;
}

.mode-card.active {
  border-color: #67c23a;
  background: #f3fbef;
  box-shadow: 0 12px 24px rgba(103, 194, 58, 0.14);
}

.mode-card.disabled {
  opacity: 0.72;
  background: #f8faf8;
}

.mode-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  strong {
    color: #253039;
    font-size: 15px;
  }

  span {
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(103, 194, 58, 0.14);
    color: #2f8f2d;
    font-size: 11px;
    font-weight: 600;
  }
}

.mode-card.disabled .mode-card__header span {
  background: #eef2f0;
  color: #7b8a7d;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.option-tip,
.action-hint {
  font-size: 12px;
  color: #909399;
}

.dpi-select {
  width: 180px;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f7fbf7;
  border: 1px solid #e1ebe1;
}

.primary-button {
  background-color: #67c23a;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  box-shadow: 0 10px 20px rgba(103, 194, 58, 0.2);
}

.primary-button:hover {
  background-color: #57b02b;
  transform: translateY(-1px);
}

:deep(.el-select),
:deep(.el-radio-group) {
  width: 100%;
}

:deep(.el-radio-group) {
  display: flex;
}

:deep(.el-radio-button) {
  flex: 1;
}

:deep(.el-radio-button__inner) {
  width: 100%;
}

@media (max-width: 720px) {
  .mode-grid,
  .config-grid {
    grid-template-columns: 1fr;
  }

  .section-header,
  .option-row,
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>