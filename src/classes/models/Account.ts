import {ethers} from "ethers";
import {Coin} from "@/classes/models/Coin";

export class Account{
    public privateKey:string;
    public balances:Coin[];
    constructor(privateKey:string) {
        this.privateKey = privateKey;
    }
    public get address():string{
        try {
            const wallet = new ethers.Wallet(this.privateKey);
            return wallet.address
        }catch (err){
            return "INCORRECT ADDRESS"
        }
    }
    public get valid():boolean{
        try {
            const wallet = new ethers.Wallet(this.privateKey);
            return true
        }catch (err){
            return false
        }
    }
    public get privateKeyError(): string {
        if (this.privateKey.substr(0, 2) !== "0x") return "Private key must me started with 0x...";
        if (this.privateKey.length !== 66) return `private key length must me 66. Your length is ${this.privateKey.length}`;
        return '';
    }
}
