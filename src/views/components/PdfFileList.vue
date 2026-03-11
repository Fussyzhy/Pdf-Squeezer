<template>
  <div class="file-drawer" :class="{ 'file-drawer--collapsed': !visible }">
    <button
      class="drawer-toggle"
      type="button"
      @click="emit('update:visible', !visible)"
      :class="{ 'expanded': !visible }"
    >
      <el-icon class="drawer-icon">
        <arrow-right />
      </el-icon>
    </button>

    <template v-if="visible">
      <div class="drawer-header">
        <div class="drawer-heading">
          <strong>{{ title }}</strong>
          <p>共 {{ files.length }} 个文件 · {{ formatSize(totalSize) }}</p>
        </div>

        <el-button text type="danger" :disabled="files.length === 0" @click="clearFiles">
          清空
        </el-button>
      </div>

      <div v-if="files.length" class="drawer-note">
        支持拖拽调整顺序，处理时会按当前列表顺序执行。
      </div>

      <draggable
        v-model="files"
        item-key="name"
        animation="180"
        class="drawer-list"
        @change="emitCurrentFiles"
      >
        <template #item="{ element, index }">
          <div class="file-item">
            <div class="file-index">{{ String(index + 1).padStart(2, '0') }}</div>

            <div class="file-meta">
              <strong :title="element.name">{{ element.name }}</strong>
              <span>{{ formatSize(element.buffer.byteLength) }}</span>
            </div>

            <button class="file-remove" type="button" @click="removeFile(index)">
              移除
            </button>
          </div>
        </template>
      </draggable>

      <div v-if="files.length === 0" class="empty-state">
        <strong>文件列表暂时为空</strong>
        <p>从左侧上传或拖入文件后，会统一显示在这里，方便继续管理。</p>
      </div>
    </template>

    <div v-else class="drawer-collapsed">
      <strong>{{ files.length }}</strong>
      <span>文件</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue';
import { computed, ref, watch } from 'vue'
import draggable from 'vuedraggable'

interface PdfFile {
  name: string
  buffer: ArrayBuffer
}

const props = withDefaults(defineProps<{
  modelValue: PdfFile[]
  visible: boolean
  title?: string
}>(), {
  title: '文件清单',
})

const emit = defineEmits<{
  (e: 'update:modelValue', files: PdfFile[]): void
  (e: 'update:visible', visible: boolean): void
}>()

const files = ref<PdfFile[]>([])

const totalSize = computed(() => {
  return files.value.reduce((sum, file) => sum + file.buffer.byteLength, 0)
})

watch(
  () => props.modelValue,
  (value) => {
    files.value = [...(value || [])]
  },
  { immediate: true },
)

const emitCurrentFiles = () => {
  emit('update:modelValue', [...files.value])
}

const removeFile = (index: number) => {
  files.value.splice(index, 1)
  emitCurrentFiles()
}

const clearFiles = () => {
  files.value = []
  emitCurrentFiles()
}

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
</script>

<style scoped lang="scss">
.file-drawer {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 56px 16px 16px;
  transition: padding 0.2s ease;
}

.file-drawer--collapsed {
  padding: 56px 10px 10px;
  justify-content: center;
  align-items: center;
}

.drawer-toggle {
  position: absolute;
  top: 14px;
  right: 14px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #d5deea;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  transition: width 0.3s ease;

  &.expanded {
    width: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    .drawer-icon {
      transform: rotate(180deg);
    }
  }

  .drawer-icon {
    transition: transform 0.3s ease;
  }
}

.file-drawer--collapsed .drawer-toggle {
  right: 50%;
  transform: translateX(50%);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.drawer-heading {
  text-align: left;

  strong {
    display: block;
    font-size: 18px;
    color: #0f172a;
  }

  p {
    margin: 6px 0 0;
    font-size: 12px;
    color: #64748b;
  }
}

.drawer-note {
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid #e2eaf4;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
  text-align: left;
}

.drawer-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e3ebf3;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
  cursor: move;
}

.file-index {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.file-meta {
  flex: 1;
  min-width: 0;
  text-align: left;

  strong {
    display: block;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: #64748b;
  }
}

.file-remove {
  border: none;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.empty-state {
  flex: 1;
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed #d6e1ee;
  background: rgba(248, 250, 252, 0.9);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;

  strong {
    color: #0f172a;
    font-size: 16px;
  }

  p {
    margin: 8px 0 0;
    color: #64748b;
    line-height: 1.7;
    font-size: 13px;
  }
}

.drawer-collapsed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 0;
  color: #475569;

  strong {
    font-size: 24px;
    color: #0f172a;
  }

  span {
    font-size: 12px;
  }
}
</style>