<template>

<div>



 
        <Navbar />
     

   <div class="section bg-slate  text-white">
     <div class="w-container pt-8">

       
 

      <h1 class="title font-primary-title color-primary">
        Pool Overview
      </h1>
      


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
      pollSockets(){
      this.socketHelper.emitEvent('getPoolData')
      this.socketHelper.emitEvent('getRecentSolutions')
      this.socketHelper.emitEvent('getRecentPayments')
    }
 

  }
}
</script>
