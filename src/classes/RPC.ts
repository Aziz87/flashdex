import {Network} from "@/classes/models/Network.enum";
import {ethers} from "ethers"

let indexes:any = {

}
const bnb: string[] = [
    "https://rpc.ankr.com/bsc",
    // "https://binance.nodereal.io",
    // "https://bsc-dataseed1.binance.org",
    // "https://bsc-dataseed3.defibit.io",
    // "https://bsc-dataseed1.defibit.io",
    // "https://bsc-dataseed2.binance.org",
    // "https://bsc-dataseed4.binance.org",
    // "https://bsc-dataseed3.binance.org"
];


const bnb_testnet: string[] = [
    "https://data-seed-prebsc-1-s3.binance.org:8545",
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://data-seed-prebsc-1-s2.binance.org:8545",
    "https://data-seed-prebsc-2-s2.binance.org:8545"
];

const eth: string[] = [
    "https://mainnet.infura.io/v3/dfcfe3c781934e68959431903e6c3d1e",
];

const providers={

}
export const getProvider=function (network:Network):ethers.providers.JsonRpcProvider{
    // if(providers[network])return providers[network];
    const provider = new ethers.providers.JsonRpcProvider(getServer(network))
    // providers[network]=provider;
    return provider;
};

const getServer=function (network: Network) {
    indexes[network] = indexes[network] !== undefined ? indexes[network] + 1 : 0
    const servers = {bnb, bnb_testnet, eth}[network];
    if (!servers) {
        console.log("op")
    }
    if (indexes[network] > servers.length - 1) indexes[network] = 0;
    return servers[indexes[network]];
}
