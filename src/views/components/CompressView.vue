<template>
  <div class="tool-panel compress-panel">
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

    <div class="content-grid">
      <section class="surface-card">
        <div class="section-head">
          <div>
            <span class="section-kicker">Preset</span>
            <h3>压缩等级</h3>
          </div>
          <span class="section-note">选择一个即可开始</span>
        </div>

        <div class="level-grid">
          <button
            v-for="option in compressionLevelOptions"
            :key="option.value"
            type="button"
            class="level-card"
            :class="{ active: option.value === compressionLevel }"
            @click="handleCompressionLevelChange(option.value)"
          >
            <strong>{{ option.label }}</strong>
            <span>{{ option.short }}</span>
          </button>
        </div>
      </section>

      <section class="surface-card summary-card">
        <span class="section-kicker">Current</span>
        <h3>{{ currentLevelMeta.title }}</h3>
        <p>{{ currentLevelMeta.description }}</p>

        <div class="summary-tags">
          <span>{{ currentLevelMeta.scene }}</span>
          <span>{{ currentLevelMeta.balance }}</span>
        </div>

        <div class="quality-meter">
          <span>体积</span>
          <div class="quality-track">
            <div class="quality-fill" :style="{ width: `${qualityPercent}%` }" />
          </div>
          <span>清晰</span>
        </div>
      </section>
    </div>

    <div class="action-bar">
      <span class="action-hint">会保留原文件，并在输出目录生成新的压缩结果。</span>
      <button type="button" class="primary-button" @click="handleCompress">开始压缩</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default'

type CompressionLevelMeta = {
  label: string
  value: CompressionLevel
  short: string
  title: string
  description: string
  scene: string
  balance: string
  qualityScore: number
}

const compressionLevelOptions: CompressionLevelMeta[] = [
  {
    label: '屏幕',
    value: 'screen',
    short: '更小',
    title: '屏幕优先',
    description: '更偏向减小体积，适合预览、聊天发送和临时分享。',
    scene: '轻量分享',
    balance: '体积优先',
    qualityScore: 18,
  },
  {
    label: '电子书',
    value: 'ebook',
    short: '推荐',
    title: '电子书级',
    description: '兼顾清晰度和体积，适合大多数办公文档。',
    scene: '日常办公',
    balance: '均衡输出',
    qualityScore: 42,
  },
  {
    label: '打印',
    value: 'printer',
    short: '更清晰',
    title: '打印质量',
    description: '保留更好的打印效果，同时继续控制文件大小。',
    scene: '打印留档',
    balance: '清晰优先',
    qualityScore: 64,
  },
  {
    label: '印前',
    value: 'prepress',
    short: '高保真',
    title: '印前保真',
    description: '尽量保留原始细节，适合更高质量的输出场景。',
    scene: '专业输出',
    balance: '细节优先',
    qualityScore: 82,
  },
  {
    label: '默认',
    value: 'default',
    short: '保守',
    title: '默认模式',
    description: '更接近原始文件质量，适合对细节更敏感的内容。',
    scene: '重要文档',
    balance: '质量优先',
    qualityScore: 100,
  },
]

const { compressionLevel } = defineProps<{
  compressionLevel: CompressionLevel
}>()

const emit = defineEmits<{
  (e: 'update:fileList', fileList: { name: string; buffer: ArrayBuffer }[]): void
  (e: 'update:compressionLevel', compressionLevel: CompressionLevel): void
  (e: 'handleCompress'): void
}>()

const dropHover = ref(false)

const currentLevelMeta = computed(() => {
  return compressionLevelOptions.find((option) => option.value === compressionLevel) ?? compressionLevelOptions[1]
})

const qualityPercent = computed(() => currentLevelMeta.value.qualityScore)

const readPdfFile = (file: File) => {
  return new Promise<{ name: string; buffer: ArrayBuffer } | null>((resolve) => {
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
  const validFiles = results.filter((file) => file !== null) as { name: string; buffer: ArrayBuffer }[]

  emit('update:fileList', validFiles)
}

const handleClickUpload = async () => {
  const files = await window.electronAPI.selectInputFiles()

  if (files.length) {
    emit('update:fileList', files)
  }
}

const handleCompressionLevelChange = (value: CompressionLevel) => {
  emit('update:compressionLevel', value)
}

const handleCompress = () => {
  emit('handleCompress')
}
</script>

<style scoped lang="scss">
.tool-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

#dropArea {
  border: 1px dashed rgba(64, 158, 255, 0.38);
  border-radius: 22px;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(64, 158, 255, 0.1), transparent 60%),
    linear-gradient(180deg, #fbfdff 0%, #f4f9ff 100%);
  cursor: pointer;
  transition: border-color 0.24s ease, transform 0.24s ease, background 0.24s ease;
}

#dropArea:hover,
#dropArea.hover {
  border-color: #409eff;
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

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 14px;
}

.surface-card {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e4edf7;
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
  background: rgba(64, 158, 255, 0.1);
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.section-head h3,
.summary-card h3 {
  margin: 10px 0 0;
  color: #0f172a;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.section-note {
  color: #94a3b8;
  font-size: 12px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.level-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid #dbe8f6;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
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
    color: #64748b;
    font-size: 13px;
  }
}

.level-card:hover {
  transform: translateY(-1px);
  border-color: rgba(64, 158, 255, 0.38);
}

.level-card.active {
  border-color: #409eff;
  box-shadow: 0 14px 28px rgba(64, 158, 255, 0.12);
  background:
    radial-gradient(circle at top right, rgba(64, 158, 255, 0.12), transparent 46%),
    linear-gradient(180deg, #ffffff 0%, #eef6ff 100%);
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-between;
  background:
    radial-gradient(circle at top right, rgba(64, 158, 255, 0.16), transparent 38%),
    linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.summary-card p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
  font-size: 14px;
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid #dbe8f6;
    color: #4b5563;
    font-size: 12px;
    font-weight: 600;
  }
}

.quality-meter {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}

.quality-track {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: linear-gradient(90deg, #dbeafe 0%, #e5f4dc 100%);
}

.quality-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
}

.action-bar {
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid #e4edf7;
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
  background: linear-gradient(135deg, #409eff 0%, #2f7be8 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 14px 28px rgba(64, 158, 255, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(64, 158, 255, 0.28);
}

@media (max-width: 860px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .level-grid {
    grid-template-columns: 1fr;
  }

  .section-head,
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
