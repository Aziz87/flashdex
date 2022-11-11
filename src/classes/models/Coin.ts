import {BigNumber, ethers} from "ethers";
export class Coin{
    public address:string;
    public symbol:string;
    public balance:BigNumber;
    public decimals:number;


    constructor(symbol:string, balance:BigNumber, decimals:number, address:string="0x0000000000000000000000000000000000000000") {
        this.symbol=symbol.toUpperCase().split("_")[0];
        this.decimals=decimals;
        this.balance=balance;
        this.address=address;
    }

    public get amountString():string{
        return Number(ethers.utils.formatUnits(this.balance, this.decimals)).toFixed(4);
    }
}
