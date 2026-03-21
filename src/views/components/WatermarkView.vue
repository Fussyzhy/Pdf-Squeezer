<template>
  <div class="tool-panel watermark-panel">
    <div
      id="dropArea"
      :class="{ hover: dropHover }"
      @dragover.prevent="dropHover = true"
      @dragleave.prevent="dropHover = false"
      @drop="handleDrop"
      @click="handleClickUpload"
    >
      <div class="upload-copy">
        <strong>上传 PDF</strong>
        <span>点击或拖拽文件到这里</span>
      </div>
    </div>

    <div class="preview-grid">
      <section class="preview-card">
        <div class="card-header">
          <div>
            <span class="card-kicker">Preview</span>
            <h3>实时预览</h3>
          </div>
          <span class="card-note">{{ previewDescription }}</span>
        </div>

        <div class="preview-stage">
          <canvas ref="previewCanvas" class="preview-canvas" width="720" height="980" />
        </div>

        <div class="preview-tags">
          <span>{{ sourceType === 'text' ? '文字水印' : '图片水印' }}</span>
          <span>{{ placement === 'center' ? '居中' : '铺满' }}</span>
          <span>透明度 {{ Math.round(opacity * 100) }}%</span>
        </div>
      </section>

      <section class="control-panel">
        <section class="control-card">
          <div class="card-header">
            <div>
              <span class="card-kicker">Content</span>
              <h3>水印内容</h3>
            </div>
          </div>

          <el-radio-group v-model="sourceType" class="source-type">
            <el-radio-button label="text">文字</el-radio-button>
            <el-radio-button label="image">图片</el-radio-button>
          </el-radio-group>

          <div v-if="sourceType === 'text'" class="text-source">
            <el-input
              v-model="textValue"
              type="textarea"
              :rows="3"
              placeholder="输入水印文字"
              maxlength="120"
              show-word-limit
            />

            <div class="inline-grid">
              <div class="field">
                <span>颜色</span>
                <input v-model="textColor" class="color-input" type="color" />
              </div>

              <div class="field">
                <span>字号</span>
                <el-input-number v-model="fontSize" :min="18" :max="120" controls-position="right" />
              </div>
            </div>
          </div>

          <div v-else class="image-source">
            <div class="image-meta">
              <strong>{{ imageName || '未选择图片' }}</strong>
              <span>支持 PNG / JPEG</span>
            </div>

            <button type="button" class="ghost-button" @click="handleSelectImage">选择图片</button>
            <input ref="imageInput" type="file" accept="image/png,image/jpeg" @change="handleImageChange" hidden />
          </div>
        </section>

        <section class="control-card">
          <div class="card-header">
            <div>
              <span class="card-kicker">Style</span>
              <h3>显示样式</h3>
            </div>
          </div>

          <div class="field stack">
            <span>布局</span>
            <el-radio-group v-model="placement" class="placement-group">
              <el-radio-button label="center">居中</el-radio-button>
              <el-radio-button label="tile">铺满</el-radio-button>
            </el-radio-group>
          </div>

          <div class="field stack">
            <span>透明度 {{ Math.round(opacity * 100) }}%</span>
            <el-slider v-model="opacity" :min="0.05" :max="0.6" :step="0.01" />
          </div>

          <div class="field stack">
            <span>大小 {{ Math.round(size * 100) }}%</span>
            <el-slider v-model="size" :min="0.15" :max="0.8" :step="0.01" />
          </div>

          <div class="inline-grid">
            <div class="field">
              <span>旋转角度</span>
              <el-input-number v-model="rotation" :min="-180" :max="180" controls-position="right" />
            </div>

            <div v-if="placement === 'tile'" class="field">
              <span>间距</span>
              <el-input-number v-model="tileGap" :min="0" :max="160" controls-position="right" />
            </div>
          </div>

          <div class="quick-tags">
            <span>{{ sourceType === 'text' ? previewTextSummary : (imageName || '未选图片') }}</span>
            <span>旋转 {{ rotation }}°</span>
          </div>
        </section>
      </section>
    </div>

    <div class="action-bar">
      <span class="action-hint">会生成新的带水印 PDF，不覆盖原文件。</span>
      <button type="button" class="primary-button" @click="handleWatermark">开始加水印</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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

type PreviewSource = {
  element: HTMLCanvasElement | HTMLImageElement
  width: number
  height: number
}

