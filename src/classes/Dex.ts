import {Network} from "@/classes/models/Network.enum";
import {BigNumber, ethers} from "ethers";
import ERC20Abi from "../abi/ERC20";
import rpcServer from "src/classes/RPC";
import pancakeRouterV2Abi from "../abi/PancakeRouterV2";
import PancakeRouterV2 from "../abi/PancakeRouterV2";
import {GasPriceEnum} from "@/classes/models/GasPrice.enum";
import {TransactionResponse} from "@ethersproject/providers";
import {getWalletsInfo, getGasPrice} from "@/classes/Methods";
import {multiCall, MultiCallItem} from "@/classes/Multicall";
import Web3 from "@/classes/Web3";


const routerAddress = {
    "bnb_testnet":"0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3",
    "eth":"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    "bnb":"0x10ED43C718714eb63d5aA57B78B54704E256024E"
}


export function a(amount:BigNumber, decimals:number=18){
    return Number(ethers.utils.formatUnits(amount,decimals)).toLocaleString()
}

export async function getBalanceSymbolDecimals(wallets:string[][], path:string[], network:Network):Promise<{ balanceOf: any, decimals: any, symbol: any }>{
    const provider = new ethers.providers.JsonRpcProvider(rpcServer(network));
    const face = new ethers.utils.Interface(ERC20Abi);
    const mcBalances:MultiCallItem[] = wallets.map(wallet => ({target:path[0], method:"balanceOf", arguments:[wallet[0]], face}))
    const mcDecimals:MultiCallItem[] = path.map(tokenAddress => ({target:tokenAddress, method:"decimals", arguments:[], face}))
    const mcSymbol:MultiCallItem[] = path.map(tokenAddress => ({target:tokenAddress, method:"symbol", arguments:[], face}))
    const mc = await Web3.multiCall([...mcBalances,...mcDecimals, ...mcSymbol], network);
    const balanceOf = mc.balanceOf[path[0]];
    const decimals = [mc.decimals[path[0]][0],mc.decimals[path[1]][0]];
    const symbol = [mc.symbol[path[0]][0],mc.symbol[path[1]][0]];
    return {balanceOf, decimals, symbol}
}
export async function getSymbolDecimals(wallets:string[][], path:string[], network:Network):Promise<{ decimals: any, symbol: any }>{
    const provider = new ethers.providers.JsonRpcProvider(rpcServer(network));
    const face = new ethers.utils.Interface(ERC20Abi);
    const mcDecimals:MultiCallItem[] = path.map(tokenAddress => ({target:tokenAddress, method:"decimals", arguments:[], face}))
    const mcSymbol:MultiCallItem[] = path.map(tokenAddress => ({target:tokenAddress, method:"symbol", arguments:[], face}))
    const mc = await Web3.multiCall([...mcDecimals, ...mcSymbol], network);
    const decimals = [mc.decimals[path[0]][0],mc.decimals[path[1]][0]];
    const symbol = [mc.symbol[path[0]][0],mc.symbol[path[1]][0]];
    return { decimals, symbol}
}

export async function getAmountsOut(wallets:string[][], path:string[], percentOfBalance:number, balanceOf:BigNumber[], network:Network):Promise<any>{
    const provider = new ethers.providers.JsonRpcProvider(rpcServer(network));
    const faceRouter = new ethers.utils.Interface(PancakeRouterV2);
    const multicallAmoutsInsOuts:MultiCallItem[] = wallets.map((wallet,i) => ({target:routerAddress[network], method:"getAmountsOut", arguments:[balanceOf[i].mul(percentOfBalance).div(100),path], face:faceRouter, key:`wallet${i}`}))
    return await Web3.multiCall(multicallAmoutsInsOuts, network);
}

export async function sell (wallets:string[][], path:string[], network: Network, percentOfBalance:number = 100, slippage:number = 50, speed:GasPriceEnum=GasPriceEnum.AUTO){

    const gasPrice:BigNumber = await getGasPrice(network,speed);
    const {balanceOf, decimals, symbol} = await getBalanceSymbolDecimals(wallets, path, network);
    const amountsOut = await getAmountsOut(wallets, path, percentOfBalance, balanceOf, network);
    await Promise.all(wallets.map((wallet,i)=>_sell(
        wallet,
        network,
        amountsOut["wallet"+i] ? amountsOut["wallet"+i].amounts[0]:BigNumber.from(0),
        amountsOut["wallet"+i] ? amountsOut["wallet"+i].amounts[1].sub(amountsOut["wallet"+i].amounts[1].mul(slippage).div(100)):BigNumber.from(0),
        slippage,
        path,
        decimals,
        symbol,
        percentOfBalance,
        gasPrice
    )))
}

