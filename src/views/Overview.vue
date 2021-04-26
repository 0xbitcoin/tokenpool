<template>

<div>



 
        <Navbar />
     

   <div class="section bg-slate  text-white">
     <div class="w-container pt-8">

       
 

      <h1 class="title font-primary-title color-primary">
        Pool Overview
      </h1>
      

      <div class="whitespace-sm"></div>
        

        <div v-if="poolStatus" class="overflow-x-auto">
          <div>Pool Status: {{poolStatus.poolStatus}}</div>
          <div v-if="poolStatus.poolStatus!='active'">Suspension Reason: {{poolStatus.suspensionReason}}</div>



          <div>avgGasPriceGWei: {{poolStatus.poolFeesMetrics.avgGasPriceGWei}}</div>
          <div>Full Mining Reward: {{poolStatus.poolFeesMetrics.miningRewardFormatted}}</div>

          <div>miningRewardInEth: {{poolStatus.poolFeesMetrics.miningRewardInEth}}</div>
          <div>ethRequiredForMint: {{poolStatus.poolFeesMetrics.ethRequiredForMint}}</div>

           <div>poolBaseFeeFactor: {{poolStatus.poolFeesMetrics.poolBaseFee}}</div>
            <div>gasCostFeeFactor: {{poolStatus.poolFeesMetrics.gasCostFee}}</div>

          <div>overallFeeFactor: {{Number.parseFloat(poolStatus.poolFeesMetrics.overallFeeFactor).toFixed(4)  }}</div>

        </div> 

         <div class="whitespace-sm"></div>

        <div v-if="poolData"  class="overflow-x-auto">
            <div>Last Known Block Number: {{poolData.ethBlockNumber}}</div>
            <div>Minting Account Address: {{poolData.mintingAddress}}</div>
            <div>Minting Network Name: {{poolData.mintingNetwork}}</div>

            <div>Payments Accounts Address: {{poolData.paymentsAddress}}</div>
            <div>Payments Network Name: {{poolData.paymentsNetwork}}</div>
            <div>Minimum User Balance For Payment: {{poolData.minBalanceForPayment}}</div>
            
        </div> 

          <div class="whitespace-sm"></div>

         <div v-if="poolData && poolData.miningContract"  class="overflow-x-auto">
           
            <div>Current Challenge Number: {{poolData.miningContract.challengeNumber}}</div>

            <div>Full Mining Difficulty: {{poolData.miningContract.miningDifficulty}}</div> 
        </div> 

          


        <div class="whitespace-sm"></div>
 

         <section>
       <TransactionsTable
        label="Recent Solutions" 
        v-bind:transactionsList="recentSolutionTx"
        />
        </section>
        <section>
          <TransactionsTable
            label="Recent Payments"
            v-bind:transactionsList="recentPaymentTx"
          />
        </section>
      

         <div class="whitespace-sm"></div>





 


     </div>
   </div>

   


    

  <Footer/>

</div>
</template>


<script>
import Navbar from './components/Navbar.vue';
import AppPanel from './components/AppPanel.vue';
import VerticalNav from './components/VerticalNav.vue'
import Footer from './components/Footer.vue';
 

import TransactionsTable from './components/TransactionsTable.vue';
import HashrateChart from './components/HashrateChart.vue';

import SocketHelper from '../js/socket-helper'

export default {
  name: 'Accounts',
  props: [],
  components: {Navbar,AppPanel,VerticalNav,Footer,TransactionsTable},
  data() {
    return {
      poolData: null,
      poolStatus: null,

       
      accountList: [] ,

      recentSolutionTx:[],
      recentPaymentTx:[] 
    }
  },
  created(){
     this.socketHelper = new SocketHelper()
      
      setInterval(this.pollSockets.bind(this),5000)


      this.socketsListener = this.socketHelper.initSocket()
     
     
       this.socketsListener.on('poolData', (data) => {   
            this.poolData = data 
        });

         this.socketsListener.on('poolStatus', (data) => {   
            this.poolStatus = data 
            
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
    pollSockets(){
      this.socketHelper.emitEvent('getPoolData')
      this.socketHelper.emitEvent('getPoolStatus')
      this.socketHelper.emitEvent('getRecentSolutions')
      this.socketHelper.emitEvent('getRecentPayments')
    }
 

  }
}
</script>
