<template>

<div>



 
        <Navbar />
     

   <div class="section bg-gray-100 autospacing mb-16">
     <div class="w-container pt-8">

       



       
      
            <h1 class="title font-primary-title color-primary">
              Mining Account List
            </h1>
            <h2 class="subtitle">
             Token Mining Pool
            </h2>



             <div class="whitespace-sm"></div>

 



     
     

      <div   class="box  background-secondary" style="overflow-x:auto; min-height:480px;">
        <div class='subtitle'>Miners</div>
        <table class='table table-dark zeroauto'>

          <thead>
            <tr >
              <td> Miner # </td>

              <td> Eth Address </td>
              <td> Hash Rate </td>
              <td> Share % </td>
              <td> Pending Token Balance </td>
              <td> Total Tokens Earned </td>
            </tr>
          </thead>

          <tbody>

            <tr v-for="(item, index) in accountList">
              <td> Miner {{ index }} </td>


                <td>
                      <a v-bind:href='item.profileURL' >
                        <p>  {{ item.minerAddress }}  </p>
                      </a>
                </td>

              <td> {{ item.sharesData.hashRateFormatted }} </td>

              <td>  {{ item.sharesData.sharesPercent}} </td>
              <td>  {{ item.minerData.tokenBalanceFormatted }} </td>
              <td>  {{ item.minerData.tokenRewardsFormatted }} </td>
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
    
  },
  methods: {
     

  }
}
</script>
