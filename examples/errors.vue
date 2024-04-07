<script setup lang="ts">
import { RouterView } from "vue-router";

const x = [1, 2, 3, "4"];

function y(param: number[]) {}

y(x);
</script>
<template>
  <RouterView />
</template>