const PREVIEW_WIDTH = 720
const PREVIEW_HEIGHT = 980
const PAGE_MARGIN = 34

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
const previewCanvas = ref<HTMLCanvasElement | null>(null)
const imagePreviewUrl = ref('')
const imagePreviewElement = ref<HTMLImageElement | null>(null)

const fontFamily = computed(() =>
  'Microsoft YaHei, PingFang SC, Hiragino Sans GB, Segoe UI, sans-serif',
)

const previewTextSummary = computed(() => {
  const normalized = textValue.value.trim().replace(/\s*\r?\n\s*/g, ' / ')

  if (!normalized) {
    return '未输入文字'
  }

  return normalized.length > 18 ? `${normalized.slice(0, 18)}...` : normalized
})

const previewDescription = computed(() => {
  if (sourceType.value === 'image' && !imagePayload.value) {
    return '选择图片后这里会显示效果'
  }

  if (sourceType.value === 'text' && !textValue.value.trim()) {
    return '输入文字后会自动生成预览'
  }

  return placement.value === 'tile'
    ? '当前为铺满布局'
    : '当前为居中布局'
})

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

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

const loadImageElement = (url: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = url
  })
}

const revokePreviewImage = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
  }

  imagePreviewElement.value = null
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

  const nextPreviewUrl = URL.createObjectURL(file)

  try {
    const [payload, previewImage] = await Promise.all([
      readImageFile(file),
      loadImageElement(nextPreviewUrl),
    ])

    if (!payload) {
      URL.revokeObjectURL(nextPreviewUrl)
      return
    }

    revokePreviewImage()
    imagePayload.value = payload
    imagePreviewUrl.value = nextPreviewUrl
    imagePreviewElement.value = previewImage
    imageName.value = file.name
    renderPreview()
  } catch (err) {
    URL.revokeObjectURL(nextPreviewUrl)
    ElMessage.error('读取图片失败，请重试')
    console.error(err)
  } finally {
    if (imageInput.value) {
      imageInput.value.value = ''
    }
  }
}

const createTextWatermarkCanvas = () => {
  const content = textValue.value.trim()

  if (!content) {
    return null
  }

  const lines = content.split(/\r?\n/)
  const padding = Math.round(fontSize.value * 0.6)
  const lineHeight = Math.round(fontSize.value * 1.3)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  ctx.font = `${fontSize.value}px ${fontFamily.value}`

  const maxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width), fontSize.value)
  const width = Math.ceil(maxWidth + padding * 2)
  const height = Math.ceil(lineHeight * lines.length + padding * 2)

  canvas.width = width
  canvas.height = height

  const nextCtx = canvas.getContext('2d')
  if (!nextCtx) {
    return null
  }

  nextCtx.clearRect(0, 0, width, height)
  nextCtx.font = `${fontSize.value}px ${fontFamily.value}`
  nextCtx.fillStyle = textColor.value
  nextCtx.textBaseline = 'top'

  lines.forEach((line, index) => {
    nextCtx.fillText(line, padding, padding + index * lineHeight)
  })

  return canvas
}

