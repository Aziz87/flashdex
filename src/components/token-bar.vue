<template>
  <div style=" background: white">
    <div id="elements">
      <div id="back" class="explore noselect btn" @click="$emit('cancel')">
        <img src="@/assets/close.svg" style="width: 20px">
      </div>
      <!--      <div>Found {{results.length}} tokens</div>-->
      <a :href="token.link(token?.address)" class="explore" target="_blank"> {{ token.symbol }}</a>
      <a id="poocoin" :href="`https://poocoin.app/tokens/${token?.address}`" class="explore" target="_blank">
        <img src="@/assets/poocoin512.webp">
      </a>
      <a v-if="token.selectedPair"
         id="pancake"
         :href="`https://pancakeswap.finance/swap?outputCurrency=${token?.address}&inputCurrency=${token.partnerAddress}`" class="explore" target="_blank">
        <img src="@/assets/pancakeSwap.svg">
      </a>
      <a v-for="(pair,p) of token.printReserves" :href="token.link(token?.pairAddress[p])" target="_blank">
        <div v-if="p===token.selectedPairIndex" class="explore">{{ pair[0][0] }} {{ pair[0][1] }}</div>
        <!--       {{p}}&#45;&#45;{{token.selectedPairIndex}}-->
      </a>
      <span style="margin-left: auto; margin-right: auto"/>
    </div>
  </div>
</template>
<script lang="ts">
import {Network} from "@/classes/models/Network.enum";
import {TokenFound} from "@/classes/models/TokenFound";

export default {
  name: "token-bar",

  props: {
    token: TokenFound,
    network: Network,
  },
  methods: {}
}
</script>
<style lang="scss" scoped>
#elements {
  background: #444;
  height: 50px;
  display: flex;
  padding: 5px 0 5px 0;
  align-items: center;
  overflow-x: scroll;
  overflow-y: hidden;
  width: 100%;
  @media(max-width: 600px) {
    max-width: 100vw;
  }
}
</style>
