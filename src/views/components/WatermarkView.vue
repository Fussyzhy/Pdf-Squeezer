<template>
  <div class="tool-panel watermark-panel">
    <section class="hero-card hero-card--watermark">
      <div class="hero-badge">水印工具</div>
      <h3>为 PDF 批量添加文字或图片水印</h3>
      <p>支持文字与图片两种水印类型，可设置透明度、角度与铺满方式，适合内部资料与品牌标识。</p>
      <div class="hero-tags">
        <span>文字/图片水印</span>
        <span>批量处理</span>
        <span>铺满与居中</span>
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
      <span id="inputPath">点击或拖拽 PDF 文件到这里上传</span>
    </div>

    <div class="option-grid">
      <section class="form-card">
        <div class="card-header">
          <span class="card-title">水印内容</span>
          <span class="card-tip">先选择水印类型，再配置内容</span>
        </div>

        <el-radio-group v-model="sourceType" class="source-type">
          <el-radio-button label="text">文字水印</el-radio-button>
          <el-radio-button label="image">图片水印</el-radio-button>
        </el-radio-group>

        <div v-if="sourceType === 'text'" class="text-source">
          <el-input
            v-model="textValue"
            type="textarea"
            :rows="3"
            placeholder="输入水印文字，可换行"
            maxlength="120"
            show-word-limit
          />
          <div class="text-controls">
            <div class="control-item">
              <span class="control-label">文字颜色</span>
              <input v-model="textColor" class="color-input" type="color" />
            </div>
            <div class="control-item">
              <span class="control-label">字号</span>
              <el-input-number v-model="fontSize" :min="18" :max="120" controls-position="right" />
            </div>
          </div>
        </div>

        <div v-else class="image-source">
          <div class="image-meta">
            <strong>{{ imageName || '尚未选择水印图片' }}</strong>
            <span>支持 PNG / JPEG</span>
          </div>
          <button type="button" class="secondary-button" @click="handleSelectImage">
            选择图片
          </button>
          <input ref="imageInput" type="file" accept="image/png,image/jpeg" @change="handleImageChange" hidden />
        </div>
      </section>

      <section class="form-card">
        <div class="card-header">
          <span class="card-title">水印样式</span>
          <span class="card-tip">透明度与角度会作用于全部页面</span>
        </div>

        <div class="style-row">
          <span class="control-label">布局方式</span>
          <el-radio-group v-model="placement" class="placement-group">
            <el-radio-button label="center">居中</el-radio-button>
            <el-radio-button label="tile">铺满</el-radio-button>
          </el-radio-group>
        </div>

        <div class="style-row">
          <span class="control-label">透明度 {{ Math.round(opacity * 100) }}%</span>
          <el-slider v-model="opacity" :min="0.05" :max="0.6" :step="0.01" />
        </div>

        <div class="style-row">
          <span class="control-label">大小 {{ Math.round(size * 100) }}%</span>
          <el-slider v-model="size" :min="0.15" :max="0.8" :step="0.01" />
        </div>

        <div class="style-row">
          <span class="control-label">旋转角度</span>
          <el-input-number v-model="rotation" :min="-180" :max="180" controls-position="right" />
        </div>

        <div v-if="placement === 'tile'" class="style-row">
          <span class="control-label">铺满间距</span>
          <el-slider v-model="tileGap" :min="0" :max="160" :step="4" />
        </div>
      </section>
    </div>

    <div class="action-bar">
      <span class="action-hint">
        建议先设置输出目录，再执行水印处理，生成文件不会覆盖原 PDF。
      </span>
      <button type="button" class="primary-button" @click="handleWatermark">
        开始加水印
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'

type PdfFile = { name: string; buffer: ArrayBuffer }

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

const emit = defineEmits<{
  (e: 'update:fileList', fileList: PdfFile[]): void
  (e: 'handle-watermark', options: WatermarkSubmitOptions): void
}>()

const dropHover = ref(false)
const sourceType = ref<'text' | 'image'>('text')
const textValue = ref('仅供内部使用')
const textColor = ref('#2b6cb0')
const fontSize = ref(48)
const placement = ref<WatermarkPlacement>('center')
const opacity = ref(0.22)
const rotation = ref(-30)
const size = ref(0.35)
const tileGap = ref(60)
const imagePayload = ref<WatermarkImagePayload | null>(null)
const imageName = ref('')
const imageInput = ref<HTMLInputElement | null>(null)

const fontFamily = computed(() =>
  'Microsoft YaHei, PingFang SC, Hiragino Sans GB, Segoe UI, sans-serif',
)

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

  const results = await Promise.all(Array.from(files).map(readPdfFile))
  const validFiles = results.filter((file) => file !== null) as PdfFile[]

  emit('update:fileList', validFiles)
}

const handleClickUpload = async () => {
  const files = await window.electronAPI.selectInputFiles()

  if (files.length) {
    emit('update:fileList', files)
  }
}

const handleSelectImage = () => {
  imageInput.value?.click()
}

const getImageSize = (file: File) => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(url)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }

    image.src = url
  })
}

