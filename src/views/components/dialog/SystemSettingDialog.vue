<template>
  <el-dialog
    class="system-setting-dialog"
    title="输出设置"
    :model-value="modelValue"
    width="500px"
    @close="handleClose"
    align-center
  >
    <div style="display: flex; align-items: center; gap: 10px; height: 100px;">
      <div style="flex: 1; border: 1px solid #e4e7ed; padding: 5px; border-radius: 4px; background-color: #f5f7fa; color: #a8abb2; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
        {{ form.outputFolder || '未选择文件夹' }}
      </div>
      <el-button type="primary" @click="handleSelectOutput">选择输出文件夹</el-button>
    </div>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

// 是否显示 Dialog
const props = defineProps<{
  modelValue: boolean;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>()

// 表单数据
const form = reactive({
  username: '',
  language: 'zh',
  autoUpdate: true,
  themeColor: '#409EFF',
  outputFolder: '',
});

const handleClose = () => {
  emit('update:modelValue', false);
}

// 保存表单
const handleSave = () => {
  console.log('保存设置', { ...form });
  // 保存输出文件夹到 localStorage
  localStorage.setItem('outputFolder', form.outputFolder);
  ElMessage.success('设置已保存');
  handleClose();
};

watch(() => props.modelValue, (newVal) => {
  form.outputFolder = localStorage.getItem('outputFolder') || '';
})

// 选择输出文件夹
const handleSelectOutput = async () => {
  const folder = await window.electronAPI.selectOutputFolder();
  if (folder) form.outputFolder = folder;
}
</script>

<style scoped lang="scss">
.system-setting-dialog :deep(.el-dialog__body) {
  min-height: 400px;
}
</style>