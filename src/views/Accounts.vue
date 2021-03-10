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

 



     
     

      <div   class="box  background-secondary" style="overflow-x:auto; min-height:480px;">
        <div class='subtitle'> </div>
        <table class='table w-full'>

          <thead>
            <tr >
              <td> Miner # </td>

              <td> Eth Address </td>
              <td> Hash Rate </td>
             
              
              <td> Total Tokens Earned </td>
              <td> Tokens Awarded </td>
            </tr>
          </thead>

          <tbody>

            <tr v-for="(item, index) in accountList">
              <td> Miner {{ index }} </td>


                <td>
                      <a v-bind:href='"/profile/"+item.minerEthAddress' >
                        <span>  {{ item.minerEthAddress }}  </span>
                      </a>
                </td>

              <td> {{ item.avgHashrate}} </td>

                <td> {{ item.alltimeTokenBalance}}    </td>
              <td> {{ item.tokensAwarded}}   </td>
             
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


   this.pollSockets()

  },
  methods: {
      pollSockets(){
       
          this.socketHelper.emitEvent( 'getMinerList')
      }

  }
}
</script>
