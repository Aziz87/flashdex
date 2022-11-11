<template>
  <div>
    <header-bar v-model="filters"/>
    <div class="flex">
        <tokens v-model="token" :filters="filters" :network="network" @showAccounts="(val)=>showAccounts=val"/>
      <div id="charts" :class="token?'tokenExist':''">
        <token-bar id="token-bar" v-if="token" :network="network" :token="token" @cancel="token=undefined"/>
        <chart v-if="token" :token="token" id="chart" :key="token.address+token.selectedPairIndex"/>
        <div v-else class="only_desktop">
          <h1>Select token</h1>
        </div>
      </div>
      <accounts :class="{show:showAccounts}" id="accounts" :network="network" :token="token" class="w100" @showAccounts="(val)=>showAccounts=val"/>
    </div>
  </div>
</template>
<script lang="ts">
import Accounts from "@/components/accounts.vue";
import Chart from "@/components/chart.vue";
import Tokens from "@/components/tokens.vue"
import {Network} from "@/classes/models/Network.enum";
import {TokenFound} from "@/classes/models/TokenFound";
import TokenBar from "@/components/token-bar.vue";
import HeaderBar from "@/components/header-bar.vue";

export default {
  components: {HeaderBar, TokenBar, Tokens, Chart, Accounts},
  data() {
    let network: Network = Network.BNB;
    const networks: string[] = Object.keys(Network).map(x => Network[x]);
    let log: string = "log...<br>log...<br>log..."
    let token: TokenFound | undefined = undefined;
    let dexes: string[] = ["PancakeSwap", "UniSwap", "PancakeSwapTestnet"];
    let showAccounts: boolean = false;
    let filters: string = ""
    let dex: string = dexes[0];
    return {
      log,
      network,
      networks,
      token, dexes, dex,
      showAccounts,
      filters
    }
  }
}
</script>
<style lang="scss" scoped>
#tokens{
  padding: 0 0 0 10px;
  min-width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  border: 1px solid #eee;
  @media(min-width: 601px){
    max-width:30%;
    min-width:30%;
  }
}

#charts {
  height: 100%;
  min-width: 40%;
  max-width: 40%;
  padding-left: 10px;
  @media(min-width: 601px) {
    margin-right: 10px;
    position: relative;
  }
  @media(max-width: 600px) {
    margin: 0;
    //padding: 10px;
    min-width: 100%;
    max-width: 100%;
  }
}
#accounts{
  min-width: calc(30% - 20px);
  max-width: calc(30% - 20px);
  @media(max-width: 600px){
    display: none;
    &.show{
      display: block;
      position: absolute;
      left: 0;
      top: 0;
      width: 100vw;
      min-width: 100vw;
      z-index: 5;
      min-height: 100vh!important;
      background: white;
    }
  }
}
@media(max-width: 600px) {
  #charts{
    &.tokenExist {
      position: absolute;
      left: 0;
      top: 0;
      width: 100vw;
      z-index: 5;
      min-height: 100vh!important;
      background: white;
    }
  }
}
</style>
