<template>

<div>



 
       <Navbar />
     

   <div class="section bg-slate   ">
     <div class="w-container pt-8 text-gray-100">

       



       
      
            <h1 class="title text-lg text-gray-100">
              Mining Account List
            </h1>
            <h2 class=" ">
             
            </h2>



             <div class="whitespace-sm"></div>

 



     
     

      <div   class="box  background-secondary overflow-x-auto" style="  min-height:480px;">
        <div class='subtitle'> </div>
        <table class='table w-full'>

          <thead>
            <tr >
              <td class="px-1"> Miner # </td>

              <td class="px-1"> Eth Address </td>
              <td class="px-1"> Hash Rate </td>
             
              
              <td class="px-1"> Total Tokens Earned </td>
              <td class="px-1"> Tokens Awarded </td>
            </tr>
          </thead>

          <tbody>

            <tr v-for="(item, index) in accountList">
              <td class="px-1">  Miner {{ index }} </td>


                <td>
                      <a v-bind:href='"/profile/"+item.minerEthAddress' >
                        <span>  {{ item.minerEthAddress }}  </span>
                      </a>
                </td>

              <td class="px-1"> {{ hashrateToMH(item.avgHashrate) }} </td>

                <td class="px-1"> {{ tokensRawToFormatted( item.alltimeTokenBalance,8) }}    </td>
              <td class="px-1"> {{ tokensRawToFormatted( item.tokensAwarded,8 ) }}   </td>
             
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
import Navbar from './components/Navbar.vue';
import AppPanel from './components/AppPanel.vue';
import VerticalNav from './components/VerticalNav.vue'
import Footer from './components/Footer.vue';
 

import SocketHelper from '../js/socket-helper'
import MathHelper from '../js/math-helper'

import web3utils from 'web3-utils'

export default {
  name: 'Accounts',
  props: [],
  components: {Navbar,AppPanel,VerticalNav,Footer},
  data() {
    return {
       
      accountList: [] 
    }
  },
  created(){
    
     this.socketHelper = new SocketHelper()
    
     setInterval(this.pollSockets.bind(this),5000)


    this.socketsListener = this.socketHelper.initSocket()
    
    
    this.socketsListener.on('minerList', (data) => {               
        console.log('got data',data)
       this.accountList = data 
    });


   //this.accountList = this.accountList.filter(x => web3utils.isAddress( x.minerEthAddress ) )
  

   this.accountList = this.accountList.sort((a,b) => {b.alltimeTokenBalance - a.alltimeTokenBalance})


   this.pollSockets()

  },
  methods: {
      pollSockets(){
       
          this.socketHelper.emitEvent( 'getMinerList')
      },
      hashrateToMH(hashrate){
         return MathHelper.rawAmountToFormatted( hashrate , 6 )
      },
      tokensRawToFormatted(rawAmount, decimals){
          return MathHelper.rawAmountToFormatted( rawAmount , decimals )
      }

  }
}
</script>
