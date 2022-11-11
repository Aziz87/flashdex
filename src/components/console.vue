<template>
  <div id="console" class="flex"
       style="flex-wrap: wrap; text-wrap: initial; min-height: 100px; border: 1px solid grey; padding: 10px; margin:5px; height: 100%"
       v-html="log">
  </div>
</template>

<script lang="ts">
export default {
  name: "console"
}
</script>
<style scoped>
</style>
