import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

type EditorPdfBuffer = ArrayBuffer | Uint8Array

export type EditorPdfFile = {
  name: string
  buffer: Uint8Array
}

function normalizeBuffer(buffer: EditorPdfBuffer) {
  return buffer instanceof Uint8Array
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer)
}

export const useEditorStore = defineStore('editor', () => {
  const currentFile = shallowRef<EditorPdfFile | null>(null)

  const currentFileName = computed(() => currentFile.value?.name ?? '')
  const hasFile = computed(() => Boolean(currentFile.value))

  function setCurrentFile(file: { name: string; buffer: EditorPdfBuffer }) {
    currentFile.value = {
      name: file.name,
      buffer: normalizeBuffer(file.buffer),
    }
  }

  function clearCurrentFile() {
    currentFile.value = null
  }

  return {
    currentFile,
    currentFileName,
    hasFile,
    setCurrentFile,
    clearCurrentFile,
  }
})
