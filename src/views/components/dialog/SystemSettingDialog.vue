<template>
  <el-dialog
    class="system-setting-dialog"
    title="输出设置"
    :model-value="modelValue"
    width="460px"
    @close="handleClose"
    align-center
  >
    <div class="setting-form">
      <section class="setting-hero">
        <span class="setting-hero__badge">统一输出位置</span>
        <h3>选择结果保存目录</h3>
        <p>压缩、合并、拆分和格式转换都会默认保存到这里，方便统一整理结果文件。</p>
      </section>

      <section class="setting-summary">
        <div class="summary-item">
          <span class="summary-label">当前状态</span>
          <strong>{{ form.outputFolder ? '已设置输出目录' : '尚未设置输出目录' }}</strong>
          <p>
            {{ form.outputFolder ? '所有处理结果都会默认保存到这个目录。' : '开始处理前请先选择一个输出目录。' }}
          </p>
        </div>
      </section>

      <div class="setting-group">
        <div class="setting-label">输出文件夹</div>
        <div class="folder-row">
          <div class="folder-value">
            {{ form.outputFolder || '尚未选择输出文件夹' }}
          </div>
          <el-button type="primary" @click="handleSelectOutput">选择文件夹</el-button>
        </div>
      </div>

      <div class="setting-notes">
        <section class="note-card">
          <strong>不会覆盖原文件</strong>
          <p>压缩、合并和拆分都会生成新的结果文件，方便回溯和复查。</p>
        </section>
        <section class="note-card">
          <strong>转换结果更好整理</strong>
          <p>PDF 转图片时会按源文件创建子文件夹，便于查看、归类和归档。</p>
        </section>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存设置</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const form = reactive({
  outputFolder: '',
})

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSave = () => {
  localStorage.setItem('outputFolder', form.outputFolder)
  ElMessage.success('设置已保存')
  handleClose()
}

watch(() => props.modelValue, (newVal) => {
  if (!newVal) return

  form.outputFolder = localStorage.getItem('outputFolder') || ''
})

const handleSelectOutput = async () => {
  const folder = await window.electronAPI.selectOutputFolder()
  if (folder) form.outputFolder = folder
}
</script>

<style scoped lang="scss">
.system-setting-dialog :deep(.el-dialog__body) {
  padding-top: 12px;
}

.setting-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.setting-hero {
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f5f9ff 0%, #fcfdff 100%);
  border: 1px solid #dce9f8;
  text-align: left;

  h3 {
    margin: 8px 0 6px;
    color: #1f2937;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: #667085;
    line-height: 1.6;
    font-size: 13px;
  }
}

.setting-hero__badge {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  height: 26px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.12);
  color: #2b6cb0;
  font-size: 12px;
  font-weight: 600;
}

.setting-summary {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid #e0ebf8;
}

.summary-item {
  text-align: left;

  strong {
    display: block;
    margin: 6px 0;
    color: #1f2937;
    font-size: 17px;
  }

  p {
    margin: 0;
    color: #667085;
    line-height: 1.6;
    font-size: 13px;
  }
}

.summary-label {
  font-size: 12px;
  font-weight: 600;
  color: #2b6cb0;
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
  padding: 10px 12px;
  border-radius: 10px;
  background-color: #f8fafc;
  color: #606266;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.setting-notes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.note-card {
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff8eb;
  border: 1px solid #f6deb2;
  text-align: left;

  strong {
    display: block;
    color: #8a6707;
    margin-bottom: 6px;
    font-size: 14px;
  }

  p {
    margin: 0;
    color: #946f12;
    font-size: 12px;
    line-height: 1.6;
  }
}

@media (max-width: 640px) {
  .folder-row {
    flex-direction: column;
    align-items: stretch;
  }

  .setting-notes {
    grid-template-columns: 1fr;
  }
}
</style>