async function _sell(wallet:string[], network:Network, amountIn:BigNumber,amountOut:BigNumber,slippage:number,path:string[],decimals:number[], symbol:string[],percentOfBalance:number,gasPrice:BigNumber){

    if(amountIn.gt(0)) {
            const provider = new ethers.providers.JsonRpcProvider(rpcServer(network));
            const signer: ethers.Wallet = new ethers.Wallet(wallet[1], provider);
            const tokenFrom = new ethers.Contract(path[0], ERC20Abi, signer);
            const allowance: BigNumber = await tokenFrom.allowance(wallet[0], routerAddress[network]);
            if (allowance.lt(amountIn)) {
                console.log(wallet[0], "approve", {allowance:a(allowance, decimals[0]), needAlowance:a(amountIn, decimals[0])})
                const approveTx: TransactionResponse = await tokenFrom.approve(routerAddress[network], ethers.constants.MaxUint256);
                await approveTx.wait()
            }
            const router = new ethers.Contract(routerAddress[network], pancakeRouterV2Abi, provider);
            console.log(wallet[0], "sell...", `x${symbol[0]}`,`-${a(amountIn, decimals[0])}`,`x${symbol[1]}`,`+${a(amountOut, decimals[1])}`,`${percentOfBalance} %`,`${a(gasPrice, 9)}`)
        try {
            const gasLimit: BigNumber = await router.connect(signer).estimateGas.swapExactTokensForETH(amountIn, amountOut, path, wallet[0], 2767001972, {gasPrice});
            const response: TransactionResponse = await router.connect(signer).swapExactTokensForETH(amountIn, amountOut, path, wallet[0], 2767001972, {
                gasPrice,
                gasLimit
            });
            console.log(wallet[0], "SOLD", {})
            await response.wait();
            console.log(wallet[0], "SOLD ✔", {})
            // response.hash
        }catch(err:any) {
            console.log(wallet[0], "ERROR", {error: err.code || err.message})
            // console.error("Ошибка при продаже на кошельке", wallet[0], err.code || err.message)
            // console.log({amountIn, amountOut, path, wallet:wallet[0], gasPrice})
        }
    }
}


export async function buy (wallets:string[][], path:string[], network:Network, bnb:number, slippage:number, minTokens:number, maxTokens:number, speed:GasPriceEnum):Promise<void> {
    const provider = new ethers.providers.JsonRpcProvider(rpcServer(network));
    const router = new ethers.Contract(routerAddress[network], pancakeRouterV2Abi, provider);
    if(maxTokens>0) minTokens = Math.min(minTokens, maxTokens);
    let value = ethers.utils.parseEther(bnb.toString())
    if (!path[1] || path[1].length !== 42) {
        wallets.map(wallet=>console.log(wallet[0],"CHECKING", {error:"INCORRECT TOKEN ADDRESS "+path[1]}))
        return;
    }
    const {decimals, symbol} = await getSymbolDecimals(wallets, path, network);
    const minAmountOut:BigNumber = ethers.utils.parseUnits(minTokens.toString(), decimals[1]);
    const maxAmountOut:BigNumber = ethers.utils.parseUnits(maxTokens.toString(), decimals[1]);
    let amountsInOut:BigNumber[] = maxTokens === 0
        ? await router.getAmountsOut(value, path)
        : await router.getAmountsIn(maxAmountOut, path)
    if (amountsInOut[0].gt(value)) {
        if(maxTokens>0) return buy(wallets, path, network, bnb, slippage, minTokens,0, speed);
        else {
            const error = `You have maximal ${a(value)} ${symbol[0]}, but this price ${a(amountsInOut[0])} ${symbol[0]} min`
            wallets.map(wallet=>console.log(wallet[0], "error", {error}));
            throw new Error()
        }
    }
    if (amountsInOut[1].lt(minAmountOut)) throw new Error(`You need minimal ${minTokens.toFixed(5)} tokens, but this price for ${Number(ethers.utils.formatUnits(amountsInOut[1],decimals[1])).toFixed(5)} tokens max`)
    value = amountsInOut[0];
    const method:string = maxTokens>0 ? 'swapETHForExactTokens' : 'swapExactETHForTokens';
    if(method=="swapETHForExactTokens") value = ethers.utils.parseEther(bnb.toString());
    const gasPrice:BigNumber = await getGasPrice(network,speed);
    await Promise.all(wallets.map(wallet=>_swap(network,wallet,method,value,amountsInOut,decimals,path,symbol,gasPrice, slippage)))
}