const canvasToPayload = async (canvas: HTMLCanvasElement): Promise<WatermarkImagePayload | null> => {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))

  if (!blob) {
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

const renderTextToImage = async (): Promise<WatermarkImagePayload | null> => {
  const canvas = createTextWatermarkCanvas()

  if (!canvas) {
    ElMessage.error('请输入水印文字')
    return null
  }

  const payload = await canvasToPayload(canvas)

  if (!payload) {
    ElMessage.error('无法生成水印图片')
    return null
  }

  return payload
}

const getCurrentPreviewSource = (): PreviewSource | null => {
  if (sourceType.value === 'text') {
    const canvas = createTextWatermarkCanvas()

    if (!canvas) {
      return null
    }

    return {
      element: canvas,
      width: canvas.width,
      height: canvas.height,
    }
  }

  if (!imagePayload.value || !imagePreviewElement.value) {
    return null
  }

  return {
    element: imagePreviewElement.value,
    width: imagePayload.value.width,
    height: imagePayload.value.height,
  }
}

const resolvePreviewScale = (pageWidth: number, pageHeight: number, sourceWidth: number, sourceHeight: number) => {
  const safeSize = clamp(size.value, 0.05, 0.95)
  const targetWidth = pageWidth * safeSize
  const targetHeight = pageHeight * safeSize
  const widthScale = targetWidth / sourceWidth
  const heightScale = targetHeight / sourceHeight
  const scale = Math.min(widthScale, heightScale)

  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  }
}

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.min(radius, width / 2, height / 2)

  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const drawMockPage = (
  ctx: CanvasRenderingContext2D,
  pageX: number,
  pageY: number,
  pageWidth: number,
  pageHeight: number,
) => {
  ctx.save()
  ctx.fillStyle = '#f4f7fb'
  ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)

  ctx.shadowColor = 'rgba(15, 23, 42, 0.12)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 18
  drawRoundedRect(ctx, pageX, pageY, pageWidth, pageHeight, 24)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  ctx.save()
  drawRoundedRect(ctx, pageX, pageY, pageWidth, pageHeight, 24)
  ctx.strokeStyle = '#e4eaf3'
  ctx.lineWidth = 2
  ctx.stroke()

  const contentX = pageX + 42
  const contentWidth = pageWidth - 84

  drawRoundedRect(ctx, contentX, pageY + 36, 172, 24, 12)
  ctx.fillStyle = '#eff6ff'
  ctx.fill()

  ctx.fillStyle = '#2b6cb0'
  ctx.font = `700 18px ${fontFamily.value}`
  ctx.fillText('PDF Summary Report', contentX + 18, pageY + 53)

  ctx.fillStyle = '#cbd5e1'
  const lineYs = [118, 148, 178, 208, 282, 312, 342, 372]
  lineYs.forEach((lineY, index) => {
    const widthFactor = index % 3 === 0 ? 1 : index % 3 === 1 ? 0.88 : 0.72
    drawRoundedRect(ctx, contentX, pageY + lineY, contentWidth * widthFactor, 12, 6)
    ctx.fill()
  })

  drawRoundedRect(ctx, contentX, pageY + 420, contentWidth, 178, 18)
  ctx.fillStyle = '#f8fafc'
  ctx.fill()

  drawRoundedRect(ctx, contentX + 22, pageY + 446, contentWidth * 0.36, 112, 16)
  ctx.fillStyle = '#e0f2fe'
  ctx.fill()

  drawRoundedRect(ctx, contentX + 22 + contentWidth * 0.36 + 18, pageY + 446, contentWidth * 0.5 - 18, 14, 7)
  ctx.fillStyle = '#dbeafe'
  ctx.fill()

  drawRoundedRect(ctx, contentX + 22 + contentWidth * 0.36 + 18, pageY + 476, contentWidth * 0.42, 12, 6)
  ctx.fillStyle = '#d7dee8'
  ctx.fill()

  drawRoundedRect(ctx, contentX + 22 + contentWidth * 0.36 + 18, pageY + 502, contentWidth * 0.46, 12, 6)
  ctx.fill()

  drawRoundedRect(ctx, contentX + 22 + contentWidth * 0.36 + 18, pageY + 528, contentWidth * 0.38, 12, 6)
  ctx.fill()

  drawRoundedRect(ctx, contentX, pageY + pageHeight - 70, contentWidth * 0.26, 12, 6)
  ctx.fillStyle = '#e2e8f0'
  ctx.fill()

  ctx.fillStyle = '#94a3b8'
  ctx.font = `500 18px ${fontFamily.value}`
  ctx.fillText('Page 1', pageX + pageWidth - 110, pageY + pageHeight - 34)
  ctx.restore()
}

const drawEmptyPreview = (
  ctx: CanvasRenderingContext2D,
  pageX: number,
  pageY: number,
  pageWidth: number,
  pageHeight: number,
) => {
  const boxWidth = pageWidth - 128
  const boxHeight = 132
  const boxX = pageX + (pageWidth - boxWidth) / 2
  const boxY = pageY + (pageHeight - boxHeight) / 2

  ctx.save()
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 20)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.fill()
  ctx.setLineDash([12, 10])
  ctx.strokeStyle = '#f3a1ad'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#be123c'
  ctx.font = `700 22px ${fontFamily.value}`
  ctx.fillText('预览会显示在这里', boxX + 28, boxY + 52)

  ctx.fillStyle = '#7c5a60'
  ctx.font = `500 16px ${fontFamily.value}`
  ctx.fillText('先设置内容和样式，再查看最终大致效果', boxX + 28, boxY + 86)
  ctx.restore()
}

