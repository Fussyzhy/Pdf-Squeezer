<template>
  <div class="editor-shell">
    <section v-if="!currentFile" class="editor-empty">
      <span class="editor-empty__badge">Preview</span>
      <h1>先打开一个 PDF 文件</h1>
      <p>编辑页已经接入页面预览。回到首页选择文件后，就可以在这里查看整份文档的所有页面。</p>

      <div class="editor-empty__actions">
        <RouterLink to="/" class="editor-button editor-button--primary">
          返回首页
        </RouterLink>
        <RouterLink to="/toolbox" class="editor-button editor-button--secondary">
          打开工具箱
        </RouterLink>
      </div>
    </section>

    <template v-else>
      <section class="editor-hero">
        <div class="editor-hero__copy">
          <div class="editor-nav">
            <RouterLink to="/" class="editor-nav__link">首页</RouterLink>
            <RouterLink to="/toolbox" class="editor-nav__link">工具箱</RouterLink>
          </div>

          <span class="editor-badge">编辑预览</span>
          <h1>{{ currentFile.name }}</h1>
          <p>当前先完成页面预览。后续再继续接入拖拽重排、删页和新增空白页。</p>
        </div>

        <button type="button" class="editor-button editor-button--primary" @click="handleReplaceFile">
          重新选择文件
        </button>
      </section>

      <section class="editor-summary">
        <div class="summary-card">
          <strong>{{ pageCountDisplay }}</strong>
          <span>页面数量</span>
        </div>
        <div class="summary-card">
          <strong>Preview</strong>
          <span>缩略图浏览</span>
        </div>
        <div class="summary-card">
          <strong>Local</strong>
          <span>本地渲染</span>
        </div>
      </section>

      <section class="preview-panel">
        <div v-if="isLoading" class="preview-grid preview-grid--loading">
          <article v-for="skeleton in 8" :key="skeleton" class="preview-card preview-card--skeleton">
            <div class="preview-card__paper"></div>
            <span class="preview-card__label">加载中</span>
          </article>
        </div>

        <div v-else-if="errorMessage" class="preview-feedback">
          <strong>预览加载失败</strong>
          <p>{{ errorMessage }}</p>
          <button type="button" class="editor-button editor-button--secondary" @click="reloadPreview">
            重新加载
          </button>
        </div>

        <div v-else-if="previewPages.length" class="preview-grid">
          <article v-for="page in previewPages" :key="page.pageNumber" class="preview-card">
            <div class="preview-card__paper">
              <img :src="page.url" :alt="`第 ${page.pageNumber} 页`" class="preview-card__image" />
            </div>
            <span class="preview-card__label">第 {{ page.pageNumber }} 页</span>
          </article>
        </div>

        <div v-else class="preview-feedback">
          <strong>暂无预览页面</strong>
          <p>这份 PDF 还没有生成可展示的页面缩略图。</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useEditorStore, type EditorPdfFile } from '@/stores/editor'

type PreviewCard = {
  pageNumber: number
  url: string
}

const editorStore = useEditorStore()
const { currentFile } = storeToRefs(editorStore)

