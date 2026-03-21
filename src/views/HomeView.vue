<template>
  <div class="home-shell">
    <div class="home-panel">
      <section class="hero-card">
        <div class="hero-copy">
          <span class="hero-badge">Local-first</span>
          <h1>PDF Squeezer</h1>
          <p>集中处理你的 PDF 文件，选择需要的功能，快速开始操作。</p>
        </div>

        <div class="hero-visual">
          <div class="visual-window">
            <div class="visual-window__bar">
              <div class="visual-dots">
                <span class="visual-dot visual-dot--red" />
                <span class="visual-dot visual-dot--yellow" />
                <span class="visual-dot visual-dot--green" />
              </div>
              <span class="visual-window__title">Quick Launch</span>
            </div>

            <div class="visual-window__body">
              <div class="visual-lead">
                <span class="visual-lead__badge">Home</span>
                <strong>更轻的入口</strong>
                <p>只看图标和功能名，先选工具，再进入处理流程。</p>
              </div>

              <div class="visual-flow">
                <div class="flow-chip">选择功能</div>
                <div class="flow-line" />
                <div class="flow-chip">上传文件</div>
                <div class="flow-line" />
                <div class="flow-chip">导出结果</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tool-grid" class="tool-grid">
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
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 18px;
  padding: 30px;
  border-radius: 32px;
  background:
    radial-gradient(circle at top left, rgba(64, 158, 255, 0.16), transparent 34%),
    radial-gradient(circle at right bottom, rgba(103, 194, 58, 0.1), transparent 24%),
    rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(18px);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;

  h1 {
    margin: 14px 0 12px;
    max-width: 620px;
    font-size: clamp(34px, 5vw, 54px);
    line-height: 0.98;
    color: #0f172a;
    letter-spacing: -0.05em;
  }

  p {
    margin: 0;
    max-width: 520px;
    color: #526072;
    line-height: 1.8;
    font-size: 15px;
  }
}

.hero-badge {
  width: fit-content;
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

.hero-visual {
  display: flex;
  align-items: center;
}

.visual-window {
  width: 100%;
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(250, 252, 255, 0.96) 0%, rgba(244, 248, 252, 0.98) 100%);
  border: 1px solid rgba(221, 229, 238, 0.96);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 18px 36px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.visual-window__bar {
  height: 50px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.72);
}

.visual-dots {
  display: flex;
  gap: 6px;
}

.visual-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.visual-dot--red {
  background: #fb7185;
}

.visual-dot--yellow {
  background: #fbbf24;
}

.visual-dot--green {
  background: #34d399;
}

.visual-window__title {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.visual-window__body {
  padding: 18px;
  display: grid;
  gap: 16px;
}

.visual-lead {
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.78) 0%, rgba(255, 255, 255, 0.88) 100%);
  border: 1px solid rgba(191, 219, 254, 0.92);
  text-align: left;

  strong {
    display: block;
    margin-top: 10px;
    color: #0f172a;
    font-size: 22px;
    letter-spacing: -0.03em;
  }

  p {
    margin: 8px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.7;
  }
}

.visual-lead__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.visual-flow {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto;
  align-items: center;
  gap: 10px;
}

.flow-chip {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.96);
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.flow-line {
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.3) 0%, rgba(59, 130, 246, 0.45) 100%);
}

.visual-shortcuts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.visual-shortcut {
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, color-mix(in srgb, var(--tool-accent) 8%, white) 100%);
  border: 1px solid color-mix(in srgb, var(--tool-accent) 18%, white);
}

.visual-shortcut img {
  width: 42px;
  height: 42px;
  display: block;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.tool-card {
  min-height: 180px;
  padding: 20px 16px;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
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
  margin: 0;
  position: relative;
  z-index: 1;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

@media (max-width: 1080px) {
  .hero-card {
    grid-template-columns: 1fr;
  }

  .tool-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .home-shell {
    min-height: auto;
  }

  .hero-card {
    padding: 22px;
  }

  .visual-flow,
  .visual-shortcuts {
    grid-template-columns: 1fr;
  }

  .flow-line {
    display: none;
  }

  .tool-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
