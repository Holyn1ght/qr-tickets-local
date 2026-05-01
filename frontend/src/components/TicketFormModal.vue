<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  title: string;
  initialGuestName?: string;
  initialNote?: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  save: [payload: { guestName: string; note: string | null }];
  close: [];
}>();

const guestName = ref(props.initialGuestName ?? "");
const note = ref(props.initialNote ?? "");

watch(
  () => [props.initialGuestName, props.initialNote, props.open],
  () => {
    guestName.value = props.initialGuestName ?? "";
    note.value = props.initialNote ?? "";
  }
);

const canSave = computed(() => guestName.value.trim().length > 0 && !props.loading);

const onSave = () => {
  const trimmedName = guestName.value.trim();
  if (!trimmedName) {
    return;
  }
  emit("save", {
    guestName: trimmedName,
    note: note.value.trim() ? note.value.trim() : null,
  });
};
</script>

<template>
  <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <h3>{{ title }}</h3>
      <div class="field">
        <label>Guest name</label>
        <input v-model="guestName" type="text" maxlength="120" />
      </div>
      <div class="field">
        <label>Note (optional)</label>
        <textarea v-model="note" rows="3" maxlength="500" />
      </div>
      <div class="modal-actions">
        <button class="btn ghost" @click="$emit('close')">Cancel</button>
        <button class="btn" :disabled="!canSave" @click="onSave">Save</button>
      </div>
    </div>
  </div>
</template>
