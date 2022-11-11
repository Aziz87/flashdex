<template>
  <span class="pulse"></span>
</template>
<script>
export default {
  name: "pulse"
}
</script>
<style scoped>
.pulse {
  margin:100px;
  display: block;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #cc2cc9;
  box-shadow: 0 0 0 rgba(204, 44, 183, 0.4);
  animation: pulse 2s infinite;
}
.pulse:hover {
  animation: none;
}

@-webkit-keyframes pulse {
  0% {
    -webkit-box-shadow: 0 0 0 0 rgba(204,169,44, 0.4);
  }
  70% {
    -webkit-box-shadow: 0 0 0 20px rgba(204,169,44, 0);
  }
  100% {
    -webkit-box-shadow: 0 0 0 0 rgba(204,169,44, 0);
  }
}
@keyframes pulse {
  0% {
    -moz-box-shadow: 0 0 0 0 rgba(204,169,44, 0.4);
    box-shadow: 0 0 0 0 rgba(204,169,44, 0.4);
  }
  70% {
    -moz-box-shadow: 0 0 0 10px rgba(204,169,44, 0);
    box-shadow: 0 0 0 20px rgba(204,169,44, 0);
  }
  100% {
    -moz-box-shadow: 0 0 0 0 rgba(204,169,44, 0);
    box-shadow: 0 0 0 0 rgba(204,169,44, 0);
  }
}
</style>
