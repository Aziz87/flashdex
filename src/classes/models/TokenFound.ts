import {find, selectCustomToken, list} from "@/classes/models/Tokens";
import {BigNumber, ethers} from "ethers";
import {Network} from "@/classes/models/Network.enum";
import PancakeFactory from "@/abi/PancakeFactoryV2";
import ERC20 from "@/abi/ERC20";
import Web3 from "@/classes/Web3";

export class TokenFound {
    private _date: Date | undefined;
    public _infoLoaded: boolean = false;
    public loadInfoTimestamp:number = 0;
    public accessToStartLoadingInfo(timestamp:number):boolean{
        if(this.loadInfoTimestamp>timestamp-2000) return false;
        this.loadInfoTimestamp = timestamp;
        return true;
    };

    constructor(network: Network, blockNumber: number, date?: Date, pairs?: string[][], pairAddress?: string[], address?: string, totalSupply?: number, symbol?: string, name?: string, decimals?: number) {
        this._network = network;
        this._blockNumber = blockNumber;
        if (pairAddress) this._pairAddress = pairAddress;
        if (pairs) this._pairs = pairs;
        if (address) this._address = address;
        if (pairs && pairs.length) this._address = selectCustomToken(pairs[0]);
        if (date) this._date = date;
        if (totalSupply) this._totalSupply = totalSupply;
        if (symbol) this._symbol = symbol;
        if (name) this._name = name;
        if (decimals) this._decimals = decimals;
    }

    private _address: string;

    public get address() {
        return this._address;
    }

    public get partnerAddress() {
        return !this.pairs.length ? "" : this.pairs[0]===this.address ? this.pairs[1] : this.pairs[0];
    }

    public superTokenAddressByPairIndex(index:number) {
        return this.pairs[index][0]===this.address ? this.pairs[index][1] : this.pairs[index][0];
    }
    public superTokenByPairIndex(index:number) {
        return find(this.pairs[index][0]) || find(this.pairs[index][1])
    }

    private _pairs: string[][];

    public get pairs() {
        return this._pairs;
    }

    public percentReservedOfSupply(pairIndex:number){
        if(!this.decimals || !this.totalSupply)return "...";
        const i = this.pairs[pairIndex].indexOf(this.address);
        const reserved = Number(ethers.utils.formatUnits(this.reserves[pairIndex][i] || 0,this.decimals));
        const percent = (reserved/this.totalSupply*100);
       return percent>100?"∞":(percent.toFixed(2).replace(".00","")+ "%");

    }

    public get selectedPair() {
        if(!this._pairs)return null;
        return this._pairs[this._selectedPairIndex];
    }

    private _pairAddress: string[];

    public get pairAddress() {
        return this._pairAddress;
    }


    public get selectedPairAddress() {
        if(!this._pairs)return null;
        return this._pairAddress[this._selectedPairIndex];
    }

    private _totalSupply: number=0;

    public get totalSupply() {
        return this._totalSupply;
    }


    public get totalSupplyString() {
        const a=[];
        const arr = this._totalSupply.toString().split("");
        for(let i = 0; i<arr.length; i++){
            if(a.length && arr[i]==="0" && a[a.length-1][0]===arr[i])a[a.length-1][1]++;
            else a.push([arr[i],1])
        }
        return a.map(x=>(x[1]>2 && !a.find(b=>b[1]>x[1])) ? `<u>${x[0]}</u><sup>${x[1]}</sup>` : x[1]===1 ? x[0] : Array.from(x[1]).fill(x[0]) ).join("");
    }

    private _symbol: string="";

    public get symbol() {
        return this._symbol;
    }

    private _selectedPairIndex:number=0;
    public selectPair(index:number):TokenFound{
        this._selectedPairIndex = index;
        return this;
    }
    public get selectedPairIndex():number{
        return this._selectedPairIndex;
    }


    private _name: string="";

    public get name() {
        return this._name || "NONAME"
    }

    private _network: Network;

    public get network() {
        return this._network;
    }

    private _blockNumber: number;

    public get blockNumber() {
        return this._blockNumber;
    }

    private _decimals: number;

    public get decimals() {
        return this._decimals;
    }

    private _reserves: BigNumber[][];

    public get reserves() {
        return this._reserves;
    }

    // public get dexIcon() {
    //     if (!this.pairAddress) return "/assets/404.svg"
    //     switch (this.network) {
    //         case Network.BNB:
    //         case Network.BNB_TESTNET:
    //             return "/assets/pancakeSwap.svg";
    //         case Network.ETH:
    //             return "/assets/uniSwap.svg"
    //         default:
    //             return "/assets/404.svg"
    //     }
    // }

