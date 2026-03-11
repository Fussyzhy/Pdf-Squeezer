<template>
  <div class="tool-panel merge-panel">
    <section class="hero-card hero-card--merge">
      <div class="hero-badge">合并工具</div>
      <h3>按顺序合并多个 PDF</h3>
      <p>把多个文档整理成一个完整文件，适合合同附件、扫描件归档和资料汇总。</p>
      <div class="hero-tags">
        <span>支持多文件</span>
        <span>按列表顺序输出</span>
        <span>适合批量整理</span>
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

    <div class="tips-grid">
      <section class="tip-card">
        <strong>顺序可控</strong>
        <p>右侧文件列表支持拖拽排序，最终合并顺序以列表中的上下顺序为准。</p>
      </section>
      <section class="tip-card">
        <strong>合并结果</strong>
        <p>会输出一个新的 PDF 文件，不会覆盖原始文档，便于继续复查和归档。</p>
      </section>
      <section class="tip-card">
        <strong>适用场景</strong>
        <p>适合把合同、附件、封面和补充材料按顺序打包成一个统一文件。</p>
      </section>
    </div>

    <div class="step-strip">
      <div class="step-item">
        <span>1</span>
        <strong>上传文件</strong>
        <p>支持一次加入多个 PDF。</p>
      </div>
      <div class="step-item">
        <span>2</span>
        <strong>调整顺序</strong>
        <p>在右侧队列中拖拽排序。</p>
      </div>
      <div class="step-item">
        <span>3</span>
        <strong>开始合并</strong>
        <p>输出一个新的合并结果。</p>
      </div>
    </div>

    <div class="action-bar">
      <span class="action-hint">建议先检查右侧列表顺序，再执行合并，避免结果页序错乱。</span>
      <button type="button" @click="handleMerge">开始合并</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits<{
  (e: 'update:fileList', fileList: { name: string; buffer: ArrayBuffer }[]): void
  (e: 'handleMerge'): void
}>()

const dropHover = ref(false)

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

const handleMerge = () => {
  emit('handleMerge')
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
  background: linear-gradient(135deg, #fff7ec 0%, #fffdf7 100%);
  border: 1px solid #f3dfb8;

  h3 {
    margin: 8px 0 6px;
    font-size: 22px;
  }

  p {
    margin: 0;
    color: #675d4d;
    line-height: 1.6;
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(230, 162, 60, 0.14);
  color: #b26a00;
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
    border: 1px solid rgba(230, 162, 60, 0.2);
    color: #6b5c43;
    font-size: 12px;
  }
}

#dropArea {
  border: 2px dashed #dfc48e;
  border-radius: 14px;
  padding: 26px 24px;
  color: #7b6b55;
  transition: all 0.28s ease;
  cursor: pointer;
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #fffefb;

  &:hover,
  &.hover {
    border-color: #e6a23c;
    background: #fff7ea;
    color: #4b5563;

    #inputPath {
      color: #d48806;
    }
  }
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.tip-card {
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #ece7dc;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  text-align: left;

  strong {
    display: block;
    margin-bottom: 8px;
    color: #3d3a35;
    font-size: 15px;
  }

  p {
    margin: 0;
    color: #667085;
    line-height: 1.6;
  }
}

.step-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.step-item {
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
  border: 1px solid #eee4d6;
  text-align: left;

  span {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(230, 162, 60, 0.14);
    color: #b26a00;
    font-size: 12px;
    font-weight: 700;
  }

  strong {
    display: block;
    margin: 10px 0 6px;
    color: #3d3a35;
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

button {
  background-color: #e6a23c;
  color: white;
  border: none;
  padding: 12px 22px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  white-space: nowrap;
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  box-shadow: 0 10px 20px rgba(230, 162, 60, 0.22);
}

button:hover {
  background-color: #d9922b;
  transform: translateY(-1px);
}

@media (max-width: 720px) {
  .tips-grid,
  .step-strip {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>