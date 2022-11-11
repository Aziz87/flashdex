<template>
  <div id="accounts" class="flex column">
    <div id="label" class="flex" style="height: 50px">
      <div id="back" class="explore noselect btn" @click="$emit('showAccounts',false)">
        <img src="@/assets/close.svg" style="width: 20px">
      </div>
      <div class="flex" id="head" style="align-items: center;">
<!--        <div :id="!modelValue?'btnOpen':'btnClose'" @click="$emit('update:modelValue',!modelValue)" class="btn">-->
<!--          <img v-if="modelValue" src="@/assets/arrow-right.svg" style="width: 30px">-->
<!--          <img v-else src="@/assets/wallet.svg" style="width: 30px">-->
<!--        </div>-->
        <span style="padding-right: 5px;">Addresses</span>
        <label class="switch"><input v-model="showPrivateKeys" type="checkbox"><span class="slider"></span></label>
        <span style="padding-left: 5px;">Private Keys</span>
      </div>
      <input v-if="showPrivateKeys" id="plus" :disabled="!canAddNewPrivateKey" style="margin-bottom: 10px" type="button" value="+"
             @click="addAccount">
    </div>
    <div id="lists">
    <div v-for="(account,i) of accounts" style="margin-top: 2px;">
      <div class="flex" style="align-items: center;" :style="`background:${i%2?'#f5f5f5':'#fff'}`">
        <div style="width: 0; padding-left: 10px;">{{ i + 1 }}</div>
        <input v-if="showPrivateKeys || !account.valid" id="privateKey" v-model="accounts[i].privateKey" autofocus="autofocus"
               :style="`color:${!account.privateKey?'black':account.privateKeyError ?'red':'#376a7f'}`"
               placeholder="0xAb3aA...." type="text" @input="onInputPrivateKey"/>

        <div v-if="showPrivateKeys || !account.valid" id="minus"  @click="deletePrivateKey(i)">
            <trash />
        </div>

        <div v-else style="width: 100%; align-items: center" class="flex">
          <input id="address" style="background: transparent" readonly :value="accounts[i].address" type="text"/>
          <div class="flex" id="balances">
            <div v-for="coin of accounts[i].balances" class="balance">
              {{coin.symbol}}: <span :style="Number(coin.amountString)>0?'font-weight:bold':''">{{coin.amountString}}</span>
            </div>
          </div>
        </div>
      </div>
      <span v-if="account.privateKeyError" style="color: red; margin-left: 30px;">{{ account.privateKeyError }}</span>
    </div>
    </div>
  </div>
</template>
<script lang="ts">
import {Account} from "@/classes/models/Account";
import {getWalletsInfo} from "@/classes/Methods";
import {Network} from "@/classes/models/Network.enum";
import {Coin} from "@/classes/models/Coin";
import Trash from "@/icons/trash.vue";
import {nextTick} from "vue";
import {TokenFound} from "@/classes/models/TokenFound";


export default {
  name: "accounts",
  components: {Trash},
  data() {
    let showPrivateKeys: boolean = false;
    let accounts: Account[] = []
    let contract_address: string = ""
    return {accounts, contract_address, showPrivateKeys}
  },
  props: {
    network: Network,
    token: TokenFound,
    modelValue:Boolean
  },
  methods: {
    addAccount() {
      this.accounts.push(new Account(''))
      nextTick().then(()=>{
        const scrollingElement = document.getElementById("accounts");
        scrollingElement.scrollTop = scrollingElement.scrollHeight;
      })
    },
    chackBalances() {
      const accounts = this.accounts.filter(x=>x.valid);
      const tokens = this.token?.selectedPair?[this.token.address]:[];
      getWalletsInfo(accounts.map(x => x.address), this.network, tokens).then((results: any) => {
        for (let i = 0; i < accounts.length; i++) {
          const balances: Coin[] = [];
          balances.push(new Coin(this.network, results.getEthBalance[i], 18))
          for (let token of tokens) balances.push(new Coin(results.symbol[token][0], results.balanceOf[token][i], results.decimals[token][0]))
          accounts[i].balances = balances;
        }
      })
    },
    onInputPrivateKey() {
      localStorage.setItem("privateKeys", JSON.stringify(this.accounts.map(x => x.privateKey)));
    },
    deletePrivateKey(i) {
      this.accounts.splice(i, 1);
      this.onInputPrivateKey();
    }
  },
  mounted() {
    const privateKeys = JSON.parse(localStorage.getItem("privateKeys") || "[]")
    for (let privateKey of privateKeys) {
      this.accounts.push(new Account(privateKey))
    }
    setInterval(this.chackBalances, 2000);
  },


  computed: {
    canAddNewPrivateKey() {
      for (let account of this.accounts) {
        if (account.privateKeyError) return false;
      }
      return true;
    }
  }
}
</script>
<style lang="scss" scoped>

#accounts{
  border: 1px solid #eee;
}
#lists{
    -ms-overflow-style: none; /* for Internet Explorer, Edge */
    scrollbar-width: none; /* for Firefox */
    overflow-y: scroll;

  padding: 2px;
  &::-webkit-scrollbar {
    display: none; /* for Chrome, Safari, and Opera */
  }
}

#bar {
  background: #e9e1;
  transition: 0.2s all ease-in-out;
  overflow: scroll;
  min-height: calc(100vh - 27px);
  max-height: calc(100vh - 27px);
}

#btnOpen{
  right: 10px;
  position: absolute;
  z-index: 2;
}


@keyframes anim-show {
  0% {
    margin-right: -120%;
    display: block;
  }

  100% {
    margin-right: 0;
  }
}
@keyframes anim-hide {
  0% {
    margin-right: 0;
  }

  100% {
    margin-right: -120%;
    display: none;
  }
}

@media(max-width: 500px) {
  #bar {
    width: 100%;
  }
}

#plus {
  background: #c347f1;

  &[disabled] {
    background: #dddddd;
  }
}

#minus {
  background: #eee;
  height: 30px;
  width: 30px;
  justify-content: center;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 2px 2px -2px -35px;
}

#privateKey{
  background: transparent;
  padding-right: 45px;
}
#address, #privateKey, #balances{
  border: none;
  width: 100%;
  padding-left: 30px;
  font-size: 12px;
}
#balances{
  padding: 0 5px 0 5px;
  justify-content: right;
  width: auto;
}
.balance{
  padding: 2px 2px 2px 0;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}


.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
#label{
  background: #444;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  color: #fff;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #c347f1;
}

input:focus + .slider {
  box-shadow: 0 0 1px #c347f1;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

.btn{
  background: #c347f1; padding: 10px; margin-right: 10px; margin-left: -10px
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}
.slider.round:before {
  border-radius: 50%;
}
</style>
