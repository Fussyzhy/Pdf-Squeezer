<template>
  <div class="container" v-loading="isLoading">
    <h2>PDF 压缩</h2>

    <div
      id="dropArea"
      :class="{ hover: dropHover }"
      @dragover.prevent="dropHover = true"
      @dragleave.prevent="dropHover = false"
      @drop="handleDrop"
      @click="handleClickUpload"
    >
      <div class="clearFile">
        <el-icon @click.stop="clearInputFile"><Close /></el-icon>
      </div>
      <span id="inputPath">
        {{ inputFile.name || '点击/拖拽 PDF 文件到这里上传' }}
      </span>
    </div>
    <!-- <button @click="handleSelectOutput">选择输出文件夹</button>
    <span id="outputPath">{{ outputFolder || '未选择文件夹' }}</span> -->

    <button @click="handleCompress">开始压缩</button>
    <div class="setting-btn">
      <el-icon @click="handleOpenSettings"><Setting /></el-icon>
    </div>
  </div>
  <div class="tag">@Design by Haoyang</div>
  <system-setting-dialog v-model="settingsVisible" />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { ref } from 'vue';

// 输入文件
const inputFile = ref<{ name: string; buffer: ArrayBuffer | null }>({
  name: '',
  buffer: null,
});

// 输出文件夹
const outputFolder = ref(localStorage.getItem('outputFolder') || '');
const isLoading = ref(false);
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
  if(!inputFile.value.buffer ) {
    ElMessage.error('请上传 PDF 文件！');
    return;
  }
  if (!outputFolder.value) {
    ElMessage.error('请设置输出文件夹！');
    return;
  }
  isLoading.value = true;
  try {
    const bufferArray = new Uint8Array(inputFile.value.buffer);
    const result = await window.electronAPI.compressPDFBuffer(
      { name: inputFile.value.name, buffer: bufferArray },
      outputFolder.value
    );
    if(result.success) {
      ElMessage.success('压缩完成！');
    } else {
      ElMessage.error('压缩失败！');
    }
    isLoading.value = false;
  } catch (err: any) {
    ElMessage.error('压缩失败！');
    isLoading.value = false;
  }
};

const settingsVisible = ref(false);
const handleOpenSettings = () => {
  settingsVisible.value = true;
}

const clearInputFile = () => {
  inputFile.value.name = '';
  inputFile.value.buffer = null;
}
</script>

<style scoped lang="scss">
.container {
  background: #fff;
  padding: 40px 50px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  text-align: center;
  width: 450px;
  position: relative;

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
}

h2 { margin-bottom: 30px; color: #333; }

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

span { display: block; margin-top: 5px; font-size: 14px; color: #555; word-break: break-all; }

#dropArea {
  border: 2px dashed #aaa;
  border-radius: 10px;
  padding: 30px;
  margin: 20px 0;
  color: #777;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;

  .clearFile {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 18px;
    cursor: pointer;
    color: #585858;
    transition: all 0.3s;
    opacity: 0;

    &:hover {
      color: #409eff;
    }
  }

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

.tag {
  font-size: 12px;
  color: #999;
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>