const drawWatermarkAtCenter = (
  ctx: CanvasRenderingContext2D,
  source: PreviewSource,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
) => {
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate((rotation.value * Math.PI) / 180)
  ctx.globalAlpha = clamp(opacity.value, 0.05, 1)
  ctx.drawImage(source.element, -width / 2, -height / 2, width, height)
  ctx.restore()
}

const renderPreview = () => {
  const canvas = previewCanvas.value

  if (!canvas) {
    return
  }

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return
  }

  const pageX = PAGE_MARGIN
  const pageY = PAGE_MARGIN
  const pageWidth = PREVIEW_WIDTH - PAGE_MARGIN * 2
  const pageHeight = PREVIEW_HEIGHT - PAGE_MARGIN * 2

  ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)
  drawMockPage(ctx, pageX, pageY, pageWidth, pageHeight)

  const source = getCurrentPreviewSource()

  if (!source) {
    drawEmptyPreview(ctx, pageX, pageY, pageWidth, pageHeight)
    return
  }

  const { width, height } = resolvePreviewScale(pageWidth, pageHeight, source.width, source.height)

  if (placement.value === 'tile') {
    const stepX = width + tileGap.value
    const stepY = height + tileGap.value
    const startX = -width
    const startY = -height
    const endX = pageWidth + width
    const endY = pageHeight + height

    for (let x = startX; x <= endX; x += stepX) {
      for (let y = startY; y <= endY; y += stepY) {
        drawWatermarkAtCenter(ctx, source, pageX + x + width / 2, pageY + y + height / 2, width, height)
      }
    }

    return
  }

  drawWatermarkAtCenter(ctx, source, pageX + pageWidth / 2, pageY + pageHeight / 2, width, height)
}

watch(
  [sourceType, textValue, textColor, fontSize, placement, opacity, rotation, size, tileGap, imagePayload],
  () => {
    renderPreview()
  },
)

onMounted(() => {
  renderPreview()
})

onBeforeUnmount(() => {
  revokePreviewImage()
})

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

#dropArea {
  border: 1px dashed rgba(244, 63, 94, 0.38);
  border-radius: 22px;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(244, 63, 94, 0.12), transparent 58%),
    linear-gradient(180deg, #fffafb 0%, #fff2f5 100%);
  cursor: pointer;
  transition: border-color 0.24s ease, transform 0.24s ease;
}

#dropArea:hover,
#dropArea.hover {
  border-color: #f43f5e;
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

.preview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 14px;
}

.preview-card,
.control-card {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #f3e3e6;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  text-align: left;
}

.preview-card {
  background:
    radial-gradient(circle at top right, rgba(244, 63, 94, 0.14), transparent 42%),
    linear-gradient(180deg, #fffafb 0%, #ffffff 100%);
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.card-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(244, 63, 94, 0.12);
  color: #be123c;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.card-header h3 {
  margin: 10px 0 0;
  color: #0f172a;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.card-note {
  color: #94a3b8;
  font-size: 12px;
}

.preview-stage {
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff6f7 0%, #fffdfd 100%);
  border: 1px solid #f6d3d9;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-canvas {
  width: min(100%, 420px);
  height: auto;
  aspect-ratio: 720 / 980;
  display: block;
  border-radius: 20px;
}

.preview-tags,
.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-tags {
  margin-top: 14px;
}

.preview-tags span,
.quick-tags span {
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #f3e3e6;
  color: #51616f;
  font-size: 12px;
  font-weight: 600;
}

.source-type,
.placement-group {
  width: 100%;
}

.text-source,
.field.stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inline-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  span {
    color: #475569;
    font-size: 13px;
    font-weight: 600;
  }
}

.color-input {
  width: 100%;
  height: 40px;
  border-radius: 12px;
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
    font-size: 15px;
  }

  span {
    color: #94a3b8;
    font-size: 12px;
  }
}

.ghost-button {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  background: #fff1f2;
  color: #e11d48;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.2s ease, background 0.2s ease;
}

.ghost-button:hover {
  transform: translateY(-1px);
  background: #ffe6eb;
}

.action-bar {
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffafb 0%, #ffffff 100%);
  border: 1px solid #f3e3e6;
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
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 14px 28px rgba(244, 63, 94, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(244, 63, 94, 0.28);
}

:deep(.el-input-number) {
  width: 100%;
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

@media (max-width: 960px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .inline-grid {
    grid-template-columns: 1fr;
  }

  .image-source,
  .card-header,
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
