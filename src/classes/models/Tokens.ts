import {Network} from "@/classes/models/Network.enum";

const BEP20 = [
    {symbol: "BUSD", decimals:18, address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'},
    {symbol: "USDT", decimals:18, address: '0x55d398326f99059fF775485246999027B3197955'},
    {symbol: "USDC", decimals:18, address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'},
    {symbol: "WBNB", decimals:18, address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'},
    {symbol: "ETH",  decimals:18, address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8'},
    {symbol: "BTCB", decimals:18, address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'},
    {symbol: "CAKE", decimals:18, address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'}
]

const BEP20_TESTNET = [
    {symbol: "WBNB", decimals:18, address: "0xae13d989dac2f0debff460ac112a837c89baa7cd"},
    {symbol: "USDT", decimals:18, address: "0x7ef95a0fee0dd31b22626fa2e10ee6a223f8a684"},
    {symbol: "ETH", decimals:18, address: "0x8babbb98678facc7342735486c851abd7a0d17ca"},
    {symbol: "BUSD", decimals:18, address: "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7"},
    {symbol: "CAKE", decimals:18, address: "0xF9f93cF501BFaDB6494589Cb4b4C15dE49E85D0e"},
    {symbol: "DOGE", decimals:18, address: "0x4443DA4293db262AA4dDB2bc65006f2e7b2E3cE1"},
    {symbol: "BTCB", decimals:18, address: "0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8"},
]

const ERC20 = [
    {symbol: "WETH", decimals:18, address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"},
    {symbol: "USDT", decimals:6, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7"}
]


export function list(network:Network){
    switch (network){
        case Network.BNB: return BEP20;
        case Network.BNB_TESTNET: return BEP20_TESTNET;
        case Network.ETH: return ERC20;
    }
}
export function selectCustomToken(pair: string[]): string {
    return find(pair[0].toLowerCase()) ? pair[1] : pair[0]
}

export function selectSuperTokenAddress(pair: string[]): string {
    return find(pair[0].toLowerCase()) ? pair[0] : pair[1]
}

export function selectSuperTokenSymbol(pair: string[]): string {
    return (!pair || !pair.length)?'XXX':(find(pair[0].toLowerCase())?.symbol || find(pair[1].toLowerCase())?.symbol || '')
}

export function find(address){
    return !!address && ([...ERC20, ...BEP20, ...BEP20_TESTNET].find(x => x.address?.toLowerCase() === address.toLowerCase()))
}



export const uniswapFactory = ['0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'].map(x => x.toLowerCase());
export const pancakeFactory = ['0xBCfCcbde45cE874adCB698cC183deBcF17952812', '0xca143ce32fe78f1f7019d7d551a6402fc5350c73'].map(x => x.toLowerCase());