    private getReserves(pairs){
        const result: string[][][] = [];
        if (!this.reserves?.length) return result;
        for (let p = 0; p < pairs.length; p++) {
            const pair = pairs[p].map(x=>x.toLowerCase());
            const index = pair.indexOf(this.address.toLowerCase());
            const reserves = this.reserves[p];
            if (!reserves || !reserves[0] || !reserves[1]) continue;
            const tokenReserve = reserves[index];
            const superToken = find(pair[index === 0 ? 1 : 0])
            const partnerReserve = reserves[index === 0 ? 1 : 0];
            if (!superToken) return result;
            if (!partnerReserve) {
                console.log("ERR")
            }

            const reserved = Number(ethers.utils.formatUnits(partnerReserve, superToken.decimals));
            const price = reserved / Number(ethers.utils.formatUnits(tokenReserve, this.decimals)) || 0
            result.push([
                [reserved.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 0
                }), superToken.symbol],
                [price.toLocaleString('en-US', {
                    maximumFractionDigits: 8,
                    minimumFractionDigits: 0
                }), superToken.symbol]
            ])
        }
        return result;
    }

    public get printSelectedReserves(){
        return this.getReserves([this.pairs[this._selectedPairIndex]])
    }

    public get printReserves() {
        const reserves = this.getReserves(this.pairs);
        return reserves;
    }

    public getDateOffset(currentBlock: number) {
        if(!this.blockNumber) return "..."
        // if (!this._date) return `${currentBlock - this.blockNumber} block ago`
        const date = this._date?new Date(new Date() - this._date):null;
        const seconds = date? Math.floor(date.getTime() / 1000) : (currentBlock-this.blockNumber)*3;
        if (seconds < 60) return `${seconds} sec ago`;
        if (seconds < 60 * 60) return `${Math.floor(seconds / 60 )} mins ago`;
        if (seconds < 60 * 60 * 24) return `${Math.floor(seconds / 60 / 60 )} hours ago`;
        if (seconds < 60 * 60 * 24 * 30) return `${Math.floor(seconds / 60 / 60 / 24 )} days ago`;
         return `${Math.floor(seconds / 60 / 60/ 24 / 30)} months ago`;
    }

    public updateInfo(symbol: string, name: string, totalSupply: BigNumber, decimals: number,  reserves: BigNumber[][], pairs: string[][]) {

        if(!this.infoLoaded) {
            if (name) this._name = name;
            if (symbol) this._symbol = symbol;
            if (decimals) this._decimals = decimals;
            if (totalSupply) this._totalSupply = Number(ethers.utils.formatUnits(totalSupply, this._decimals))
            this._infoLoaded = true;
        }
        if(reserves && reserves[0] && reserves[0][0] && reserves[0][0].toString() !=="null") this._reserves = reserves;
        if(pairs && pairs[0] && pairs[0][0] && pairs[0][0].toString() !=="null") this._pairs = pairs;
    }

    public get infoLoaded(){
        return this._infoLoaded;
    }

    public checkFilters(filters: string, onlyPositivePair:boolean=false) {
        if(onlyPositivePair && !this.reserves?.find(x=>x[0]>0))return false;
        if(!this._name && !this._symbol) return false;
        if (!filters.length) return true;
        const lowercaseName = this.name?.toLowerCase();
        const lowercaseSymbol = this.symbol?.toLowerCase();
        return filters.toLowerCase().indexOf(this.address.toLowerCase())>-1 ||
        !!filters.toLowerCase().split(" ").join("").split(",").find(x => (lowercaseName.indexOf(x) > -1 || lowercaseSymbol.indexOf(x) > -1))
    }

    public addPair(pairAddress: string[], pair: string[][]) {
        for(let i=0;i<pairAddress.length;i++){
            if(this._pairAddress.indexOf(pairAddress[i])===-1){
                this._pairAddress.push(pairAddress[i]);
                this._pairs.push(pair[i]);
            }
        }
    }



    public link(address: string) {
        switch (this.network) {
            case Network.BNB:
                return "https://bscscan.com/address/" + address;
            case Network.BNB_TESTNET:
                return "https://testnet.bscscan.com/address/" + address;
            case Network.ETH:
                return "https://etherscan.io/address/" + address;
        }
        return ""
    }

    public async loadInfo() {

        const factorys = {
            eth: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
            bnb: '0xca143ce32fe78f1f7019d7d551a6402fc5350c73',
            bnb_testnet: '0xd2afb7AD306BbDbE5aaCf49aa40121177cC32169',
        }
        const factoryAddress = factorys[this.network];
        const faceFactory = new ethers.utils.Interface(PancakeFactory);
        const face = new ethers.utils.Interface(ERC20);
        const superTokens = list(this.network);
        const maybePairs = superTokens.map(superToken=>[this.address, superToken.address]);
        const items = [
            ...maybePairs.map(pair=>({target:factoryAddress, method:"getPair", arguments:pair, face:faceFactory})),
            {target:this.address, method: 'name', arguments: [], face},
            {target:this.address, method: 'symbol', arguments: [], face},
            {target:this.address, method: 'totalSupply', arguments: [], face},
            {target:this.address, method: 'decimals', arguments: [], face}
        ]
        const results:any = await Web3.multiCall(items,this.network);
        this._decimals = results.decimals[this.address][0] || 0;
        this._name = results.name[this.address][0] || "NONAME";
        this._symbol = results.symbol[this.address][0] || "NOSYMBOL";
        this._totalSupply = Number(ethers.utils.formatUnits((results.totalSupply[this.address][0] || BigNumber.from(0)), this._decimals));
        this._pairs=[];
        this._pairAddress=[];
        console.log(results)
        for(let i=0;i<results.getPair[factoryAddress].length;i++){
            const pairAddress = results.getPair[factoryAddress][i];
            if(pairAddress && pairAddress!=="0x0000000000000000000000000000000000000000"){
                this._pairAddress.push(pairAddress);
                this._pairs.push(maybePairs[i]);
            }
        }
    }
}
