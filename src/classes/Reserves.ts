import {TokenFound} from "@/classes/models/TokenFound";
import {BigNumber, ethers} from "ethers";
import PancakePair from "@/abi/PancakePair";
import {Network} from "@/classes/models/Network.enum";
import Web3 from "@/classes/Web3";
import ERC20 from "@/abi/ERC20";
import {MultiCallItem} from "@/classes/Multicall";




export default async function getReserves(network:Network, _tokens:TokenFound[]){
    const pairFace = new ethers.utils.Interface(PancakePair);
    const erc20Face = new ethers.utils.Interface(ERC20);
    let items:MultiCallItem[] = [];
    const timestamp = new Date().getTime();
    let tokens = _tokens
        .filter(token=>(token.accessToStartLoadingInfo(timestamp)))
        .sort((a,b)=>a.loadInfoTimestamp>b.loadInfoTimestamp?1:-1)

    const usedTokens:TokenFound[]=[]
    for(let token of tokens){
        token.loadInfoTimestamp = timestamp;
            for (let target of token.pairAddress) {
                items.push(
                    {target, method: 'getReserves', arguments: [], face: pairFace},
                    {target, method: 'token0', arguments: [], face: pairFace},
                    {target, method: 'token1', arguments: [], face: pairFace}
                )
            }
        if(!token.infoLoaded) {
            items.push(
                {target: token.address, method: 'name', arguments: [], face: erc20Face},
                {target: token.address, method: 'symbol', arguments: [], face: erc20Face},
                {target: token.address, method: 'totalSupply', arguments: [], face: erc20Face},
                {target: token.address, method: 'decimals', arguments: [], face: erc20Face}
            )
        }
        usedTokens.push(token);
        if(items.length>2000)break;
    }
    if(!items.length)return;
    // items.push({target:})
    tokens=usedTokens;



    let response:any = [];
    try{
        response = (await Web3.multiCall(items, network,undefined,undefined,5))
    }catch (err){
        console.error("Error get Reserves",err.message)
    }


    let _token0:any = response?.token0 || {}
    let _token1:any = response?.token1 || {}
    let _getReserves:any = response?.getReserves || {}
    let _name:any = response.name || {}
    let _symbol:any = response.symbol || {}
    let _totalSupply:any = response.totalSupply || {}
    let _decimals:any = response.decimals || {}

    for(let token of tokens){
        const tokenResultReserves:BigNumber[][]=[]
        const tokenResultPairs:string[][]=[]
        for(let p =0; p<token.pairAddress.length;p++) {
            const pa = token.pairAddress[p];
            const reserve = _getReserves[pa];
            if (reserve) tokenResultReserves.push([reserve._reserve0, reserve._reserve1]); else break;
            if(_token0[pa] && _token1[pa]) tokenResultPairs.push([_token0[pa][0], _token1[pa][0]]); else break;
        }
        const a = token.address;
        const [symbol,name,totalSupply,decimals]=[_symbol[a] || [undefined],_name[a]||[undefined],_totalSupply[a]||[undefined],_decimals[a]||[undefined]]
        token.updateInfo(symbol[0],name[0],totalSupply[0],decimals[0],tokenResultReserves,tokenResultPairs)
    }



}
