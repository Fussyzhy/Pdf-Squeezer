<template>
  <div class="file-drawer">
    <!-- 顶部 -->
    <div class="drawer-header">
      <span>上传文件 ({{ files.length }})</span>
      <el-button size="mini" type="danger" @click="clearFiles">清空</el-button>
    </div>

    <!-- 文件列表 -->
    <draggable v-model="files" item-key="name" animation="150">
      <template #item="{ element, index }">
        <div class="file-item">
          <span>{{ element.name }} ({{ formatSize(0) }})</span>
          <el-icon class="delete" @click="removeFile(index)">
            <Close />
          </el-icon>
        </div>
      </template>
    </draggable>

    <!-- 空状态 -->
    <div v-if="files.length === 0" class="empty">
      暂无文件
    </div>

    <div class="button-visible" :class="{hide: !visible}">
      <el-icon @click="() => emit('update:visible', !visible)"><ArrowLeftBold /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import draggable from "vuedraggable"

interface PdfFile {
  name: string,
  buffer: ArrayBuffer
}

// 父组件传入文件列表
const props = defineProps<{
  modelValue: PdfFile[],
  visible: boolean
}>()

const emit = defineEmits<{
  (e: "update:modelValue", files: PdfFile[]): void,
  (e: "update:visible", visible: boolean): void,
}>()

const files = ref<PdfFile[]>([])

// 同步父组件数据
watch(
  () => props.modelValue,
  (v) => {
    files.value = v || []
  },
  { immediate: true }
)

// 拖拽排序后同步回父组件
watch(
  files,
  (v) => emit("update:modelValue", v),
  { deep: true }
)

// 删除文件
const removeFile = (index:number) => {
  files.value.splice(index,1)
}

// 清空列表
const clearFiles = () => {
  files.value = []
}

// 格式化大小
const formatSize = (size:number) => {
  if(size<1024) return size+"B"
  if(size<1024*1024) return (size/1024).toFixed(1)+"KB"
  return (size/1024/1024).toFixed(1)+"MB"
}
</script>

<style scoped lang="scss">
.file-drawer{
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;

  .drawer-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    font-weight:600;
    margin-bottom:10px;
  }

  .file-item{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:6px 8px;
    border:1px solid #eee;
    border-radius:6px;
    margin-bottom:6px;
    background:#fafafa;
    cursor:move;

    .delete{
      cursor:pointer;
      color:#999;
      &:hover{ color:#f56c6c; }
    }
  }

  .empty{
    color:#aaa;
    padding:20px 0;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button-visible {
    position: absolute;
    top: 50%;
    left: -10px;
    font-size: 20px;
    cursor: pointer;
    color: #333;
    transition: color 0.3s;
    transform: rotate(180deg);
    transition: all 0.3s;
    background-color: rgba(197, 197, 197, 0.144);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px 0px;
    border-radius: 10px 0 0 10px;
    opacity: 0;

    &.hide {
      transform: translateX(-100%) rotate(0deg);
      opacity: 1;
    }

    &:hover {
      opacity: 1;
    }
  }
}
</style>