// ========== Пополнение кошельков =================
import {Network} from "@/classes/models/Network.enum";
import {GasPriceEnum} from "@/classes/models/GasPrice.enum";
import {BigNumber, ethers} from "ethers";
import {getProvider} from "@/classes/RPC";
import axios from "axios";
// import {TransactionRequest, TransactionResponse} from "@ethersproject/providers";
import {multiCall, contractAddress, MultiCallItem} from "@/classes/Multicall";
import ERC20Abi from "@/abi/ERC20";
import {Coin} from "@/classes/models/Coin";
import MULTICALL from "@/abi/MULTICALL";
import Web3 from "@/classes/Web3";

export function a(amount:BigNumber, decimals:number=18){
    return Number(Number(ethers.utils.formatUnits(amount || "0",decimals)).toLocaleString())
}

export async function replenishWalletsFromDonor(privateKeyDonor:string, wallets:string[][], bnb:string, network:Network, gasPriceVariant:GasPriceEnum = GasPriceEnum.AUTO) {
    const value = ethers.utils.parseEther(bnb); // BNB
    const provider = getProvider(network);
    let gasPrice:BigNumber = await getGasPrice(network, gasPriceVariant)

    let nonce = -1;
    let gasLimit:BigNumber = BigNumber.from(0);
    for (let wallet of wallets) {
        const provider = getProvider(network);
        const donor: ethers.Wallet = new ethers.Wallet(privateKeyDonor, provider);
        if (nonce < 0) nonce = await donor.getTransactionCount("pending");
        const tx: any = {to: wallet[0], value, nonce, gasPrice}
        if(!gasLimit.gt(0)) gasLimit = await provider.estimateGas(tx);
            tx.gasLimit = gasLimit;
        donor.sendTransaction(tx).then((transaction: any) => console.log(transaction.hash))
        nonce++;
    }
}

// ========== Пополнение кошельков =================
export async function withdrawFromWalletsToDonor(to:string, wallets:string[][], network:Network) {
    const provider = getProvider(network);
    const gasPrice:BigNumber = await provider.getGasPrice();
    for (let w of wallets) {
        const wallet: ethers.Wallet = new ethers.Wallet(w[1], provider);
        let value = await wallet.getBalance();
        value = value.sub(gasPrice.mul(21000))

        if(value.gt(BigNumber.from(0))) {
            const tx: any = {to, value, gasPrice}
            tx.gasLimit = await provider.estimateGas(tx);
            wallet.sendTransaction(tx).then((transaction: any) => console.log(transaction.hash))
        }
    }
}

// =========== Проверка балансов на кошельках ======





export async function getWalletsInfo(addresses:string[],network:Network, additionalTokens:string[]) {
    const tokensParams:MultiCallItem[] = [];
    const face = new ethers.utils.Interface(JSON.stringify(ERC20Abi));
    const faceMulticall = new ethers.utils.Interface(JSON.stringify(MULTICALL));
    const provider = getProvider(network);
    const multicallAddres = contractAddress[network];

    for(let address of addresses) {
        tokensParams.push({target: multicallAddres, arguments: [address], method: "getEthBalance", face:faceMulticall})
        if (additionalTokens.length) {
            for (let token of additionalTokens) {
                tokensParams.push({target: token, arguments: [address], method: "balanceOf", face})
                tokensParams.push({target: token, arguments: [], method: "decimals", face})
                tokensParams.push({target: token, arguments: [], method: "symbol", face})
            }
        }
    }
    const result:any = await Web3.multiCall(tokensParams,network);
    if(result.getEthBalance) result.getEthBalance = result.getEthBalance[multicallAddres]
    return result;

}

export async function xxx(addresses:string[],network:Network, additionalTokens:string[]) {
    const tokensParams:MultiCallItem[] = [];
    const face = new ethers.utils.Interface(JSON.stringify(ERC20Abi));
    const provider = getProvider(network);


    const tokens:any = tokensParams.length ? await Web3.multiCall(tokensParams,network):null
    await Promise.all(addresses.map(x=>{
        const provider = getProvider(network);
        const wallet: ethers.Wallet = new ethers.Wallet(x[1], provider);
        return wallet.getBalance()
    })).then((result)=>{
        const accounts:Account[] = []
        const sums: { symbol_name:string, amount:number }[] = [];
        result.map((balance,i)=> {
            const account:any = {address:addresses[i], coins:a(balance)}
            if(tokens) for(let symbol of Object.keys(tokens.symbol)) {
                account[tokens.symbol[symbol][i]] = a(tokens.balanceOf[symbol][i],tokens.decimals[symbol][i]);
                const symbol_name = tokens.symbol[symbol][i];
                const amount = a(tokens.balanceOf[symbol][i],tokens.decimals[symbol][i]);
                const found = sums.find(x => x.symbol_name === symbol_name);
                if (found) {found.amount += amount;
                } else sums.push({symbol_name, amount})
            }
            accounts.push(account)
        })
    });
}



export async function printGasFee(gasPrice:BigNumber, gasLimit:BigNumber, network:Network){
    try {
        const eth = Number(ethers.utils.formatUnits(gasPrice, 9)) * Number(ethers.utils.formatUnits(gasLimit, 0)) / 1e9;
        const ticker = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${network.toUpperCase()}USDT`);
        const usd = eth * Number(ticker.data.price);
        console.log(`FEE ${eth} ETH ($${usd})`);
    }catch (err){

    }
}



export function checkWalletsSyntax(addressAndPrivate:string[][]){
    const incorrect = addressAndPrivate.find(x => new ethers.Wallet(x[1]).address !== x[0])
    if (incorrect) {
        throw new Error("Incorrect private key "+incorrect.join(" <-- "))
    }
}

export async function getGasPrice(network:Network, gasPriceVariant:GasPriceEnum):Promise<BigNumber>{
    const provider = getProvider(network);
    let gasPrice:BigNumber = await provider.getGasPrice();

    if(network===Network.ETH){
        if(gasPriceVariant===GasPriceEnum.AUTO) throw new Error("In the Ethereum network cannot get gasPrice with auto");
        const ethgasstation = await axios.get("https://ethgasstation.info/api/ethgasAPI.json");
        gasPrice = ethers.utils.parseUnits(ethgasstation.data[gasPriceVariant]+'',9);
        console.log("GasStation gasPrice",ethgasstation.data[gasPriceVariant]);
    }
    if(network===Network.BNB_TESTNET || network ===Network.BNB) {
        if (gasPriceVariant === GasPriceEnum.FASTEST) gasPrice = gasPrice.mul(2)
        if (gasPriceVariant === GasPriceEnum.FAST) gasPrice = gasPrice.mul(3).div(2)
    }

    console.log("gasPrice", ethers.utils.formatUnits(gasPrice, 9))

    return gasPrice;
}
