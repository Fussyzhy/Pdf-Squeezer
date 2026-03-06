<template>
  <div class="container">
    <h2>PDF 压缩</h2>

    <div
      id="dropArea"
      :class="{ hover: dropHover }"
      @dragover.prevent="dropHover = true"
      @dragleave.prevent="dropHover = false"
      @drop="handleDrop"
      @click="handleClickUpload"
    >
      <span id="inputPath">
        {{ inputFile.name || '点击/拖拽 PDF 文件到这里上传' }}
      </span>
    </div>

    <button @click="handleSelectOutput">选择输出文件夹</button>
    <span id="outputPath">{{ outputFolder || '未选择文件夹' }}</span>

    <button @click="handleCompress">开始压缩</button>
    <p id="status">{{ status }}</p>
  </div>
  <div class="tag">@Design by Haoyang</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 输入文件
const inputFile = ref<{ name: string; buffer: ArrayBuffer | null }>({
  name: '',
  buffer: null,
});

// 输出文件夹
const outputFolder = ref(localStorage.getItem('outputFolder') || '');
const status = ref('');
const dropHover = ref(false);

const updateOutputPath = (folder: string) => {
  outputFolder.value = folder;
  localStorage.setItem('outputFolder', folder);
};

// 拖拽上传
const handleDrop = async (e: DragEvent) => {
  e.preventDefault();
  dropHover.value = false;

  const file = e.dataTransfer?.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('请上传 PDF 文件！');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    inputFile.value.name = file.name;
    inputFile.value.buffer = reader.result as ArrayBuffer;
  };
  reader.readAsArrayBuffer(file);
};

// 点击上传
const handleClickUpload = async () => {
  const file = await window.electronAPI.selectInputFile();
  if (file) {
    inputFile.value.name = file.name;
    inputFile.value.buffer = file.buffer;
  }
};

// 选择输出文件夹
const handleSelectOutput = async () => {
  const folder = await window.electronAPI.selectOutputFolder();
  if (folder) updateOutputPath(folder);
};

// 压缩 PDF
const handleCompress = async () => {
  if (!inputFile.value.buffer || !outputFolder.value) {
    alert('请选择输入和输出文件夹');
    return;
  }
  status.value = '正在压缩...';
  try {
    const bufferArray = new Uint8Array(inputFile.value.buffer);
    const result = await window.electronAPI.compressPDFBuffer(
      { name: inputFile.value.name, buffer: bufferArray },
      outputFolder.value
    );
    status.value = result.success ? '压缩完成！' : '压缩失败！' + result.error;
  } catch (err: any) {
    status.value = '压缩失败！' + err?.message;
  }
};
</script>

<style scoped lang="scss">
.container {
  background: #fff;
  padding: 40px 50px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  text-align: center;
  width: 450px;
}

h2 { margin-bottom: 30px; color: #333; }

button {
  background-color: #4CAF50;
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
  background-color: #45a049;
  transform: translateY(-2px);
}

span { display: block; margin-top: 5px; font-size: 14px; color: #555; word-break: break-all; }

#status { margin-top: 20px; font-weight: bold; color: #007BFF; }

#dropArea {
  border: 2px dashed #aaa;
  border-radius: 10px;
  padding: 30px;
  margin: 20px 0;
  color: #777;
  transition: border-color 0.3s, background 0.3s;
  cursor: pointer;
}

#dropArea.hover {
  border-color: #4CAF50;
  background: #f0fff0;
  color: #333;
}

.tag { font-size: 12px; color: #999; margin-top: 20px; }
</style>