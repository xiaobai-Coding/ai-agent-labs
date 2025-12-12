<template>
  <div class="upload-container">
    <label class="upload-box" :class="{ hover: isHover }">
      <input
        type="file"
        accept=".pdf,.docx"
        @change="onFileChange"
        @dragenter.prevent="isHover = true"
        @dragleave.prevent="isHover = false"
        @dragover.prevent
        @drop.prevent="handleDrop"
      />
      <div class="upload-content">
        <div class="upload-icon">📄</div>
        <div class="upload-text">
          <span class="upload-primary">点击选择文件</span>
          <span class="upload-secondary">或拖拽文件到此处</span>
        </div>
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits(["file-upload"]);
const isHover = ref(false);

function onFileChange(e: any) {
  const file = e.target.files?.[0];
  if (file) {
    emit("file-upload", file);
    isHover.value = false;
  }
}

function handleDrop(e: DragEvent) {
  isHover.value = false;
  const file = e.dataTransfer?.files[0];
  if (file && (file.name.endsWith(".pdf") || file.name.endsWith(".docx"))) {
    emit("file-upload", file);
  }
}
</script>

<style scoped>
.upload-container {
  width: 100%;
}

.upload-box {
  display: block;
  width: 100%;
  padding: 32px 24px;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.upload-box:hover,
.upload-box.hover {
  border-color: #6366f1;
  background: #f0f4ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
}

.upload-box input[type="file"] {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-content {
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 48px;
  line-height: 1;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-primary {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.upload-secondary {
  font-size: 13px;
  color: #6b7280;
}

@media (max-width: 640px) {
  .upload-box {
    padding: 24px 18px;
  }

  .upload-icon {
    font-size: 40px;
  }

  .upload-primary {
    font-size: 14px;
  }

  .upload-secondary {
    font-size: 12px;
  }
}
</style>