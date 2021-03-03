

const ganache = require('ganache-cli')
const Web3 = require('web3');

export default class TestHelper{

    static async deployContract( compiledContractJSON ){
        
            const provider = ganache.provider();
            provider.setMaxListeners(15);       // Suppress MaxListenersExceededWarning warning
            const web3 = new Web3(provider);
            this.accounts = await web3.eth.getAccounts();
        
            // Read in the compiled contract code and fetch ABI description and the bytecode as objects
            const compiled = compiledContractJSON // JSON.parse(fs.readFileSync("output/contracts.json"));
            const abi = compiled.abi;
            const bytecode = compiled.bytecode;
        
            // Deploy the contract and send it gas to run.
            this.contract = await new web3.eth.Contract(abi)
                .deploy({data:  bytecode, arguments: []})
                .send({from: this.accounts[0], gas:'5000000'});
        
            return this;
       


    }


}