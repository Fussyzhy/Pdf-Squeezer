<template>
  <el-dialog
    class="system-setting-dialog"
    title="输出设置"
    :model-value="modelValue"
    width="500px"
    @close="handleClose"
    align-center
  >
    <div class="setting-form">
      <div class="setting-group">
        <div class="setting-label">输出文件夹</div>
        <div class="folder-row">
          <div class="folder-value">
            {{ form.outputFolder || '未选择文件夹' }}
          </div>
          <el-button type="primary" @click="handleSelectOutput">选择输出文件夹</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>()

const form = reactive({
  outputFolder: '',
});

const handleClose = () => {
  emit('update:modelValue', false);
}

const handleSave = () => {
  localStorage.setItem('outputFolder', form.outputFolder);
  ElMessage.success('设置已保存');
  handleClose();
};

watch(() => props.modelValue, (newVal) => {
  if (!newVal) return;

  form.outputFolder = localStorage.getItem('outputFolder') || '';
})

const handleSelectOutput = async () => {
  const folder = await window.electronAPI.selectOutputFolder();
  if (folder) form.outputFolder = folder;
}
</script>

<style scoped lang="scss">
.system-setting-dialog :deep(.el-dialog__body) {
  min-height: 140px;
}

.setting-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  text-align: left;
  color: #303133;
  font-weight: 600;
}

.folder-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.folder-value {
  flex: 1;
  border: 1px solid #e4e7ed;
  padding: 5px 10px;
  border-radius: 4px;
  background-color: #f5f7fa;
  color: #606266;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>
