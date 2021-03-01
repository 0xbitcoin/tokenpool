<template>

<div>




   
       <Navbar />



   <div class="section dark   autospacing  ">
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

 <section id="guide" class="box background-primary has-text-centered ">
        <div class='title'> Start Mining 0xBitcoin </div>

        <a href="https://bitbucket.org/LieutenantTofu/cosmic-v3/downloads/COSMiC-v4.1.1-MultiGPU-TMP.zip" target="_blank">
          <div class='button-bubble button-gradient'>Download the Token Miner (Windows)</div>
        </a>
      <div class="whitespace-sm"></div>
        <a href="https://github.com/lwYeo/SoliditySHA3Miner/releases" target="_blank">
          <div class='button-bubble button-gradient'>Download the Token Miner (Linux)</div>
        </a>




        <div class="toggle-mining-instructions acts-as-link color-fun-secondary"> Instructions</div>

        <div class="mining-instructions-container">
            <div class="columns">
            <div class= "column background-secondary color-primary is-half-desktop " style=" margin: 0 auto;">
              <p>Download the mining software</p>
              <hr>
              <p>Set pool URL to 'http://tokenminingpool.com:8080'</p>
              <hr>
              <p>Set address to your ETH address and begin mining!</p>
                <div class="whitespace-sm"></div>
              <a href="https://github.com/0xbitcoin/0xbitcoin-miner/blob/master/RELEASES.md" target="_blank">
                <div class='button-bubble button-gradient'>Links for Other Miners</div>
              </a>
             </div>



           </div>
     </div>

    </section>




    <section class="flex flex-row">
      
        <div>
          
            <HashrateChart 
            
            />
      </div>
      <div>
         
            <div class="card card-background-secondary"  >
              <div class="card-content  ">


                <a v-cloak v-bind:href='poolAPIData.etherscanMintingURL' >
                  <p>Minting: {{poolAPIData.mintingAddress}}</p>
                </a>

                <a v-cloak v-bind:href='poolAPIData.etherscanPaymentURL' >
                  <p>Payments: {{poolAPIData.paymentAddress}}</p>
                </a>



              </div>
          </div>

       </div>

    </section>
     
    <section>
       <TransactionsTable
        label="Recent Solutions"
      />
    </section>
    <section>
       <TransactionsTable
        label="Recent Payments"
      />
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



export default {
  name: 'Home',
  props: [],
  components: {Navbar,HashrateChart,TransactionsTable,VerticalNav,Footer},
  data() {
    return {
      
      poolAPIData: {}, //read this from sockets
      miningAccountSearchQuery: null, 
      web3Plug: null
    }
  },
  created(){
    
  },
  methods: {
    submitMiningAccountSearch( ){  
        this.$router.push('profile/'+this.miningAccountSearchQuery );
    //  console.log('submitMiningAccountSearch ', this.miningAccountSearchQuery)
    },
 


  }
}
</script>
