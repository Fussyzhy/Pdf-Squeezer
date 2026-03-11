<template>
  <div class="tool-panel compress-panel">
    <section class="hero-card hero-card--compress">
      <div class="hero-badge">压缩工具</div>
      <h3>缩小 PDF 体积，兼顾清晰度</h3>
      <p>适合邮件发送、系统上传和档案整理，压缩后会保留原文件并输出新的结果文件。</p>
      <div class="hero-tags">
        <span>支持批量处理</span>
        <span>保留原文件</span>
        <span>按等级控制体积</span>
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
          <span class="card-title">压缩等级</span>
          <span class="card-tip">直接在当前页调整，无需进入设置</span>
        </div>
        <el-select
          :model-value="compressionLevel"
          placeholder="请选择压缩等级"
          @update:model-value="handleCompressionLevelChange"
        >
          <el-option
            v-for="option in compressionLevelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <div class="level-chips">
          <span
            v-for="option in compressionLevelOptions"
            :key="option.value"
            :class="{ active: option.value === compressionLevel }"
          >
            {{ option.label }}
          </span>
        </div>
      </section>

      <section class="info-card">
        <span class="card-title">当前等级说明</span>
        <strong>{{ currentLevelMeta.title }}</strong>
        <p>{{ currentLevelMeta.description }}</p>
        <span class="info-scene">{{ currentLevelMeta.scene }}</span>

        <div class="quality-meter">
          <span>体积优先</span>
          <div class="quality-track">
            <div class="quality-fill" :style="{ width: `${qualityPercent}%` }" />
          </div>
          <span>画质优先</span>
        </div>
      </section>
    </div>

    <div class="action-bar">
      <span class="action-hint">输出目录可在右上角“输出设置”中修改，压缩不会覆盖原文件。</span>
      <button type="button" @click="handleCompress">开始压缩</button>
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
  title: string
  description: string
  scene: string
  qualityScore: number
}

const compressionLevelOptions: CompressionLevelMeta[] = [
  {
    label: '屏幕优先',
    value: 'screen',
    title: '屏幕级压缩',
    description: '优先减小文件体积，适合快速预览、聊天传输和轻量分享。',
    scene: '适用场景：预览件、聊天发送、临时上传。',
    qualityScore: 18,
  },
  {
    label: '电子书推荐',
    value: 'ebook',
    title: '电子书级压缩',
    description: '在清晰度和体积之间做平衡，通常适合大多数日常办公文档。',
    scene: '适用场景：日常办公、邮件附件、在线提交。',
    qualityScore: 42,
  },
  {
    label: '打印质量',
    value: 'printer',
    title: '打印级压缩',
    description: '保留更好的打印质量，同时比原文件更节省存储空间。',
    scene: '适用场景：线下打印、正式材料、存档备份。',
    qualityScore: 64,
  },
  {
    label: '印前保真',
    value: 'prepress',
    title: '印前级压缩',
    description: '尽量保留原始细节，压缩力度较小，更偏向高质量输出。',
    scene: '适用场景：高质量留档、设计稿件、专业输出。',
    qualityScore: 82,
  },
  {
    label: '默认保留细节',
    value: 'default',
    title: '默认压缩',
    description: '更接近原始文档质量，适合对清晰度要求较高的文件。',
    scene: '适用场景：重要文档、细节较多的资料。',
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

const currentLevelMeta: any= computed(() => {
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

.hero-card {
  padding: 18px 20px;
  border-radius: 16px;
  text-align: left;
  color: #1f2a37;
  background: linear-gradient(135deg, #edf6ff 0%, #f7fbff 100%);
  border: 1px solid #d7e8ff;

  h3 {
    margin: 8px 0 6px;
    font-size: 22px;
  }

  p {
    margin: 0;
    color: #5b6472;
    line-height: 1.6;
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.14);
  color: #2b6cb0;
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
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(64, 158, 255, 0.18);
    color: #51606f;
    font-size: 12px;
  }
}

#dropArea {
  border: 2px dashed #aac8ea;
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
  background: #fcfdff;

  &:hover,
  &.hover {
    border-color: #409eff;
    background: #eef6ff;
    color: #1f2937;

    #inputPath {
      color: #409eff;
    }
  }
}

.option-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 14px;
}

.form-card,
.info-card {
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e8edf5;
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

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.card-tip,
.info-scene {
  font-size: 12px;
  color: #909399;
}

.level-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;

  span {
    padding: 6px 10px;
    border-radius: 999px;
    background: #f5f9ff;
    color: #60758a;
    font-size: 12px;
    border: 1px solid transparent;
  }

  .active {
    background: rgba(64, 158, 255, 0.12);
    color: #2563eb;
    border-color: rgba(64, 158, 255, 0.22);
  }
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 8px;

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

.quality-meter {
  margin-top: 4px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #64748b;
}

.quality-track {
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, #dbeafe 0%, #e5f4dc 100%);
  overflow: hidden;
}

.quality-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
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

:deep(.el-select) {
  width: 100%;
}

button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 12px 22px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  white-space: nowrap;
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  box-shadow: 0 10px 20px rgba(64, 158, 255, 0.22);
}

button:hover {
  background-color: #2f8ef3;
  transform: translateY(-1px);
}

@media (max-width: 720px) {
  .option-grid {
    grid-template-columns: 1fr;
  }

  .action-bar,
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>