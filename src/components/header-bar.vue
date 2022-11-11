<template>
  <div id="row" class="flex wrap">
    <div class="w100 flex">
      <logo id="logo" class="only_desktop"/>
      <div id="tf1" class="w100">
        <input id="filter" v-model="filters" placeholder="Token name or address" style="padding-left: 60px;" type="text">
        <div class="label">
          <img src="@/assets/search.svg" style="width: 20px; margin-left: 10px" alt="search">
        </div>
        <div v-if="filters" id="clear" class="noselect" @click="filters=''">
          <img src="@/assets/close.svg" style="width: 20px" alt="clear">
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Logo from "@/components/ui/logo.vue";
export default {
  name: "header-bar",
  components: {Logo},
  watch:{
    filters(n){
      this.$emit("update:modelValue", n)
    }
  },
  props:{
    modelValue:String
  },
  data(){
    let filters:string="";
    return { filters }
  }
}
</script>
<style scoped lang="scss">

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
  height: 50px;
}

.label {
  padding: 15px;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  position: absolute;
  color: #fff;
}

#totalSupply {
  width: 100%;
  padding-left: 120px;
}

#filter {
  width: 100%;
  text-transform: uppercase;
}

#filter, #totalSupply {
  height: 50px;
  border-radius: 0px;
  font-size: 20px;
  font-weight: 200;
  border: none;
  background: #444;
  color: #fff;
}

#tf1, #tf2 {
  width: 100%;
  position: relative;
}

#tf2 {
  max-width: 300px;
  @media(min-width: 600px) {
    margin-left: 5px;
  }
  @media(max-width: 599px) {
    margin-top: 5px;
    min-width: 100%;
  }
}

#row{
  padding: 10px;
}
#logo{
  padding: 0 20px 0 0 ;
}
#clear {
  cursor: pointer;
  padding: 10px;
  color: white;
  position: absolute;
  right: 0;
  top: 0;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.1s all ease-in-out;

&:hover {
   transform: scale(1.05);

 }
}
</style>
