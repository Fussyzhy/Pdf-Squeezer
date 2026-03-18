<template>
  <div class="home-shell">
    <div class="home-panel">
      <section class="home-card">
        <span class="home-badge">PDF Squeezer</span>
        <h1>打开 PDF 开始处理</h1>
        <p>首页只保留主要入口。打开文件用于后续详细处理，工具箱入口单独进入快速处理页面。</p>

        <div class="entry-group">
          <button type="button" class="primary-entry" @click="handleOpenPdf">
            <strong>打开 PDF 文件</strong>
            <span>选择一个文件继续处理</span>
          </button>

          <RouterLink to="/toolbox" class="secondary-entry">
            <strong>进入工具箱</strong>
            <span>{{ toolCount }} 个快速处理功能</span>
          </RouterLink>
        </div>

        <div class="home-status">
          <span>本地处理</span>
          <span>Windows 桌面端</span>
          <span>{{ selectedFileName || '未选择文件' }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { TOOL_CONFIGS } from '@/views/tool-config'

const toolCount = computed(() => TOOL_CONFIGS.length)
const selectedFileName = ref('')

const handleOpenPdf = async () => {
  const files = await window.electronAPI.selectInputFiles(false)
  const [file] = files

  if (!file) {
    return
  }

  selectedFileName.value = file.name
  ElMessage.info(`已选择 ${file.name}，详细编辑页下一步接入。`)
}
</script>

<style scoped lang="scss">
.home-shell {
  width: min(900px, 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-panel {
  width: 100%;
}

.home-card {
  padding: 34px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(16px);
  text-align: left;

  h1 {
    margin: 16px 0 12px;
    color: #0f172a;
    font-size: clamp(36px, 5vw, 58px);
    line-height: 0.98;
    letter-spacing: -0.05em;
  }

  p {
    margin: 0;
    max-width: 620px;
    color: #526072;
    font-size: 15px;
    line-height: 1.8;
  }
}

.home-badge {
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

.entry-group {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 0.8fr);
  gap: 14px;
  margin-top: 26px;
}

.primary-entry,
.secondary-entry {
  min-height: 144px;
  padding: 22px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  strong {
    color: #0f172a;
    font-size: 26px;
    line-height: 1.08;
    letter-spacing: -0.04em;
  }

  span {
    color: #64748b;
    font-size: 14px;
    line-height: 1.6;
  }
}

.primary-entry {
  border: 1px solid rgba(64, 158, 255, 0.2);
  background: linear-gradient(180deg, rgba(245, 249, 255, 0.98) 0%, rgba(235, 245, 255, 0.96) 100%);
  box-shadow: 0 16px 34px rgba(64, 158, 255, 0.12);
  cursor: pointer;
}

.secondary-entry {
  border: 1px solid rgba(228, 234, 242, 0.96);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(247, 250, 252, 0.96) 100%);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
}

.primary-entry:hover,
.secondary-entry:hover {
  transform: translateY(-2px);
}

.home-status {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;

  span {
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(226, 232, 240, 0.92);
    color: #526072;
    font-size: 12px;
    font-weight: 600;
  }
}

@media (max-width: 760px) {
  .home-card {
    padding: 24px;
  }

  .entry-group {
    grid-template-columns: 1fr;
  }

  .home-status {
    flex-direction: column;
  }
}
</style>
