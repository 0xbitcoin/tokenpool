

import chai from 'chai'
import ganache from 'ganache-cli'
import Web3 from 'web3' 
import fs from 'fs'
export default class TestHelper{

    static async deployContract(web3,  compiledContractJSON ){
        
            let accounts = await web3.eth.getAccounts();

            // Read in the compiled contract code and fetch ABI description and the bytecode as objects
            const compiled = compiledContractJSON // JSON.parse(fs.readFileSync("output/contracts.json"));
            const abi = compiled.abi;
            const bytecode = compiled.bytecode;
        
            // Deploy the contract and send it gas to run.
            let contract = await new web3.eth.Contract(abi)
                .deploy({data:  bytecode, arguments: []})
                .send({from: accounts[0], gas:'5000000'});

            

            return {contract: contract, accounts: accounts};
       


    }


}