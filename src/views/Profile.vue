<template>

<div>



 
        <Navbar />

   <div class="section bg-slate text-gray-100">
     <div class="w-container pt-8">

       
 
       
      
            <h1 class="title font-primary-title color-primary">
              Mining Account 
            </h1>
            <h2 class="subtitle">
             {{ publicAddress }}
            </h2>



             <div class="whitespace-sm"></div>

              <div v-if="minerData">
                <div> Hashrate Average: {{ minerData.avgHashrate }} </div>
                 <div> Tokens Earned: {{ tokenBalanceFormatted()  }} </div>
                  <div> Tokens Awarded: {{ tokensAwardedFormatted()   }} </div>
              </div>



     
      <div class="whitespace-md"></div>

      <div   class="box  background-secondary" 
         style="overflow-x:auto; min-height:480px;">

        <div class='text-lg font-bold'>Shares</div>
        <table class='table w-full'>

          <thead>
            <tr >
              

               
              <td> Block # </td>
              <td> Difficulty  </td>
              <td> Hashrate Est </td>
              <td> Is Full Solution? </td>
            </tr>
          </thead>

          <tbody>

            <tr v-for="(share, index) in shares">
             
  

              <td> {{ share.block }} </td>

              <td>  {{ share.difficulty }} </td>
              <td>  {{ hashrateToMH( share.hashrateEstimate )  }} MH/s</td>
              <td>  {{ share.isSolution }} </td>
            </tr>


          </tbody>
        </table>

      </div>



<div class="whitespace-md"></div>

      <div   class="box  background-secondary" 
         style="overflow-x:auto; min-height:480px;">

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
              

              <td> {{ tx.block }} </td>

              <td>  {{ tx.amountToPay }} </td>
              <td>  {{ tx.batchedPaymentUuid  }} </td>
              <td>  {{ tx.txHash }} </td>
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

import SocketHelper from '../js/socket-helper'

export default {
  name: 'Profile',
  props: [],
  components: {Navbar,AppPanel,VerticalNav,Footer},
  data() {
    return {
         publicAddress:null,
         minerData:{}, 
         shares: [],
         payment_tx: [] 
    }
  },
  created(){
    this.publicAddress = this.$route.params.publicAddress
  

    this.socketHelper = new SocketHelper()
    
    setInterval(this.pollSockets.bind(this),5000)


    this.socketsListener = this.socketHelper.initSocket()
    
    
    this.socketsListener.on('minerData', (data) => {               
        console.log('got data',data)
       this.minerData = data 
    });

      this.socketsListener.on('minerShares', (data) => {               
        console.log('got shares',data)
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
    }
    
 

  }
}
</script>
