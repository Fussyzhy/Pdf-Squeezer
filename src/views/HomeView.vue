<template>
  <div class="home-shell">
    <div class="home-panel">
      <section class="hero-card">
        <div class="hero-copy">
          <div class="hero-copy__top" v-if="false">
            <span class="hero-badge">PDF Squeezer</span>
            <span class="hero-kicker">Local-first</span>
          </div>

          <h1>PDF Squeezer</h1>
          <p>
            集中处理你的 PDF 文件，选择需要的功能，快速开始操作。
          </p>

          <!-- <div class="hero-actions">
            <RouterLink :to="primaryToolPath" class="hero-button hero-button--primary">
              开始处理
            </RouterLink>
            <a href="#tool-grid" class="hero-button hero-button--ghost">
              查看功能
            </a>
          </div> -->

          <div class="hero-notes" v-if="false">
            <span>{{ toolCount }} 个功能</span>
            <span>本地处理</span>
            <span>统一输出目录</span>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-window">
            <div class="visual-window__bar">
              <div class="visual-dots">
                <span class="visual-dot visual-dot--red" />
                <span class="visual-dot visual-dot--yellow" />
                <span class="visual-dot visual-dot--green" />
              </div>
              <!-- <span class="visual-window__title">Workspace Preview</span> -->
            </div>

            <div class="visual-window__body">
              <div class="visual-lead">
                <span class="visual-lead__badge">Quick Start</span>
                <strong>一站式 PDF 工具箱</strong>
                <p>入口更清楚，页面更聚焦。</p>
              </div>

              <div class="visual-flow">
                <div class="flow-chip">选择功能</div>
                <div class="flow-line" />
                <div class="flow-chip">拖入文件</div>
                <div class="flow-line" />
                <div class="flow-chip">导出结果</div>
              </div>

              <div class="visual-tools" v-if="false">
                <span
                  v-for="tool in tools"
                  :key="tool.id"
                  class="visual-tool"
                  :style="{ '--tool-accent': tool.accent }"
                >
                  {{ tool.navLabel }}
                </span>
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
const primaryToolPath = computed(() => tools[0]?.path ?? '/')
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
    font-size: clamp(36px, 5vw, 56px);
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

.hero-copy__top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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

.hero-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(203, 213, 225, 0.8);
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 22px;
}

.hero-button {
  min-height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.hero-button:hover {
  transform: translateY(-1px);
}

.hero-button--primary {
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 14px 28px rgba(29, 78, 216, 0.22);
}

.hero-button--ghost {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(218, 228, 240, 0.9);
  color: #334155;
}

.hero-notes {
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

.visual-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.visual-tool {
  padding: 9px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tool-accent) 10%, white);
  border: 1px solid color-mix(in srgb, var(--tool-accent) 18%, white);
  color: #334155;
  font-size: 12px;
  font-weight: 700;
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

  .hero-actions {
    flex-direction: column;
  }

  .hero-button {
    width: 100%;
  }

  .hero-notes {
    flex-direction: column;
  }

  .visual-flow {
    grid-template-columns: 1fr;
  }

  .flow-line {
    display: none;
  }

  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
