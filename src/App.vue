<template>
  <div class="window-controls" aria-label="Window controls">
    <button type="button" class="window-control close" aria-label="关闭" @click="handleClose">
      <el-icon>
        <Close/>
      </el-icon>
    </button>
    <button type="button" class="window-control minimize" aria-label="最小化" @click="handleMiniMize">
      <el-icon>
        <Minus/>
      </el-icon>
    </button>
  </div>
  <div class="app-shell">
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
  min-height: calc(100vh - 48px);
}

.app-shell {
  width: 100%;
  min-height: inherit;
  position: relative;
  display: flex;
  justify-content: center;
  padding: 24px;
}

.app-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.window-controls {
  height: 30px;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0px 15px;
  gap: 10px;
}

.window-control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 0px;
  cursor: pointer;

  .el-icon {
    font-size: 10px;
    color: #272727;
    padding-top: 2px;
    opacity: 0;
    transition: all 0.3s ease;
  }

  &:hover {
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
</style>