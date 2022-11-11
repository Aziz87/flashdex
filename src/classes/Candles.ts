import {ethers} from "ethers";
import {TokenFound} from "@/classes/models/TokenFound";
import PancakePair from "@/abi/PancakePair";
import {find} from "@/classes/models/Tokens";
import Web3 from "@/classes/Web3";

export class Candle {
  public time:number;
  public value:number;
  public open:number;
  public high:number;
  public low:number;
  public close:number;
}

const getOHLCV = async function (token:TokenFound, currentBlock:number, fromBlock:number, toBlock:number, priority:number=0):Promise<Candle[]>{

  const now = new Date().getTime();
  const filters = {topics:['0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'], address:token.selectedPairAddress, fromBlock, toBlock };
  // console.log("ohlcv",filters)
  const logs = await Web3.getLogs(token.network, filters,undefined,undefined,priority)
  const ohlcv:Candle[] = [];

  const superTokenIs0 = find(token.selectedPair[0]);
  const superTokenIs1 = find(token.selectedPair[1]);
  if(!superTokenIs0 && !superTokenIs1) {
    console.error("Not found superToken")
    return [];
  }
  const decimals:number[] = [token.decimals, superTokenIs0 ? superTokenIs0.decimals : superTokenIs1.decimals]


  let last:any={}
  for(let log of logs){
    // const last = ohlcv.length?ohlcv[ohlcv.length-1]:null;
    const time = Math.floor((now-((currentBlock-log.blockNumber)*3000))/1000) - new Date().getTimezoneOffset()*60;
      const face = new ethers.utils.Interface(PancakePair);
      const {reserve0,reserve1} = face.parseLog(log).args;
      const reserves = [superTokenIs0 ? reserve1 : reserve0, superTokenIs1 ? reserve1 : reserve0]
      const price = Number(ethers.utils.formatUnits(reserves[1], decimals[1])) / Number(ethers.utils.formatUnits(reserves[0], decimals[0]));

    if(!last?.time || time-last.time>=60) {
      last = {time, open:price, high:price, low:price, close:price, value:0}
      ohlcv.push(last)
    }
    else {
      last.high=Math.max(price,last.high);
      last.low=Math.min(price,last.low);
      last.close=price;
      last.value+=Number(ethers.utils.formatUnits(reserves[1], decimals[1]))
    }
  }
  return ohlcv;
};



export default {
    getOHLCV
}
