<template>
  <router-view />
</template>

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
  padding: 24px;
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
  display: flex;
  justify-content: center;
}
</style>
