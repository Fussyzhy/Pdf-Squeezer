<template>
  <div class="editor-shell">
    <section v-if="!currentFile" class="editor-empty">
      <span class="editor-empty__badge">Editor</span>
      <h1>先打开一个 PDF 文件</h1>
      <p>编辑页已经切到工作台结构。回到首页选择文件后，就可以像常见 PDF 编辑器一样查看页面缩略图和主预览。</p>

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
      <header class="editor-toolbar">
        <div class="toolbar-group toolbar-group--meta">
          <RouterLink to="/" class="toolbar-link">首页</RouterLink>
          <RouterLink to="/toolbox" class="toolbar-link">工具箱</RouterLink>

          <div class="file-pill">
            <span>当前文档</span>
            <strong>{{ currentFile.name }}</strong>
          </div>
        </div>

        <div class="toolbar-group toolbar-group--status">
          <span class="toolbar-chip">共 {{ pageCountDisplay }} 页</span>
          <span class="toolbar-chip toolbar-chip--muted">本地预览</span>
          <span class="toolbar-chip toolbar-chip--muted">编辑工作台</span>
        </div>

        <div class="toolbar-group toolbar-group--actions">
          <button type="button" class="editor-button editor-button--secondary" @click="reloadPreview">
            刷新预览
          </button>
          <button type="button" class="editor-button editor-button--primary" @click="handleReplaceFile">
            重新选择
          </button>
        </div>
      </header>

      <section class="editor-workspace">
        <aside class="thumbnail-panel">
          <div class="panel-head">
            <div>
              <strong>页面</strong>
              <span>{{ pageCountDisplay }} 页</span>
            </div>
          </div>

          <div v-if="isLoading" class="thumbnail-list">
            <div v-for="skeleton in 8" :key="skeleton" class="thumbnail-item thumbnail-item--skeleton">
              <span class="thumbnail-item__index">{{ skeleton }}</span>
              <div class="thumbnail-item__paper"></div>
            </div>
          </div>

          <div v-else-if="errorMessage" class="panel-feedback">
            <strong>预览失败</strong>
            <p>{{ errorMessage }}</p>
            <button type="button" class="editor-button editor-button--secondary" @click="reloadPreview">
              重试
            </button>
          </div>

          <div v-else-if="previewPages.length" class="thumbnail-list">
            <button
              v-for="page in previewPages"
              :key="page.pageNumber"
              type="button"
              class="thumbnail-item"
              :class="{ 'is-active': page.pageNumber === selectedPageNumber }"
              @click="selectPage(page.pageNumber)"
            >
              <span class="thumbnail-item__index">{{ page.pageNumber }}</span>
              <div class="thumbnail-item__paper">
                <img :src="page.url" :alt="`第 ${page.pageNumber} 页`" class="thumbnail-item__image" />
              </div>
            </button>
          </div>

          <div v-else class="panel-feedback">
            <strong>暂无页面</strong>
            <p>当前没有可展示的页面缩略图。</p>
          </div>
        </aside>

        <main class="preview-stage">
          <div class="stage-head">
            <div class="stage-meta">
              <strong>{{ selectedPageLabel }}</strong>
              <span>{{ currentFile.name }}</span>
            </div>

            <div class="stage-nav">
              <button
                type="button"
                class="stage-nav__button"
                :disabled="!canGoPrev"
                @click="goPrevPage"
              >
                上一页
              </button>
              <span class="stage-nav__indicator">{{ selectedPageNumber }} / {{ pageCountDisplay }}</span>
              <button
                type="button"
                class="stage-nav__button"
                :disabled="!canGoNext"
                @click="goNextPage"
              >
                下一页
              </button>
            </div>
          </div>

          <div class="stage-body">
            <div v-if="isLoading" class="stage-feedback stage-feedback--loading">
              <div class="stage-canvas stage-canvas--skeleton"></div>
            </div>

            <div v-else-if="errorMessage" class="stage-feedback">
              <strong>预览加载失败</strong>
              <p>{{ errorMessage }}</p>
            </div>

            <div v-else-if="selectedPage" class="stage-canvas-wrap">
              <div class="stage-canvas">
                <img :src="selectedPage.url" :alt="`第 ${selectedPage.pageNumber} 页`" class="stage-image" />
              </div>
            </div>

            <div v-else class="stage-feedback">
              <strong>暂无主预览</strong>
              <p>请选择一个页面查看更大的内容。</p>
            </div>
          </div>
        </main>
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
const selectedPageNumber = ref(1)

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

const selectedPage = computed(() => (
  previewPages.value.find((page) => page.pageNumber === selectedPageNumber.value) ?? null
))

const selectedPageLabel = computed(() => (
  selectedPage.value ? `第 ${selectedPage.value.pageNumber} 页` : '页面预览'
))

const canGoPrev = computed(() => selectedPageNumber.value > 1)
const canGoNext = computed(() => selectedPageNumber.value < previewPages.value.length)

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

function selectPage(pageNumber: number) {
  selectedPageNumber.value = pageNumber
}

function goPrevPage() {
  if (canGoPrev.value) {
    selectedPageNumber.value -= 1
  }
}

function goNextPage() {
  if (canGoNext.value) {
    selectedPageNumber.value += 1
  }
}

