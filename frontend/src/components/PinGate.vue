<script setup lang="ts">
import { ref } from "vue";
import { usePinAuth } from "../composables/usePinAuth";

const { isAuthorized, authError, loading, authorize, clearPin } = usePinAuth();
const pinInput = ref("");

const onSubmit = async () => {
  if (!pinInput.value.trim()) {
    return;
  }
  await authorize(pinInput.value.trim());
  pinInput.value = "";
};
</script>

<template>
  <div class="pin-card">
    <template v-if="isAuthorized">
      <div class="pin-ok">Authorized by PIN</div>
      <button class="btn ghost" @click="clearPin">Logout</button>
    </template>
    <template v-else>
      <form class="pin-form" @submit.prevent="onSubmit">
        <input v-model="pinInput" type="password" pattern="[0-9]*" inputmode="numeric" placeholder="Enter PIN" autocomplete="off" />
        <button class="btn" type="submit" :disabled="loading">Login</button>
      </form>
      <p v-if="authError" class="error-text">{{ authError }}</p>
    </template>
  </div>
</template>
