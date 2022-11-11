import MULTICALL_ABI from "@/abi/MULTICALL";
import {ethers} from "ethers";
import {Network} from "@/classes/models/Network.enum";
import {getProvider} from "@/classes/RPC";


export class MultiCallItem {
    key?: string;
    target: string;
    face: ethers.utils.Interface;
    method: string;
    arguments: any[];
}

export const contractAddress: any = {
    "bnb_testnet": "0x3bab6eD264a077Ef54BF9654E43f2F5B6b6A46D7",
    "bnb": "0x87E925f37dfCe7679C318033DcEb0D500514fCeD",
    "eth": "0x9e223239efac780fff9d54241a71d329e6522451"
}


const multiCall = async function (items: MultiCallItem[], network: Network): Promise<any> {
    const provider = getProvider(network);
    const contractMulticall = new ethers.Contract(contractAddress[network], JSON.stringify(MULTICALL_ABI), provider);

    const multicallArgs = items.map(item => ({
        target: item.target,
        callData: item.face.encodeFunctionData(item.method, item.arguments),
        returnData: ''
    }));


    let response = null;
    try {
        response = await contractMulticall.aggregate(multicallArgs).catch((err: any) => {
            console.error('Ups... multicall error...');
        });
    } catch (err: any) {
        console.error('multicall error');
    }

    const result: any = {}
    if (response) for (let i = 0; i < items.length; i++) {
        const method = items[i].method;
        const target = items[i].target;
        const key = items[i].key;
        const face = items[i].face;
        if (!result[method]) result[method] = [];
        let val = null;
        try {
            val = response.returnData[i]==="0x" ? null : face.decodeFunctionResult(items[i].method, response.returnData[i]);
        } catch (err) {
            // console.error(err);
            // console.error("Face Decode error", {target, method, data:response.returnData[i]})//+target+" : "+items[i].method+" "+response,err)
        }


        if (key) {
            result[key] = val;
        } else {
            if (result[method][target]) {
                if (val === null) val = [[null]]

                // @ts-ignore
                if (Array.isArray(result[method][target])) result[method][target] = [...result[method][target], ...val];
                else result[method][target] = [result[method][target], ...val];
            } else {
                result[method][target] = val;
            }
        }

    }
    return result;
}


export {
    multiCall
}
