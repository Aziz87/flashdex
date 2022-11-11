import Bottleneck from "bottleneck";
import {getProvider} from "@/classes/RPC";
import {Network} from "@/classes/models/Network.enum";
import {multiCall, MultiCallItem} from "@/classes/Multicall";

const limiter = new Bottleneck({
    maxConcurrent: 2,
    minTime: 200
});


export default {
    async stop(){
      return limiter.stop()
    },
    async getBlockNumber(network:Network):Promise<number>{
        const provider = getProvider(network);
        return await limiter.schedule(() => provider.getBlockNumber());
    },
    async multiCall(items: MultiCallItem[], network:Network, expiration?:number, weight?:number, priority?:number){
        return await limiter.schedule({expiration, weight, priority},() => multiCall(items, network));
    },
    async getLogs(network:Network, filter: any, expiration?:number, weight?:number, priority?:number):Promise<any[]>{
        const provider = getProvider(network);
        return await limiter.schedule({expiration, weight, priority},()=>provider.getLogs(filter))
    }
}
