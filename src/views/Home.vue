<template>

<div>




   
       <Navbar />



   <div class="section bg-slate   autospacing  ">
     <div class=" w-container pt-8">





       <section class="hero circuit-overlay  text-center ">
          <div class="flex flex-col lg:w-1/2" style="margin:0 auto">

          <div class=" text-center  "  >
            <span class="title font-roboto text-white font-bold text-4xl">
                Token Mining Pool
            </span>
            </div>

            <div  v-if="false"  class="loading-animation">
                <div class="loader"></div>
            </div> 

                <p class="text-white font-bold">Mining URL: http://tokenminingpool.com:8080 </p>

                <div class="whitespace-md"></div>

                <div class="account-search-container ">
                  <div class="field">
                    <div class="label text-white font-bold">View Mining Account</div>
                    <div class="control">
                      <form v-on:submit.prevent="submitMiningAccountSearch">
   

                       <input v-model="miningAccountSearchQuery" class="input dark-input  " type="text" placeholder="0x...">
                      </form>
                   
                    </div>
                  </div>
                </div>
            </div>
                <div class="whitespace-lg"></div>
                <br>
 
             <div class="whitespace-lg"></div>
             <div class="whitespace-lg"></div>
          
         
      </section>

 <section id="guide" class="box background-primary text-center ">
        <div class='text-lg text-white'> Start Mining 0xBitcoin </div>

         <div @click="showInstructions=!showInstructions" class="cursor-pointer   select-none bg-gray-800 p-1 mt-1 rounded text-white text-xs inline-block hover:bg-gray-700"> Instructions</div>

          <br>
      
        <div class="  m-2 "  v-if="showInstructions">
             
            <div class= " inline-block bg-gray-800 p-2 text-white">
              <p>Download the mining software</p>
              <hr>
              <p>Set pool URL to 'http://tokenminingpool.com:8080'</p>
              <hr>
              <p>Set address to your ETH address and begin mining!</p>
                
             </div>



            
     </div>
      <div class="whitespace-sm"></div>
        
      

        <a href="https://bitbucket.org/LieutenantTofu/cosmic-v3/downloads/COSMiC-v4.1.1-MultiGPU-TMP.zip" target="_blank">
          <div class='bg-purple-500 p-4 mt-4 rounded text-black inline-block hover:bg-purple-400'>Download the Token Miner (Windows)</div>
        </a>
      <div class=" "></div>
        <a href="https://github.com/lwYeo/SoliditySHA3Miner/releases" target="_blank">
          <div class='bg-purple-500 p-4 mt-4 rounded text-black inline-block  hover:bg-purple-400'>Download the Token Miner (Linux)</div>
        </a>

     <div class="whitespace-sm"></div>
     
        <a href="https://github.com/0xbitcoin/0xbitcoin-miner/blob/master/RELEASES.md" target="_blank">
          <div class='button-bubble button-gradient'>Links for Other Miners</div>
        </a>

     <div class="whitespace-sm"></div>


       

    </section>




    <section class="flex flex-row">
      
        <div class="w-1/2">
          
            <HashrateChart 
            
            />
      </div>
      <div class="w-1/2">
         
            <div class="card card-background-secondary"  >
              <div class="card-content  ">


                
                  <p>Minting:
                     <a v-cloak v-bind:href='poolAPIData.etherscanMintingURL' >
                       {{poolAPIData.mintingAddress}}
                       </a> 
                  </p>
                
                <p>Payments:   
                 <a v-cloak v-bind:href='poolAPIData.etherscanPaymentsURL' >
                  {{poolAPIData.paymentsAddress}}
                </a>
                </p>



              </div>
          </div>

       </div>

    </section>
     
    
  


     </div>
   </div>

    

 



  <Footer/>

</div>
</template>


<script>
import Navbar from './components/Navbar.vue'; 
import VerticalNav from './components/VerticalNav.vue'
import Footer from './components/Footer.vue';

import TransactionsTable from './components/TransactionsTable.vue';
import HashrateChart from './components/HashrateChart.vue';

import SocketHelper from '../js/socket-helper'

export default {
  name: 'Home',
  props: [],
  components: {Navbar,HashrateChart,TransactionsTable,VerticalNav,Footer},
  data() {
    return {
      
      poolAPIData: {}, //read this from sockets
      miningAccountSearchQuery: null, 
      web3Plug: null,
      showInstructions: false,



    }
  },
  created(){
      this.socketHelper = new SocketHelper()
      
      setInterval(this.pollSockets.bind(this),5000)


      this.socketsListener = this.socketHelper.initSocket()
     
     
      this.socketsListener.on('poolData', (data) => {  
             
            this.poolAPIData = data 
        });

         this.socketsListener.on('recentSolutions', (data) => {  
            this.recentSolutionTx=data
        });

         this.socketsListener.on('recentPayments', (data) => {  
            this.recentPaymentTx=data
        });

        this.pollSockets()
  },
  methods: {
    submitMiningAccountSearch( ){  
        this.$router.push('profile/'+this.miningAccountSearchQuery );
    //  console.log('submitMiningAccountSearch ', this.miningAccountSearchQuery)
    },

    pollSockets(){
      this.socketHelper.emitEvent('getPoolData')
      
    }
 


  }
}
</script>
