<template>
  <div class="compress-panel">
    <div
      id="dropArea"
      :class="{ hover: dropHover }"
      @dragover.prevent="dropHover = true"
      @dragleave.prevent="dropHover = false"
      @drop="handleDrop"
      @click="handleClickUpload"
    >
      <span id="inputPath">
        点击或拖拽 PDF 文件到这里上传
      </span>
    </div>

    <div class="compress-options">
      <div class="option-header">
        <span class="option-title">压缩等级</span>
        <span class="option-tip">体积越小，画质越低</span>
      </div>
      <el-select
        :model-value="compressionLevel"
        placeholder="请选择压缩等级"
        @update:model-value="handleCompressionLevelChange"
      >
        <el-option
          v-for="option in compressionLevelOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </div>

    <button @click="handleCompress">开始压缩</button>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { ref } from 'vue';

type CompressionLevel = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default';

const compressionLevelOptions: { label: string; value: CompressionLevel }[] = [
  { label: '屏幕：最小体积', value: 'screen' },
  { label: '电子书：推荐', value: 'ebook' },
  { label: '打印：较高质量', value: 'printer' },
  { label: '印前：更高质量', value: 'prepress' },
  { label: '默认：尽量保留细节', value: 'default' },
];

const { compressionLevel } = defineProps<{
  compressionLevel: CompressionLevel;
}>()

const emit = defineEmits<{
  (e: 'update:fileList', fileList: { name: string; buffer: ArrayBuffer }[]): void,
  (e: 'update:compressionLevel', compressionLevel: CompressionLevel): void,
  (e: 'handleCompress'): void,
}>()

const dropHover = ref(false)

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  dropHover.value = false

  const files = e.dataTransfer?.files
  if (!files || !files.length) return

  const readFile = (file: File) => {
    return new Promise<{ name: string; buffer: ArrayBuffer } | null>((resolve) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        ElMessage.error(`${file.name} 格式不正确，请上传 PDF 文件`)
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

  const results = await Promise.all(Array.from(files).map(readFile))
  const validFiles = results.filter((file) => file !== null) as { name: string; buffer: ArrayBuffer }[]

  emit('update:fileList', validFiles)
}

const handleClickUpload = async () => {
  const files = await window.electronAPI.selectInputFiles()

  if (files) {
    emit('update:fileList', files)
  }
}

const handleCompressionLevelChange = (value: CompressionLevel) => {
  emit('update:compressionLevel', value)
}

const handleCompress = async () => {
  emit('handleCompress')
}
</script>

<style scoped lang="scss">
.compress-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

#dropArea {
  border: 2px dashed #aaa;
  border-radius: 10px;
  padding: 30px;
  margin: 20px 0 0;
  color: #777;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  height: 70px;
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
  }
}

.compress-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.option-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.option-tip {
  font-size: 12px;
  color: #909399;
}

:deep(.el-select) {
  width: 100%;
}

button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 12px 20px;
  margin: 6px 0 0;
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
