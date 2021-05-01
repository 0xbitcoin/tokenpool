<template>

<div>



 
        <Navbar />

   <div class="section bg-slate text-gray-100">
     <div class="w-container pt-8">

       
 
       
      
            <div class="text-lg md:text-2xl text-white overflow-x-auto">
              Mining Account 
            </div>

             <div class="text-md md:text-xl text-white overflow-x-auto">
              {{ publicAddress }}
            </div>
             



             <div class="whitespace-sm"></div>

              <div v-if="minerData">
                <div> Hashrate Average: {{ hashrateToMH(minerData.avgHashrate) }} MH/s </div>
                 <div> Tokens Earned: {{ tokenBalanceFormatted()  }} </div>
                  <div> Tokens Awarded: {{ tokensAwardedFormatted()   }} </div>
              </div>



     
      <div class="whitespace-md"></div>

      <div   class="box  background-secondary overflow-x-auto" 
         style=" min-height:480px;">

        <div class='text-lg font-bold'>Shares</div>
        <table class='table w-full'>

          <thead>
            <tr >
              

               
              <td> Block # </td>
              <td> Difficulty  </td>
              <td> Hashrate Est </td>
               
            </tr>
          </thead>

          <tbody>

            <tr v-for="(share, index) in shares">
             
  

              <td class="px-1"> {{ share.block }} </td>

              <td class="px-1">  {{ share.difficulty }} </td>
              <td class="px-1">  {{ hashrateToMH( share.hashrateEstimate )  }} </td>
              
            </tr>


          </tbody>
        </table>

      </div>



<div class="whitespace-md"></div>

      <div   class="box  background-secondary overflow-x-auto" 
         style="  min-height:480px;">

        <div class='text-lg font-bold'>Payouts</div>
        <table class='table w-full'>

          <thead>
            <tr > 
               
              <td> Block # </td>
              <td> Amount  </td>
              <td> BatchedPaymentUUID </td>
              <td> txHash </td>
            </tr>
          </thead>

          <tbody>

            <tr v-for="(tx, index) in payment_tx">
              

              <td class="px-1"> {{ tx.block }} </td>

              <td class="px-1" >  {{ tx.amountToPay }} </td>
              <td class="px-1">  {{ tx.batchedPaymentUuid  }} </td>
              <td class="px-1"> <a v-if="poolData"  v-bind:href="getExplorerBaseURLForPayments() +'tx/' + tx.txHash   " target="_blank">   {{ tx.txHash }} </a>  </td>
            </tr>


          </tbody>
        </table>

      </div>



 


     </div>
   </div>

   


    

  <Footer/>

</div>
</template>


<script>
import Vue from 'vue'

import Navbar from './components/Navbar.vue';
import AppPanel from './components/AppPanel.vue';
import VerticalNav from './components/VerticalNav.vue'
import Footer from './components/Footer.vue';
 
import MathHelper from '../js/math-helper'

import FrontendHelper from '../js/frontend-helper'

import SocketHelper from '../js/socket-helper'

export default {
  name: 'Profile',
  props: [],
  components: {Navbar,AppPanel,VerticalNav,Footer},
  data() {
    return {
         publicAddress:null,
         minerData:{}, 
         poolData: {},
         shares: [],
         payment_tx: [] 
    }
  },
  created(){
    this.publicAddress = this.$route.params.publicAddress
  

    this.socketHelper = new SocketHelper()
    
    setInterval(this.pollSockets.bind(this),5000)


    this.socketsListener = this.socketHelper.initSocket()

    this.socketsListener.on('poolData', (data) => {   
        console.log('got poolData',data)

        this.poolData = data 
    }); 

    
    this.socketsListener.on('minerData', (data) => {               
        console.log('got minerData',data)
       this.minerData = data 
    });

      this.socketsListener.on('minerShares', (data) => {               
        console.log('got minerShares',data)
       this.shares = data 
    });

    this.socketsListener.on('minerPayments', (data) => {               
        console.log('got payments',data)
       this.payment_tx = data 
    });

    this.pollSockets()

  },
  methods: {
    pollSockets(){
      this.socketHelper.emitEvent('getPoolData')
      this.socketHelper.emitEvent( 'getMinerData', {ethMinerAddress: this.publicAddress})
      this.socketHelper.emitEvent( 'getMinerShares', {ethMinerAddress: this.publicAddress})
      this.socketHelper.emitEvent( 'getMinerPayments', {ethMinerAddress: this.publicAddress})
    },


    tokenBalanceFormatted(){
      return  MathHelper.rawAmountToFormatted(this.minerData.alltimeTokenBalance , 8) 

    }, 

    tokensAwardedFormatted(){
      return MathHelper.rawAmountToFormatted( this.minerData.tokensAwarded , 8)

    },
    hashrateToMH(hashrate){
      return MathHelper.rawAmountToFormatted( hashrate , 6 )
    },
    getExplorerBaseURLForPayments(){
      if(!this.poolData) return;
     
      return FrontendHelper.getExplorerBaseURL( this.poolData.paymentsNetwork   )
    }
    
 

  }
}
</script>
