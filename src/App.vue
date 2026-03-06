<template>
  <router-view />
</template>

<style lang="scss">
html, body {
  height: 100%;       /* 确保 body 高度撑满视口 */
  margin: 0;          /* 去掉默认 margin */
  display: flex;      /* 使用 Flex 布局 */
  justify-content: center; /* 水平居中 */
  align-items: center;     /* 垂直居中 */
  background: #f4f6f8;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}
</style>