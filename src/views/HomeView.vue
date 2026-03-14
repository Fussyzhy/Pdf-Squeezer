<template>
  <div class="home-shell">
    <div class="home-panel">
      <section class="hero-card">
        <div class="hero-copy">
          <span class="hero-badge">PDF Squeezer</span>
          <h1>你的一站式 PDF 处理助手</h1>
          <p>
            当前项目已经支持压缩、合并、拆分、格式转换和水印。首页先做能力选择，后续每个功能都在独立页面里完成，流程会更清楚。
          </p>
        </div>

        <div class="hero-metrics">
          <div class="metric-card">
            <strong>{{ toolCount }}</strong>
            <span>可用功能</span>
          </div>
          <div class="metric-card">
            <strong>Local</strong>
            <span>本地处理</span>
          </div>
          <div class="metric-card">
            <strong>Ghostscript</strong>
            <span>核心引擎</span>
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
          <div class="tool-card__top">
            <span class="tool-card__badge">{{ tool.badge }}</span>
            <strong>{{ tool.navLabel }}</strong>
          </div>

          <h2>{{ tool.title }}</h2>
          <p>{{ tool.description }}</p>

          <div class="tool-card__tags">
            <span v-for="tag in tool.tags" :key="tag">{{ tag }}</span>
          </div>

          <div class="tool-card__footer">
            <span>{{ tool.eyebrow }}</span>
            <span class="tool-card__cta">进入功能</span>
          </div>
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
.home-shell {
  width: min(1120px, 100%);
  min-height: calc(100vh - 48px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: 18px;
  padding: 28px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top left, rgba(64, 158, 255, 0.18), transparent 38%),
    radial-gradient(circle at right bottom, rgba(103, 194, 58, 0.12), transparent 28%),
    rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(18px);
}

.hero-copy {
  text-align: left;

  h1 {
    margin: 12px 0 10px;
    font-size: clamp(32px, 5vw, 50px);
    line-height: 1.02;
    color: #0f172a;
    letter-spacing: -0.04em;
  }

  p {
    margin: 0;
    max-width: 680px;
    color: #526072;
    line-height: 1.8;
    font-size: 15px;
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  height: 32px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-metrics {
  display: grid;
  gap: 12px;
}

.metric-card {
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(218, 228, 240, 0.9);
  text-align: left;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);

  strong {
    display: block;
    color: #0f172a;
    font-size: 24px;
    letter-spacing: -0.03em;
  }

  span {
    display: block;
    margin-top: 6px;
    color: #64748b;
    font-size: 13px;
  }
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.tool-card {
  min-height: 260px;
  padding: 20px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(228, 234, 242, 0.96);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.tool-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--tool-accent) 32%, white);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
}

.tool-card__top {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;

  strong {
    font-size: 22px;
    color: #0f172a;
    letter-spacing: -0.03em;
  }
}

.tool-card__badge {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tool-accent) 12%, white);
  color: var(--tool-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.tool-card h2 {
  margin: 0;
  text-align: left;
  color: #1e293b;
  font-size: 16px;
  line-height: 1.5;
}

.tool-card p {
  margin: 0;
  text-align: left;
  color: #667085;
  font-size: 13px;
  line-height: 1.7;
}

.tool-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;

  span {
    padding: 6px 10px;
    border-radius: 999px;
    background: #f8fafc;
    color: #556274;
    font-size: 11px;
    border: 1px solid #e6edf5;
  }
}

.tool-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;

  span {
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
  }
}

.tool-card__cta {
  color: var(--tool-accent) !important;
  font-weight: 700;
  white-space: nowrap;
}

@media (max-width: 1080px) {
  .hero-card {
    grid-template-columns: 1fr;
  }

  .tool-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .home-shell {
    min-height: auto;
  }

  .hero-card {
    padding: 22px;
  }

  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
