<template>

<div>



 
        <Navbar />
     

   <div class="section bg-slate  text-white  pb-8">
     <div class="w-container pt-8">

       
 

      <h1 class="title font-primary-title color-primary mb-4">
        Pool Overview
      </h1>
      

      
      <HorizontalNav 
          class="mb-8"
         v-bind:activeSection="activeSection" 
         v-bind:buttonClickedCallback="onHorizontalNavClicked" 
         v-bind:buttonNamesArray="['Status','Mining Data','Recent Transactions','Operations']"
   
       />
        

        <div v-if="poolStatus && activeSection=='Status'" class="overflow-x-auto  mb-4">
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

         

        <div v-if="poolData && activeSection=='Mining Data'"  class="overflow-x-auto mb-4">
            <div class="my-4">
              <div>Minting Account Address: {{poolData.mintingAddress}}</div>
              <div>Minting Network Name: {{poolData.mintingNetwork}}</div>
            </div>
            <div class="my-4">
              <div>Payments Accounts Address: {{poolData.paymentsAddress}}</div>
              <div>Payments Network Name: {{poolData.paymentsNetwork}}</div>
            </div>
            <div class="my-4">
              <div>Last Known Block Number: {{poolData.ethBlockNumber}}</div>
              <div>Minimum User Balance For Payment: {{rawAmountToFormatted(poolData.minBalanceForPayment,8)}}</div>
            </div>
        </div> 

          

         <div v-if="poolData && poolData.miningContract && activeSection=='Mining Data'"  class="overflow-x-auto  mb-4">
           
            <div>Current Challenge Number: {{poolData.miningContract.challengeNumber}}</div>

            <div>Full Mining Difficulty: {{poolData.miningContract.miningDifficulty}}</div> 
        </div> 

          

        <div v-if="activeSection =='Recent Transactions'" class="mb-4">

         <section>
       <TransactionsTable
        class="mb-4"
        label="Recent Solutions" 
        v-bind:transactionsList="recentSolutionTx"
        />
        </section>
        <section>
          <TransactionsTable
            class="mb-4"
            label="Recent Payments"
            v-bind:transactionsList="recentPaymentTx"
          />
        </section>


        </div>

       

 


     </div>


    
   </div>

   

 
    

  <Footer    />

</div>
</template>


<script>
import Navbar from './components/Navbar.vue';
import AppPanel from './components/AppPanel.vue';
import VerticalNav from './components/VerticalNav.vue'
import Footer from './components/Footer.vue';
 

import TransactionsTable from './components/TransactionsTable.vue';
import HashrateChart from './components/HashrateChart.vue';

import HorizontalNav from './components/HorizontalNav.vue';

import SocketHelper from '../js/socket-helper'

import MathHelper from '../js/math-helper'

export default {
  name: 'Accounts',
  props: [],
  components: {Navbar,AppPanel,VerticalNav,Footer,TransactionsTable, HorizontalNav},
  data() {
    return {
      poolData: null,
      poolStatus: null,

      activeSection: 'Status',

       
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
    },

    rawAmountToFormatted(amount, decimals){
      return MathHelper.rawAmountToFormatted(amount,decimals)
    },

    onHorizontalNavClicked(item){
     
      this.activeSection = item


    }

 

  }
}
</script>
