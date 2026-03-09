<template>
  <div
    id="dropArea"
    :class="{ hover: dropHover }"
    @dragover.prevent="dropHover = true"
    @dragleave.prevent="dropHover = false"
    @drop="handleDrop"
    @click="handleClickUpload"
  >
    <span id="inputPath">
      点击/拖拽 PDF 文件到这里上传
    </span>
  </div>
  <button @click="handleCompress">开始合并</button>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { ref } from 'vue';

const dropHover = ref(false)

const emit = defineEmits<{
  (e: 'update:fileList', fileList: { name: string; buffer: ArrayBuffer }[]): void,
  (e: 'handleMerge'): void,
}>()

// 拖拽上传
const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  dropHover.value = false

  const files = e.dataTransfer?.files
  if (!files || !files.length) return

  const inputFile: { name: string; buffer: ArrayBuffer }[] = []

  const readFile = (file: File) => {
    return new Promise<{ name: string; buffer: ArrayBuffer } | null>((resolve) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        ElMessage.error(`${file.name} 格式不正确，请上传 PDF 文件！`)
        return resolve(null)
      }

      const reader = new FileReader()
      reader.onload = () => {
        resolve({ name: file.name, buffer: reader.result as ArrayBuffer })
      }
      reader.onerror = () => resolve(null)
      reader.readAsArrayBuffer(file)
    })
  }

  // 等待所有文件读取完成
  const results = await Promise.all(Array.from(files).map(readFile))

  // 过滤掉无效文件
  const validFiles = results.filter(f => f !== null) as { name: string; buffer: ArrayBuffer }[]

  // 触发更新
  emit('update:fileList', validFiles)
}

// 点击上传
const handleClickUpload = async () => {
  const files = await window.electronAPI.selectInputFiles()

  if (files) {
    emit('update:fileList', files)
  }
}

// 压缩 PDF
const handleCompress = async () => {
  emit('handleMerge')
}
</script>

<style scoped lang="scss">
#dropArea {
  border: 2px dashed #aaa;
  border-radius: 10px;
  padding: 30px;
  margin: 20px 0;
  color: #777;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;

  &:hover {
    border-color: #409eff;
    background: #40a0ff1e;
    color: #333;

    #inputPath {
      color: #409eff;
    }

    .clearFile {
      opacity: 1;
    }
  }
}

button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 12px 20px;
  margin: 10px 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s, transform 0.2s;
}

button:hover {
  background-color: #40a0ffd0;
  transform: translateY(-2px);
}
</style>
