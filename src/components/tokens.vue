<template>
  <div id="tokens">
      <div v-if="!filtredTokens.filter(x=>x.infoLoaded).length" class="flex align-center justify-center w100 h100">
        <div v-if="tokens.length && !tokens.filter(x=>!x.infoLoaded).length">
          NOT FOUND IN LAST {{ tokens.length }} TOKENS
        </div>
        <div v-else class="flex align-center column">
          SCANNING LAST TOKENS
          <loading/>
        </div>
      </div>
    <div v-else class="w100">
      <div class="flex align-center justify-space-between">
        <div class="flex align-center">
          <label><input v-model="skipEmptyTokens" type="checkbox"></label>
          <span>hide empty tokens</span>
        </div>
        <div @click="$emit('showAccounts',true)" class="btn explore only_mobile" style="padding:10px!important; margin-right: 10px">
          <img src="@/assets/wallet.svg" style="width: 30px">
        </div>
      </div>
      <div id="lines">
        <table>
          <thead></thead>
          <tbody>
          <tr v-for="(token,t) of filtredTokens" :id="t%2?'id1':'id2'" :key="t">
            <td id="symbol_td">
              <div class="flex align-center">
                <a :href="token.link(token.address)" class="flex" target="_blank">
                  <!--                <img :src="token.dexIcon" alt="" style="width: 15px; margin-right: 5px">-->
                  <h1 class="link">
                    {{ token.symbol.substr(0, 20) }}{{ token.symbol.length > 20 ? '...' : '' }}
                  </h1>
                  <sup v-html="token.totalSupplyString"/>
                </a>
                <div style="margin-left: auto; font-style: italic; font-size: 10px">
                  <!--                    {{ token.getDateOffset(currentBlock) }}-->
                  {{ currentBlock - token.blockNumber }} blocks ago
                </div>
              </div>
              <div>
                <div v-if="token.reserves?.length">
                  <div v-for="(reserve,r) of token.printReserves" :key="r" style="padding: 0px">
                    <div class="flex w100" style="align-items: center; width: 100%; position: relative">
                      <div class="flex w100">
                        <a :class="reserve[0][1]==='?'?'disabled':''" :href="token.link(token.pairAddress[r])" class="link"
                           target="_blank">
                          <div class="flex" style="align-items: center;  background: #3172E0;color: white; padding: 5px;">
                            <div>{{ reserve[0][0] }} {{ reserve[0][1] }}</div>
                          </div>
                        </a>
                        <div class="noselect" style="align-items: center; background: #e2e2e2; padding: 5px;">
                          {{ token.percentReservedOfSupply(r) }}
                        </div>
                      </div>
                      <div style="margin-left: auto; margin-right: auto"/>
                      <!--                   <a id="pancake"-->
                      <!--                      :href="`https://pancakeswap.finance/swap?outputCurrency=${token?.address}&inputCurrency=${token.superTokenAddressByPairIndex(r)}`"-->
                      <!--                      class="chart btn" style="width: 25px; " target="_blank">-->
                      <!--                     <img src="@/assets/pancakeSwap.svg">-->
                      <!--                   </a>-->
                      <div class="flex">
                        <img class="chart" src="@/assets/chart.svg" @click="$emit('update:modelValue',token.selectPair(r))">
                      </div>
                    </div>
                  </div>
                </div>
                <!--             <div v-if="!token.reserves?.length">-->
                <!--               NO DEX-->
                <!--             </div>-->
              </div>
              <!--            <div v-if="!token.printReserves?.length" class="flex align-center justify-space-between">-->
              <!--              <div></div>-->
              <!--              <div class="flex chart" style="justify-content: center">-->
              <!--                <img src="@/assets/chart.svg" @click="$emit('update:modelValue',token.selectPair(r))">-->
              <!--              </div>-->
              <!--            </div>-->
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!--    <input type="button" id="buy_btn" value="Buy">-->
</template>
<script lang="ts">
import {parse, topics} from "@/classes/TokenSearch"
import getReserves from "@/classes/Reserves"
import {Network} from "@/classes/models/Network.enum";
import {TokenFound} from "@/classes/models/TokenFound";
import {ethers} from "ethers";
import Web3 from "@/classes/Web3";
import Loading from "@/components/ui/loading.vue";
import Logo from "@/components/ui/logo.vue";
import Pulse from "@/components/ui/pulse.vue";

