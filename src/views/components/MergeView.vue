<template>
  <div class="tool-panel merge-panel">
    <div
      id="dropArea"
      :class="{ hover: dropHover }"
      @dragover.prevent="dropHover = true"
      @dragleave.prevent="dropHover = false"
      @drop="handleDrop"
      @click="handleClickUpload"
    >
      <div class="upload-copy">
        <strong>上传多个 PDF</strong>
        <span>拖入文件后，可在右侧列表调整顺序</span>
      </div>
    </div>

    <div class="insight-grid">
      <section class="insight-card">
        <span class="insight-index">01</span>
        <strong>顺序可调</strong>
        <p>最终输出顺序以右侧文件列表为准。</p>
      </section>

      <section class="insight-card">
        <span class="insight-index">02</span>
        <strong>单文件输出</strong>
        <p>会生成一份新的合并结果，不覆盖原件。</p>
      </section>

      <section class="insight-card">
        <span class="insight-index">03</span>
        <strong>适合整理归档</strong>
        <p>适合合同附件、扫描件和资料汇总。</p>
      </section>
    </div>

    <section class="surface-card merge-preview">
      <div class="section-head">
        <div>
          <span class="section-kicker">Merge Flow</span>
          <h3>上传 -> 排序 -> 合并</h3>
        </div>
        <span class="section-note">流程更短，结果更直接</span>
      </div>

      <div class="flow-strip">
        <div class="flow-chip">加入文件</div>
        <div class="flow-line" />
        <div class="flow-chip">右侧排序</div>
        <div class="flow-line" />
        <div class="flow-chip">输出成品</div>
      </div>
    </section>

    <div class="action-bar">
      <span class="action-hint">开始前确认右侧列表顺序即可。</span>
      <button type="button" class="primary-button" @click="handleMerge">开始合并</button>
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

#dropArea {
  border: 1px dashed rgba(230, 162, 60, 0.42);
  border-radius: 22px;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(230, 162, 60, 0.12), transparent 58%),
    linear-gradient(180deg, #fffdfa 0%, #fff8ef 100%);
  cursor: pointer;
  transition: border-color 0.24s ease, transform 0.24s ease;
}

#dropArea:hover,
#dropArea.hover {
  border-color: #e6a23c;
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

.insight-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.insight-card,
.surface-card {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #eee4d6;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  text-align: left;
}

.insight-index {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(230, 162, 60, 0.14);
  color: #b26a00;
  font-size: 12px;
  font-weight: 800;
}

.insight-card strong {
  display: block;
  margin-top: 14px;
  color: #1f2937;
  font-size: 16px;
}

.insight-card p,
.merge-preview p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

.merge-preview {
  background:
    radial-gradient(circle at top right, rgba(230, 162, 60, 0.14), transparent 40%),
    linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(230, 162, 60, 0.12);
  color: #b26a00;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.merge-preview h3 {
  margin: 10px 0 0;
  color: #0f172a;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.section-note {
  color: #94a3b8;
  font-size: 12px;
}

.flow-strip {
  margin-top: 18px;
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto;
  align-items: center;
  gap: 12px;
}

.flow-chip {
  min-height: 48px;
  padding: 0 16px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid #eee4d6;
  color: #3f3f46;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.flow-line {
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(230, 162, 60, 0.18) 0%, rgba(230, 162, 60, 0.48) 100%);
}

.action-bar {
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
  border: 1px solid #eee4d6;
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
  background: linear-gradient(135deg, #e6a23c 0%, #d58a1f 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 14px 28px rgba(230, 162, 60, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(230, 162, 60, 0.3);
}

@media (max-width: 920px) {
  .insight-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .flow-strip {
    grid-template-columns: 1fr;
  }

  .flow-line {
    display: none;
  }

  .section-head,
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