const previewPages = ref<PreviewCard[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const pageCount = ref(0)

let previewTaskId = 0

const pageCountDisplay = computed(() => {
  if (isLoading.value) {
    return '...'
  }

  if (pageCount.value > 0) {
    return String(pageCount.value)
  }

  return '--'
})

function revokePreviewUrls() {
  previewPages.value.forEach((page) => URL.revokeObjectURL(page.url))
  previewPages.value = []
}

function toPreviewUrl(image: Uint8Array) {
  return URL.createObjectURL(new Blob([image], { type: 'image/png' }))
}

function createPreviewPayload(file: EditorPdfFile) {
  return {
    name: file.name,
    buffer: new Uint8Array(file.buffer),
  }
}

async function loadPreview(file: EditorPdfFile | null) {
  const taskId = ++previewTaskId

  revokePreviewUrls()
  errorMessage.value = ''
  pageCount.value = 0

  if (!file) {
    isLoading.value = false
    return
  }

  isLoading.value = true

  try {
    const result = await window.electronAPI.renderPdfPreview(createPreviewPayload(file), { dpi: 110 })

    if (taskId !== previewTaskId) {
      return
    }

    if (!result.success) {
      throw new Error(result.error || '无法生成 PDF 预览')
    }

    pageCount.value = result.pageCount
    previewPages.value = result.pages.map((page) => ({
      pageNumber: page.pageNumber,
      url: toPreviewUrl(page.image),
    }))
  } catch (error) {
    if (taskId !== previewTaskId) {
      return
    }

    errorMessage.value = error instanceof Error ? error.message : '无法生成 PDF 预览'
  } finally {
    if (taskId === previewTaskId) {
      isLoading.value = false
    }
  }
}

async function handleReplaceFile() {
  const files = await window.electronAPI.selectInputFiles(false)
  const [file] = files

  if (!file) {
    return
  }

  editorStore.setCurrentFile(file)
  ElMessage.success(`已切换到 ${file.name}`)
}

function reloadPreview() {
  loadPreview(currentFile.value)
}

watch(currentFile, (file) => {
  loadPreview(file)
}, { immediate: true })

onBeforeUnmount(() => {
  previewTaskId += 1
  revokePreviewUrls()
})
</script>

<style scoped lang="scss">
.editor-shell {
  width: min(1180px, 100%);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.editor-empty,
.editor-hero,
.editor-summary,
.preview-panel {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(16px);
}

.editor-empty {
  min-height: 420px;
  padding: 34px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;

  h1 {
    margin: 16px 0 10px;
    color: #0f172a;
    font-size: clamp(34px, 5vw, 54px);
    line-height: 1;
    letter-spacing: -0.05em;
  }

  p {
    max-width: 560px;
    margin: 0;
    color: #64748b;
    line-height: 1.8;
  }
}

.editor-empty__badge,
.editor-badge {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.editor-empty__actions,
.editor-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.editor-empty__actions {
  margin-top: 24px;
}

.editor-hero {
  padding: 24px 26px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.editor-hero__copy {
  text-align: left;

  h1 {
    margin: 16px 0 10px;
    color: #0f172a;
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1.02;
    letter-spacing: -0.04em;
    word-break: break-word;
  }

  p {
    margin: 0;
    max-width: 620px;
    color: #64748b;
    line-height: 1.7;
  }
}

.editor-nav__link {
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.editor-button {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.editor-button:hover {
  transform: translateY(-1px);
}

.editor-button--primary {
  background: linear-gradient(180deg, #2f80ed 0%, #1d4ed8 100%);
  box-shadow: 0 14px 28px rgba(29, 78, 216, 0.2);
  color: #ffffff;
}

.editor-button--secondary {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(203, 213, 225, 0.9);
  color: #334155;
}

.editor-summary {
  padding: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 18px;
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.86);
  border: 1px solid rgba(226, 232, 240, 0.92);
  text-align: left;

  strong {
    display: block;
    color: #0f172a;
    font-size: 24px;
    letter-spacing: -0.04em;
  }

  span {
    display: block;
    margin-top: 6px;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
  }
}

.preview-panel {
  padding: 22px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px;
}

.preview-card {
  padding: 14px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.98) 100%);
  border: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.preview-card__paper {
  aspect-ratio: 0.72;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.9) 100%);
  border: 1px solid rgba(226, 232, 240, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-card__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #ffffff;
}

.preview-card__label {
  display: block;
  margin-top: 12px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.preview-card--skeleton {
  .preview-card__paper {
    position: relative;
    overflow: hidden;
  }

  .preview-card__paper::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
    transform: translateX(-100%);
    animation: skeleton-shimmer 1.2s infinite;
  }
}

.preview-feedback {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;

  strong {
    color: #0f172a;
    font-size: 22px;
    letter-spacing: -0.03em;
  }

  p {
    max-width: 520px;
    margin: 0;
    color: #64748b;
    line-height: 1.7;
  }
}

@keyframes skeleton-shimmer {
  to {
    transform: translateX(100%);
  }
}

@media (max-width: 900px) {
  .editor-hero {
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .editor-shell {
    gap: 14px;
  }

  .editor-empty,
  .editor-hero,
  .preview-panel {
    padding: 20px;
  }

  .editor-summary {
    grid-template-columns: 1fr;
  }

  .preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