export default {
  components: {Pulse, Logo, Loading},
  data() {
    let tokens: TokenFound[] = [];
    let busy: boolean = false;
    let totalSupply: number = 0;
    let timeoutSearch: number = 0;
    let timeoutReserves: number = 0;
    let toBlock: number = 0;
    let currentBlock: number = 0;
    let maxBlockOffset: number = 3000;
    let offset: number = 3000;
    let skipEmptyTokens:boolean = false;
    return {
      tokens,
      busy,
      totalSupply,
      timeoutSearch,
      timeoutReserves,
      toBlock,
      currentBlock,
      maxBlockOffset,
      offset,
      skipEmptyTokens
    }
  },
  name: "tokens",
  props: {
    filters:String,
    network: Network,
    modelValue: Object,
  },
  beforeUnmount() {
    window.clearTimeout(this.timeoutSearch);
    window.clearTimeout(this.timeoutReserves);
  },
  watch:{
    async filters(n){
      if (this.filters.length === 42 && !this.tokens.find(x => x.address.toLowerCase() === this.filters.toLowerCase())) {
        const address = ethers.utils.getAddress(this.filters);
        if (address) {
          const token = new TokenFound(this.network, 0, undefined, undefined, undefined, address)
          // this.tokens.unshift(token)
          await token.loadInfo();
          this.$emit("update:modelValue",token)
        }
      }
    }
  },
  mounted() {
    this.timeoutSearch = window.setInterval(this.Search, 5000);
    this.timeoutReserves = window.setInterval(this.updateReserves, 3000);
    this.Search()
  },
  computed: {
    filtredTokens() {
      return this.tokens
          .filter(token => token.checkFilters(this.filters, this.skipEmptyTokens))
          .sort((a,b)=>a.blockNumber>b.blockNumber?-1:a.blockNumber<b.blockNumber?1:a.name<b.name?-1:1)
          //.slice(0,100)
    }
  },
  methods: {

    async Search() {
      if (this.busy) return;
      this.busy = true;
      this.currentBlock = await Web3.getBlockNumber(this.network);
      let fromBlock = this.toBlock + 1;
      if (fromBlock < this.currentBlock - this.maxBlockOffset) fromBlock = this.currentBlock - this.maxBlockOffset;
      const toBlock = Math.min(fromBlock + this.offset, Math.max(this.currentBlock, fromBlock + 1));
      if (toBlock < fromBlock) return;
      await this.Parse(fromBlock, toBlock,0);
      if (this.toBlock === 0) {
        await this.updateReserves().then();
        let temp = toBlock;
        for (let i = 1; i < 5; i++) {
            temp-=this.maxBlockOffset+1;
            this.Parse(temp, temp+this.maxBlockOffset, 10).then();
        }
      }
      this.toBlock = toBlock;
      this.busy = false;
    },

    async Parse(fromBlock: number, toBlock: number, priority:number=5) {
      for (let topic of toBlock > this.currentBlock - 5 ? [topics.OwnershipTransferred, topics.PairCreated] : [topics.PairCreated]) {
        let results: TokenFound[] = []
        try {
          results = await parse(fromBlock, toBlock, topic, [], 0, this.network,priority);
        } catch (err) {
          console.log("Error Search", err)
        }
        if (results.length) {
          for (let token of results) {
            const found: TokenFound | undefined = this.tokens.find(x => x.address === token.address);
            if (found) {
              if (token.pairAddress) found.addPair(token.pairAddress, token.pairs);
            } else {
              this.tokens.unshift(token);
            }
          }
          // if(this.filters.length) this.results = this.results.filter(x=>this.filters.toLowerCase().split(",").find(y=>(""+x.symbol?.toLowerCase())?.indexOf(y)>-1))
        }
        if (results.length) this.tokens = this.tokens.sort((a, b) => a.blockNumber > b.blockNumber ? -1 : 1)
      }
    },

    async updateReserves() {
      await getReserves(this.network, this.tokens)
    }
  }
}
</script>
<style lang="scss" scoped>


#tokens {
  width: 100%;
  padding-right: 20px;
}



#bar {
  background: #fff;
}

#row {
  justify-content: space-between;
  align-items: center;
}

#lines{

  padding-right: 10px;
  min-height: calc(100vh - 130px);
  max-height: calc(100vh - 130px);
  overflow-y: scroll;
 width: 100%;
}
table {
  border-spacing: 0 0;
  width:100%;
}

tbody{
  width: 100%;
}


td {
  max-width: 100px;
  overflow: hidden;
  padding: 0 5px;
  border: none;
  border-bottom: 1px solid #E7EAF2;

}

tr {
  &:hover {
    background: #f9f9f9;
  }
}

.tokenFound {
  border: none;
  margin: 1px;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
}

#pairCreated {
  text-transform: uppercase;
  padding: 5px;
  height: 50px;
}


.reserve {
  & div {
    font-size: 12px;
  }

  border: 1px solid #c347f1;
  cursor: pointer;
  transition: 0.1s all ease-in-out;

  &:hover {
    transform: scale(1.05);
  }
}
#id1{
  background: #fff;
}
#id2{
  background: #f5f5f5;
}
.chart {
  cursor: pointer;
  transition: 0.1s all ease-in-out;
  &:hover {
    transform: scale(1.1);
  }
}


</style>
