<template>
  <div class="toolbox-shell">
    <div class="toolbox-panel">
      <section class="toolbox-hero">
        <div class="toolbox-copy">
          <RouterLink to="/" class="back-link">返回首页</RouterLink>
          <span class="toolbox-badge">Toolbox</span>
          <h1>快速处理工具箱</h1>
          <p>这里集中放置压缩、合并、拆分、转换和水印，适合直接开始处理任务。</p>
        </div>

        <div class="toolbox-meta">
          <div class="meta-card">
            <strong>{{ toolCount }}</strong>
            <span>可用功能</span>
          </div>
          <div class="meta-card">
            <strong>Local</strong>
            <span>本地处理</span>
          </div>
          <div class="meta-card">
            <strong>Quick</strong>
            <span>快速开始</span>
          </div>
        </div>
      </section>

      <section class="tool-grid">
        <RouterLink
          v-for="tool in tools"
          :key="tool.id"
          :to="tool.path"
          class="tool-card"
          :style="{ '--tool-accent': tool.accent }"
        >
          <div class="tool-card__icon-shell">
            <img :src="tool.icon" :alt="tool.navLabel" class="tool-card__icon" />
          </div>

          <strong class="tool-card__label">{{ tool.navLabel }}</strong>
          <span class="tool-card__description">{{ tool.description }}</span>
        </RouterLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TOOL_CONFIGS } from '@/views/tool-config'

const tools = TOOL_CONFIGS
const toolCount = computed(() => tools.length)
</script>

<style scoped lang="scss">
.toolbox-shell {
  width: min(1120px, 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbox-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbox-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  padding: 30px;
  border-radius: 32px;
  background:
    radial-gradient(circle at top left, rgba(64, 158, 255, 0.14), transparent 34%),
    radial-gradient(circle at right bottom, rgba(103, 194, 58, 0.08), transparent 24%),
    rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(18px);
}

.toolbox-copy {
  text-align: left;

  h1 {
    margin: 14px 0 12px;
    font-size: clamp(34px, 5vw, 54px);
    line-height: 0.98;
    color: #0f172a;
    letter-spacing: -0.05em;
  }

  p {
    margin: 0;
    max-width: 560px;
    color: #526072;
    line-height: 1.8;
    font-size: 15px;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  margin-bottom: 16px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.toolbox-badge {
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

.toolbox-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 12px;
}

.meta-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
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
    font-size: 12px;
    font-weight: 600;
  }
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.tool-card {
  min-height: 220px;
  padding: 20px 16px;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top, color-mix(in srgb, var(--tool-accent) 12%, white) 0%, transparent 52%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(247, 250, 252, 0.96) 100%);
  border: 1px solid rgba(228, 234, 242, 0.96);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.tool-card::after {
  content: '';
  position: absolute;
  right: -24px;
  bottom: -38px;
  width: 92px;
  height: 92px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tool-accent) 14%, white);
  filter: blur(10px);
  opacity: 0.8;
}

.tool-card:hover {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--tool-accent) 36%, white);
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.14);
}

.tool-card__icon-shell {
  width: 92px;
  height: 92px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, color-mix(in srgb, var(--tool-accent) 8%, white) 100%);
  border: 1px solid color-mix(in srgb, var(--tool-accent) 18%, white);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 14px 30px color-mix(in srgb, var(--tool-accent) 10%, transparent);
  position: relative;
  z-index: 1;
}

.tool-card__icon {
  width: 72px;
  height: 72px;
  display: block;
}

.tool-card__label {
  position: relative;
  z-index: 1;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.tool-card__description {
  position: relative;
  z-index: 1;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
}

@media (max-width: 1080px) {
  .tool-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .toolbox-hero {
    grid-template-columns: 1fr;
  }

  .toolbox-meta {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .toolbox-hero {
    padding: 22px;
  }

  .toolbox-meta,
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
