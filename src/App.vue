<template>
  <div class="app-shell">
    <header class="window-titlebar" aria-label="Window title bar">
      <div class="window-drag-region">
        <span class="window-title">PDF Squeezer</span>
      </div>

      <div class="window-controls" aria-label="Window controls">
        <button type="button" class="window-control minimize" aria-label="最小化" @click="handleMiniMize">
          <el-icon>
            <Minus/>
          </el-icon>
        </button>
        <button type="button" class="window-control close" aria-label="关闭" @click="handleClose">
          <el-icon>
            <Close/>
          </el-icon>
        </button>
      </div>
    </header>

    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
const handleMiniMize = async () => {
  await window.electronAPI.windowMiniSize()
}

const handleClose = async () => {
  await window.electronAPI.windowClose()
}
</script>

<style lang="scss">
html,
body,
#app {
  min-height: 100%;
}

* {
  box-sizing: border-box;
}

body {
  min-height: 100vh;
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(111, 178, 255, 0.22), transparent 32%),
    radial-gradient(circle at right bottom, rgba(103, 194, 58, 0.16), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f5f8f2 100%);
  color: #1f2937;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'Segoe UI', sans-serif;
}

#app {
  width: 100%;
  min-height: 100vh;
}

.app-shell {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.window-titlebar {
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.78);
  border-bottom: 1px solid rgba(226, 232, 240, 0.78);
  backdrop-filter: blur(14px);
  user-select: none;
  -webkit-app-region: drag;
}

.window-drag-region {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.window-title {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 14px;
  -webkit-app-region: no-drag;
}

.window-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  transition: transform 0.18s ease;

  .el-icon {
    font-size: 10px;
    color: #272727;
    padding-top: 1px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover {
    transform: scale(1.06);

    .el-icon {
      opacity: 1;
    }
  }

  &.close {
    background-color: #fb7185;
  }

  &.minimize {
    background-color: #fbbf24;
  }
}

.app-content {
  width: 100%;
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 24px;
}
</style>