async function loadPreview(file: EditorPdfFile | null) {
  const taskId = ++previewTaskId

  revokePreviewUrls()
  errorMessage.value = ''
  pageCount.value = 0
  selectedPageNumber.value = 1

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
    selectedPageNumber.value = result.pages[0]?.pageNumber ?? 1
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
  try {
    const files = await window.electronAPI.selectInputFiles(false)
    const [file] = files

    if (!file) {
      return
    }

    editorStore.setCurrentFile(file)
    ElMessage.success(`已切换到 ${file.name}`)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '选择文件失败')
  }
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
  width: min(1320px, 100%);
  min-height: calc(100vh - 90px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-empty,
.editor-toolbar,
.thumbnail-panel,
.preview-stage {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(16px);
}

.editor-empty {
  min-height: 460px;
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
    max-width: 620px;
    margin: 0;
    color: #64748b;
    line-height: 1.8;
  }
}

.editor-empty__badge {
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

.editor-empty__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.editor-toolbar {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.toolbar-group {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-group--meta {
  flex: 1 1 420px;
}

.toolbar-group--status,
.toolbar-group--actions {
  flex: 0 1 auto;
}

.toolbar-link {
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.92);
  color: #334155;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.file-pill {
  min-width: min(360px, 100%);
  padding: 10px 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96) 0%, rgba(241, 245, 249, 0.96) 100%);
  border: 1px solid rgba(226, 232, 240, 0.92);
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }

  strong {
    color: #0f172a;
    font-size: 14px;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.toolbar-chip {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(239, 246, 255, 0.92);
  border: 1px solid rgba(191, 219, 254, 0.88);
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 600;
}

.toolbar-chip--muted {
  background: rgba(248, 250, 252, 0.92);
  border-color: rgba(226, 232, 240, 0.92);
  color: #475569;
}

.editor-button {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.editor-button:hover {
  transform: translateY(-1px);
}

.editor-button--primary {
  background: linear-gradient(180deg, #2f80ed 0%, #1d4ed8 100%);
  box-shadow: 0 12px 24px rgba(29, 78, 216, 0.18);
  color: #ffffff;
}

.editor-button--secondary {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(203, 213, 225, 0.92);
  color: #334155;
}

.editor-workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 16px;
}

.thumbnail-panel {
  min-height: 680px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-head,
.stage-head {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.92);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  strong {
    display: block;
    color: #0f172a;
    font-size: 16px;
  }

  span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }
}

.thumbnail-list {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
}

.thumbnail-item {
  width: 100%;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(248, 250, 252, 0.82);
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.thumbnail-item:hover {
  transform: translateY(-1px);
}

.thumbnail-item.is-active {
  border-color: rgba(59, 130, 246, 0.7);
  background: rgba(239, 246, 255, 0.92);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.12);
}

.thumbnail-item__index {
  padding-top: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.thumbnail-item__paper {
  aspect-ratio: 0.72;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.thumbnail-item__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.thumbnail-item--skeleton {
  cursor: default;

  .thumbnail-item__paper {
    position: relative;
    background: linear-gradient(180deg, rgba(241, 245, 249, 0.94) 0%, rgba(226, 232, 240, 0.94) 100%);
  }

  .thumbnail-item__paper::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
    transform: translateX(-100%);
    animation: skeleton-shimmer 1.2s infinite;
  }
}

.panel-feedback,
.stage-feedback {
  flex: 1;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;

  strong {
    color: #0f172a;
    font-size: 20px;
    letter-spacing: -0.03em;
  }

  p {
    max-width: 360px;
    margin: 0;
    color: #64748b;
    line-height: 1.7;
  }
}

.preview-stage {
  min-width: 0;
  min-height: 680px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stage-meta {
  min-width: 0;

  strong,
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.stage-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stage-nav__button {
  min-width: 72px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(203, 213, 225, 0.92);
  background: rgba(255, 255, 255, 0.96);
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.stage-nav__button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.stage-nav__indicator {
  min-width: 72px;
  text-align: center;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.stage-body {
  flex: 1;
  min-height: 0;
  padding: 26px;
  overflow: auto;
  background:
    linear-gradient(180deg, rgba(243, 246, 251, 0.92) 0%, rgba(236, 241, 246, 0.92) 100%);
}

.stage-canvas-wrap,
.stage-feedback--loading {
  min-height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.stage-canvas {
  width: min(760px, 100%);
  min-height: 540px;
  padding: 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.96);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
}

.stage-canvas--skeleton {
  position: relative;
  background: linear-gradient(180deg, rgba(241, 245, 249, 0.96) 0%, rgba(226, 232, 240, 0.96) 100%);
  overflow: hidden;
}

.stage-canvas--skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
  transform: translateX(-100%);
  animation: skeleton-shimmer 1.2s infinite;
}

.stage-image {
  width: 100%;
  display: block;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

@keyframes skeleton-shimmer {
  to {
    transform: translateX(100%);
  }
}

@media (max-width: 1180px) {
  .editor-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .editor-workspace {
    grid-template-columns: 220px minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .editor-workspace {
    grid-template-columns: 1fr;
  }

  .thumbnail-panel {
    min-height: 280px;
  }

  .thumbnail-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .thumbnail-item {
    grid-template-columns: 1fr;
  }

  .thumbnail-item__index {
    padding-top: 0;
  }
}

@media (max-width: 640px) {
  .editor-shell {
    gap: 12px;
  }

  .editor-empty,
  .editor-toolbar,
  .stage-body {
    padding: 18px;
  }

  .thumbnail-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stage-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
