import {ethers} from "ethers"
import ERC20 from "@/abi/ERC20";
import {Network} from "@/classes/models/Network.enum";
import {TokenFound} from "@/classes/models/TokenFound";
import PancakeFactory from "@/abi/PancakeFactoryV2";
import Web3 from "@/classes/Web3";


const faceFactory = new ethers.utils.Interface(PancakeFactory);



export const topics = {
    OwnnshipTransferred: '0x7a0c4a85198d11d71d004af12bf24d37c7b58af745a7ed06009cea8399775ac6',
    ownarshipTransferred: '0x05342d6ea8345cfc0f563ad2fd98f2be2a36348b3c6635421c72e607830d7ac5',
    OwnershipTransferred: '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0',
    OkwnshipTransferred: '0xd38a9afe7b8d7efbdbbcc1d62b1726eb4f616641473baf7b8574d5bbd2c1a6ef',
    PairCreated: '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9',
    Transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
};

export async function parse(fromBlock: number, toBlock: number|string, topic: string, filters: string[], totalSupply: number, network: Network, priority:number=5): Promise<TokenFound[]> {
    try {
        // console.log("Parse",topic,filters,totalSupply,network)
        const myTopics = [topic];
        if(topic===topics.Transfer) myTopics.push("0x0000000000000000000000000000000000000000000000000000000000000000")
        if(topic===topics.OwnershipTransferred) myTopics.push("0x0000000000000000000000000000000000000000000000000000000000000000")

        let events = await Web3.getLogs(network,{fromBlock, toBlock, topics:myTopics},undefined,undefined,priority);
        // console.log({fromBlock, toBlock,myTopics, events})


        let tokens: TokenFound[] = [];


        if (topic === topics.PairCreated) {
            tokens = events.map((x) => faceFactory.parseLog(x)).map((log, i) => new TokenFound(
                network,
                events[i].blockNumber,
                toBlock - fromBlock <= 5 ? new Date() : undefined,
                [[log.args.token0, log.args.token1]],
                [log.args.pair],
            )).filter((log, i) => !events[i].removed)
        }
        else if(topic===topics.OwnershipTransferred){
            // console.log(events)
            tokens = events.filter(x=>!x.removed).map(x=>new TokenFound(
                network,
                x.blockNumber,
                toBlock - fromBlock <= 5 ? new Date() : undefined,
                [],
                [],
                x.address
                )
            )
        }

        //const addresses: string[] = tokens.map(x => x.address)
        //if (!addresses.length) return [];
        // const items = addresses.map(target => ([
        //     {
        //         target,
        //         method: 'name',
        //         arguments: [],
        //         face
        //     }, {
        //         target,
        //         method: 'symbol',
        //         arguments: [],
        //         face
        //     }, {target, method: 'totalSupply', arguments: [], face}, {
        //         target,
        //         method: 'decimals',
        //         arguments: [],
        //         face
        //     }])).reduce((arra, arrb) => [...arra, ...arrb], [])

        //const params = await Web3.multiCall(items, network);
        // const results: TokenFound[] = [];
        // for (let i = 0; i < addresses.length; i++) {
        //     const addr = addresses[i];
        //     const _name = (params.name && params.name[addr]) ? params.name[addr][0] : '';
        //     const _symbol = (params.symbol && params.symbol[addr]) ? params.symbol[addr][0] : '';
        //     const _decimals = (params.decimals && params.decimals[addr]) ? params.decimals[addr][0] : 1;
        //     const _totalSupply: number = (params.totalSupply && params.totalSupply[addr]) ? Number(ethers.utils.formatUnits(params.totalSupply[addr][0], _decimals)) : 0;
        //     tokens[i].update(_symbol, _name, _totalSupply, _decimals)
        //     const found = _symbol.length && (!filters.length || filters.find(f => (_symbol.toLowerCase().indexOf(f.toLowerCase()) > -1 || _name.toLowerCase().indexOf(f.toLowerCase()) > -1)))
        //     // console.log({_symbol, _decimals, _totalSupply})
        //     if (found) results.push(tokens[i])
        // }
        return tokens;
    } catch (err) {
        console.log("Ups... Token search break")
        return [];
    }
}