const readImageFile = async (file: File): Promise<WatermarkImagePayload | null> => {
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
  const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || /\.jpe?g$/.test(file.name.toLowerCase())

  if (!isPng && !isJpeg) {
    ElMessage.error('请选择 PNG 或 JPEG 图片')
    return null
  }

  const [buffer, size] = await Promise.all([
    file.arrayBuffer(),
    getImageSize(file),
  ])

  return {
    data: new Uint8Array(buffer),
    width: size.width,
    height: size.height,
    format: isPng ? 'png' : 'jpeg',
  }
}

const handleImageChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    const payload = await readImageFile(file)
    if (!payload) return

    imagePayload.value = payload
    imageName.value = file.name
  } catch (err) {
    ElMessage.error('读取图片失败，请重试')
    console.error(err)
  } finally {
    if (imageInput.value) {
      imageInput.value.value = ''
    }
  }
}

const renderTextToImage = async (): Promise<WatermarkImagePayload | null> => {
  const content = textValue.value.trim()
  if (!content) {
    ElMessage.error('请输入水印文字')
    return null
  }

  const lines = content.split(/\r?\n/)
  const padding = Math.round(fontSize.value * 0.6)
  const lineHeight = Math.round(fontSize.value * 1.3)
  const ratio = window.devicePixelRatio || 1

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    ElMessage.error('无法生成水印图片')
    return null
  }

  ctx.font = `${fontSize.value}px ${fontFamily.value}`

  const maxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width), fontSize.value)
  const width = Math.ceil(maxWidth + padding * 2)
  const height = Math.ceil(lineHeight * lines.length + padding * 2)

  canvas.width = Math.ceil(width * ratio)
  canvas.height = Math.ceil(height * ratio)
  ctx.scale(ratio, ratio)
  ctx.font = `${fontSize.value}px ${fontFamily.value}`
  ctx.fillStyle = textColor.value
  ctx.textBaseline = 'top'

  lines.forEach((line, index) => {
    ctx.fillText(line, padding, padding + index * lineHeight)
  })

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) {
    ElMessage.error('无法生成水印图片')
    return null
  }

  const buffer = await blob.arrayBuffer()

  return {
    data: new Uint8Array(buffer),
    width: canvas.width,
    height: canvas.height,
    format: 'png',
  }
}

const handleWatermark = async () => {
  let watermarkImage: WatermarkImagePayload | null = null

  if (sourceType.value === 'text') {
    watermarkImage = await renderTextToImage()
  } else {
    watermarkImage = imagePayload.value

    if (!watermarkImage) {
      ElMessage.error('请先选择水印图片')
      return
    }
  }

  if (!watermarkImage) return

  emit('handle-watermark', {
    watermarkImage,
    placement: placement.value,
    opacity: opacity.value,
    rotation: rotation.value,
    size: size.value,
    tileGap: tileGap.value,
    offsetX: 0,
    offsetY: 0,
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
  background: linear-gradient(135deg, #fff1f2 0%, #fffafc 100%);
  border: 1px solid #f5c2c7;

  h3 {
    margin: 8px 0 6px;
    font-size: 22px;
  }

  p {
    margin: 0;
    color: #6f4e53;
    line-height: 1.6;
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(244, 63, 94, 0.14);
  color: #be123c;
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
    border: 1px solid rgba(244, 63, 94, 0.2);
    color: #7a4a52;
    font-size: 12px;
  }
}

#dropArea {
  border: 2px dashed #f3a1ad;
  border-radius: 14px;
  padding: 26px 24px;
  color: #6b7280;
  transition: all 0.28s ease;
  cursor: pointer;
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #fff9fb;

  &:hover,
  &.hover {
    border-color: #f43f5e;
    background: #ffe9ee;
    color: #1f2937;

    #inputPath {
      color: #e11d48;
    }
  }
}

.option-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 14px;
}

.form-card {
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #f1e3e5;
  text-align: left;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.card-tip {
  font-size: 12px;
  color: #909399;
}

.source-type {
  width: 100%;
}

.text-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 13px;
  color: #667085;
}

.color-input {
  width: 100%;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 0 6px;
  background: #fff;
}

.image-source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.image-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    color: #1f2937;
    font-size: 14px;
  }

  span {
    font-size: 12px;
    color: #94a3b8;
  }
}

.secondary-button {
  background-color: #fff;
  color: #e11d48;
  border: 1px solid #f3a1ad;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.secondary-button:hover {
  background: #ffe9ee;
}

.style-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.placement-group {
  width: 100%;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff5f6;
  border: 1px solid #f6d3d9;
}

.action-hint {
  font-size: 13px;
  color: #667085;
  text-align: left;
}

.primary-button {
  background-color: #f43f5e;
  color: white;
  border: none;
  padding: 12px 22px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  white-space: nowrap;
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  box-shadow: 0 10px 20px rgba(244, 63, 94, 0.22);
}

.primary-button:hover {
  background-color: #e11d48;
  transform: translateY(-1px);
}

:deep(.el-input-number) {
  width: 140px;
}

:deep(.el-slider) {
  width: 100%;
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

@media (max-width: 720px) {
  .option-grid {
    grid-template-columns: 1fr;
  }

  .text-controls {
    grid-template-columns: 1fr;
  }

  .image-source,
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