async function _swap(network:Network, wallet:string[], method:string, value:BigNumber, amountsInOut:BigNumber[], decimals:number[], path:string[], symbol:string[], gasPrice:BigNumber, slippage:number){
    try {
        const provider = new ethers.providers.JsonRpcProvider(rpcServer(network));
        const router = new ethers.Contract(routerAddress[network], pancakeRouterV2Abi, provider);
        const signer: ethers.Wallet = new ethers.Wallet(wallet[1], provider);
        console.log(wallet[0], "buy...", `x${symbol[0]}`,`-${a(amountsInOut[0])}`, `x${symbol[1]}`,`+${a(amountsInOut[1], decimals[1])}`, `${a(gasPrice, 9)}`)



        let amountIn = amountsInOut[0];
        let amountOut = amountsInOut[1];


        if(method=="swapExactETHForTokens") amountOut = amountOut.sub(amountOut.mul(slippage).div(100));
        if(method=="swapETHForExactTokens") value = amountIn.add(amountIn.mul(slippage).div(100));




        let amo = Number(ethers.utils.formatUnits(amountOut,decimals[1]));
        amo = Math.floor(amo * 1e5)/1e5;
        amountOut = ethers.utils.parseUnits(amo+'', decimals[1]);
        const gasLimit: BigNumber = await router.connect(signer).estimateGas[method](amountOut, path, wallet[0], 2767001972, {
            value,
            gasPrice
        });


        const response: TransactionResponse = await router.connect(signer)[method](amountOut, path, wallet[0], 2767001972, {
            value,
            gasLimit
        })
        console.log(wallet[0], "BOUGHT",{})
        await response.wait();
        console.log(wallet[0], "BOUGHT ✓",{})
        //buy_hash:response.hash
    }catch(err:any) {
        console.log(wallet[0], "SWAP ERROR", {error:  err.code || err.message})
    }

}



export async function buyAndSellDex(wallets:string[][], net:Network, tokenA:string, tokenB:string, maxBnb:number, minTokens:number, maxTokens:number, sells:{whenSecondsLeftAfterBuy:number, sellAmountPercent:number}[]):Promise<void>{

    getWalletsInfo(wallets.map(x=>x[0]), net,[]).then()

    try{
        await buy(wallets, [tokenA,tokenB], net, maxBnb,50,minTokens, maxTokens, GasPriceEnum.AUTO )
    }catch (err){
        console.error("Ошибка покупки... Возможно пара не существует",err);
        await new Promise((resolve)=>{setTimeout(resolve,5000)})
        return buyAndSellDex(wallets, net, tokenA, tokenB, maxBnb, minTokens, maxTokens, sells).then();
    }

    let i=0;
    for(let time of sells) {
        console.log(`Wait ${time.whenSecondsLeftAfterBuy} seconds for sell ${time.sellAmountPercent}%`)
        await new Promise((resolve)=>{setTimeout(resolve,time.whenSecondsLeftAfterBuy*1000)})
        await sell(wallets, [tokenB, tokenA], net, time.sellAmountPercent, 50)
        getWalletsInfo(wallets.map(x=>x[0]),net,[tokenB])

    }
}

/*export async function swapETHForExactTokens(wallets:string[][],path: string[], amount: string, bnb:string, network:Network) {
    const value = ethers.utils.parseEther(bnb)
    const token = path[1];
    const contract = new ethers.Contract(token, ERC20Abi, new ethers.providers.JsonRpcProvider(rpcServer(network)))
    if (!token || token.length !== 42) console.log("INCORRECT TOKEN ADDRESS")
    else contract.decimals().then(async (decimals: number) => {
        for (let w of wallets) {
            const provider = new ethers.providers.JsonRpcProvider(rpcServer(network));
            const wallet: ethers.Wallet = new ethers.Wallet(w[1], provider);
            const router = new ethers.Contract(routerAddress[network], pancakeRouterV2Abi, wallet);
            const amountOut = ethers.utils.parseUnits(amount, decimals);
            const gasPrice:BigNumber = await getGasPrice(network,GasPriceVariant.FASTEST);
            (()=>{
                const _w = wallet;
                router.connect(wallet).estimateGas.swapETHForExactTokens(amountOut, path, w[0], 2767001972, {value, gasPrice}).then((gasLimit:BigNumber)=> {
                    console.log("gasLimit",Number(ethers.utils.formatUnits(gasLimit,0).toLocaleString()));
                    printGasFee(gasPrice, gasLimit, network)
                    router.connect(wallet).swapETHForExactTokens(amountOut, path, w[0], 2767001972, {value}).then((response: TransactionResponse) => {
                        console.log(_w.address,
                            ethers.utils.formatUnits(amountOut, decimals)+" Token",
                            ethers.utils.formatEther(value)+" "+network,
                            response.hash);
                    })
                });
            })();
            //27.71*46109/1e9
        }
    })
}*/
