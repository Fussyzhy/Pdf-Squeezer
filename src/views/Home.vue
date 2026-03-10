<template>
  <div class="container" v-loading="isLoading">
    <h2>PDF 工具箱</h2>

    <el-tabs v-model="activeTab" class="tool-tabs">
      <el-tab-pane label="PDF 压缩" name="compress">
        <compress-view @update:fileList="updateFileList" @handle-compress="handleCompress" />
      </el-tab-pane>

      <el-tab-pane label="PDF 合并" name="merge">
        <merge-view @update:fileList="updateFileList" @handle-merge="handleMerge" />
      </el-tab-pane>

      <el-tab-pane label="PDF 拆分" name="split">
        <div class="placeholder">
          PDF 拆分功能开发中
        </div>
      </el-tab-pane>

      <el-tab-pane label="格式转换" name="convert">
        <div class="placeholder">
          PDF 转换功能开发中
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="setting-btn">
      <el-icon @click="handleOpenSettings"><Setting /></el-icon>
    </div>

    <div class="file-list-container" :class="{ hide: !fileListVisible }">
      <pdf-file-list
        v-model="fileList"
        :visible="fileListVisible"
        @update:visible="(visible) => fileListVisible = visible"
      />
    </div>
  </div>

  <div class="tag">@Design by Haoyang</div>
  <system-setting-dialog v-model="settingsVisible" />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default'

const DEFAULT_COMPRESSION_LEVEL: CompressionLevel = 'ebook'
const compressionLevels: CompressionLevel[] = ['screen', 'ebook', 'printer', 'prepress', 'default']

const activeTab = ref('compress')
const isLoading = ref(false)
const settingsVisible = ref(false)
const fileListVisible = ref(false)
const fileList = ref<{ name: string; buffer: ArrayBuffer }[]>([])

const handleOpenSettings = () => {
  settingsVisible.value = true
}

const updateFileList = (val: { name: string; buffer: ArrayBuffer }[]) => {
  if (!val.length) return

  fileList.value.push(...val)
  ElMessage.success('文件已添加到列表')
}

const getCompressionLevel = (): CompressionLevel => {
  const savedLevel = localStorage.getItem('compressionLevel')

  if (compressionLevels.includes(savedLevel as CompressionLevel)) {
    return savedLevel as CompressionLevel
  }

  return DEFAULT_COMPRESSION_LEVEL
}

const handleCompress = async () => {
  if (!fileList.value.length) {
    ElMessage.error('请先上传 PDF 文件')
    return
  }

  const outputFolder = localStorage.getItem('outputFolder')
  const compressionLevel = getCompressionLevel()

  if (!outputFolder) {
    ElMessage.error('请先设置输出文件夹')
    return
  }

  try {
    const files = fileList.value.map((item) => ({
      name: item.name,
      buffer: new Uint8Array(item.buffer),
    }))

    const result = await window.electronAPI.compressPDFBuffer(files, outputFolder, compressionLevel)

    if (result.success) {
      ElMessage.success('压缩完成')
    } else {
      ElMessage.error('压缩失败')
      console.log(result.error)
    }
  } catch (err) {
    ElMessage.error('压缩失败')
    console.log(err)
  } finally {
    isLoading.value = false
  }
}

const handleMerge = async () => {
  if (!fileList.value.length) {
    ElMessage.error('请先上传 PDF 文件')
    return
  }

  const outputFolder = localStorage.getItem('outputFolder')

  if (!outputFolder) {
    ElMessage.error('请先设置输出文件夹')
    return
  }

  try {
    const files = fileList.value.map((item) => ({
      name: item.name,
      buffer: new Uint8Array(item.buffer),
    }))

    const result = await window.electronAPI.mergePDFBuffer(files, outputFolder)

    if (result.success) {
      ElMessage.success('合并完成')
    } else {
      ElMessage.error('合并失败')
      console.log(result.error)
    }
  } catch (err) {
    ElMessage.error('合并失败')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.container {
  background: #fff;
  padding: 40px 50px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 450px;
  position: relative;
  height: 400px;
  overflow: hidden;

  .setting-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 20px;
    cursor: pointer;
    color: #333;
    transition: color 0.3s;

    &:hover {
      color: #409eff;
    }
  }

  .file-list-container {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 300px;
    bottom: 10px;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 10px;
    z-index: 10;
    transition: all 0.3s ease;
    display: flex;
    overflow: visible;

    &.hide {
      transform: translateX(103%);
    }

    &:hover {
      &.hide {
        transform: translateX(100%);
      }
    }
  }
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

.tool-tabs {
  margin-top: 10px;
}

span {
  display: block;
  margin-top: 5px;
  font-size: 14px;
  color: #555;
  word-break: break-all;
}

.placeholder {
  padding: 40px;
  color: #888;
}

.tag {
  font-size: 12px;
  color: #999;
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
