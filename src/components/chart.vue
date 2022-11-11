<template>
  <div class="flex column justify-center" style="position: relative">
    <div v-if="!candles.length" id="not-found" class="w100 h100 flex justify-center align-center">
      <div v-if="!busy">
        <div class="flex column align-center justify-center">
          <div>Wait trades for <b>{{ token.symbol }}</b></div>
          <loading style="margin-top: 20px"/>
        </div>
      </div>
      <div v-if="busy">
        <div class="flex column align-center justify-center">
          <loading style="margin-top: 20px"/>
        </div>
      </div>
    </div>
    <div id="chart-content" v-show="!busy"></div>
  </div>
</template>
<script lang="ts">
import {createChart, CrosshairMode,} from "lightweight-charts";
import Candles, {Candle} from "@/classes/Candles";
import Web3 from "@/classes/Web3";
import {TokenFound} from "@/classes/models/TokenFound";
import {selectSuperTokenSymbol} from "@/classes/models/Tokens";
import Loading from "@/components/ui/loading.vue";
import {nextTick} from "vue";

export default {
  name: "chart",
  components: {Loading},
  props: {
    token: TokenFound
  },
  data() {

    const chartParams = {
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      }
    };

    const params = {
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      priceFormat: {
        type: 'custom',
        minMove: 0.000000000001,
        formatter: price => price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 10
        }) + ` ${selectSuperTokenSymbol(this.token?.selectedPair || [])}`,
      }
    };
    const histogramOptions = {
      color: '#BB52F1',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: .9,
        bottom: 0,
      },
    }

    let candleSeries: any = null;
    let volumeSeries: any = null;
    let percentSeries: any = null;
    let interval: number = 0;
    let fromBlock: number = 0;
    let busy: boolean = true;
    let chart: any;
    let candles: Candle[] = []
    let maxBlockOffset: number = 2000;
    return {
      params,
      histogramOptions,
      chartParams,
      candleSeries,
      volumeSeries,
      percentSeries,
      interval,
      fromBlock,
      busy,
      chart,
      maxBlockOffset,
      candles
    }
  },
  watch:{
    busy(n){
      nextTick().then(()=>this.onResize())
    }
  },
  beforeUnmount() {
    window.clearInterval(this.interval);
  },
  mounted() {
    this.createChart();
    this.fromBlock = this.token.blockNumber;
    // this.getData();

    this.interval = window.setInterval(this.getData, 2000);

    if (!this.token.selectedPairIndex) this.token.selectPair(0);
    window.addEventListener("resize", this.onResize);

    Web3.getBlockNumber(this.token.network).then(async (currentBlock:number)=> {
      for (let toBlock: number = currentBlock; toBlock > Math.max(this.token.blockNumber,currentBlock-this.maxBlockOffset*10); toBlock -= this.maxBlockOffset) {
        Candles.getOHLCV(this.token, currentBlock, toBlock - this.maxBlockOffset, toBlock, 0).then(this.onCandles);
      }
    })
  },

  methods: {
    onResize() {
      const element = document.getElementById("chart-content");
      this.resize(element.clientWidth, element.clientHeight);
    },

    createChart() {
      this.chart = createChart("chart-content", this.chartParams);
      this.candleSeries = this.chart.addCandlestickSeries(this.params);
      this.percentSeries = this.chart.addAreaSeries(this.params);
      this.volumeSeries = this.chart.addHistogramSeries(this.histogramOptions);
    },
    resize(width, height) {
      this.chart.resize(width, height);
    },

    async onCandles(candles:Candle[]){
      console.log(candles)
      try {
      this.candles.push(...candles);
      this.candles.sort((a,b)=>a.time<b.time?-1:1);
      for(let i=0;i<this.candles.length;i++){
        const lastCandle = this.candles[i-1];
        const candle = this.candles[i];
        if(lastCandle) candle.open=lastCandle.close;
      }
        this.candleSeries.setData(this.candles);
        this.volumeSeries.setData(this.candles);
      } catch (err) {
        console.error("Error OHLCV", err.message)
      }

      this.busy = false;
    },

    async getData(){
      const currentBlock = await Web3.getBlockNumber(this.token.network)
      const offset = 5;
      const fromBlock = currentBlock-offset;
      const toBlock = currentBlock;
      const candles = await Candles.getOHLCV(this.token, currentBlock, fromBlock, toBlock,0);
      let lastCandle:Candle = this.candles.sort((a,b)=>a.time>b.time?-1:1)[0]
      this.candles.push(...candles);
      console.log(candles)
      for (let candle of candles) {
        if (lastCandle) {
          if(candle.time<lastCandle.time)continue;
          candle.open = lastCandle.close;
        }
        this.candleSeries.update(candle)
        this.volumeSeries.update(candle)
        lastCandle=candle;
      }
    }

   /* async getData() {
      if (this.busy) return;
      if (!this.token.selectedPair) return;
      this.busy = true;
      const currentBlock = await Web3.getBlockNumber(this.token.network)
      const fromBlock = this.fromBlock || Math.max(this.fromBlock, this.token.blockNumber, currentBlock - this.maxBlockOffset * 10);
      const toBlock = Math.min(currentBlock, fromBlock + this.maxBlockOffset);
      try {
        const candles = await Candles.getOHLCV(this.token, currentBlock, fromBlock, toBlock);
        console.log({candles})
        // if(this.lastCandle) {
        //   let lastTime = this.lastCandle.time;
        //   let time = candles.length ? candles[0].time :  new Date().getTime()/1000-new Date().getTimezoneOffset()*60;
        // while(lastTime+200<time){
        // lastTime+=60
        // candles.push({open:this.lastCandle.close, close:this.lastCandle.close, low:this.lastCandle.close, high:this.lastCandle.close, value:0, time:lastTime})
        // }
        // }
        for (let candle of candles) {
          if (this.lastCandle) candle.open = this.lastCandle.close;
          this.candleSeries.update(candle)
          this.volumeSeries.update(candle)
          this.lastCandle = candle;
        }
      } catch (err) {
        console.error("Error OHLCV", err.message)
        this.busy = false;
        return;
      }
      this.fromBlock = toBlock + 1;
      this.busy = false;
      if (toBlock < currentBlock - 5) this.getData().then();
    }*/

    // on_trades(pair, price, volume, m = 1) {
    //   // console.log(price)
    //   const timestamp = Math.floor(new Date().getTime() / this.interval / 1000 ) * this.interval *1000;
    //   this.chart.updateInfo({
    //     t: timestamp,//trade.T,     // Exchange time (optional)
    //     price,   // Trade priceprice
    //     volume,  // Trade amount
    //     [pair.address]: [ // Update dataset
    //       timestamp,
    //       m,          // Sell or Buy
    //       volume, // parseFloat(trade.q),
    //       price
    //     ],
    //     // ... other onchart/offchart updates
    //   })
  }
}
</script>
<style lang="scss" scoped>
#chart-content, #not-found, #loading {
  width: 100%;
  height: 100%;
  position: absolute;
  min-height: calc(100vh - 130px);
  top: 0;
  margin: 0;
  border: 1px solid #eeeeee;
  @media(max-width: 600px) {
    min-height: 50vh;
  }
}
</style>
