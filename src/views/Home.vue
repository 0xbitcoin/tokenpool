<template>

<div>




   
       <Navbar
       v-bind:web3Plug="web3Plug"


        />



   <div class="section dark   autospacing mb-16">
     <div class="w-container pt-8">

       <div class="grid   md:grid-flow-col   md:grid-cols-6 gap-4">

          

         <div class="col-span-5 py-2 ">

           <AppPanel
             v-bind:activeSection="activeSection"
             v-bind:web3Plug="web3Plug"
            />

         </div>
       </div>


  


     </div>
   </div>

    


   <div class="section dark     ">
      This is another Section 
   </div>



  <Footer/>

</div>
</template>


<script>
import Navbar from './components/Navbar.vue';
import AppPanel from './components/AppPanel.vue';
import VerticalNav from './components/VerticalNav.vue'
import Footer from './components/Footer.vue';

import Web3Plug from '../js/web3-plug.js'



export default {
  name: 'Home',
  props: [],
  components: {Navbar,AppPanel,VerticalNav,Footer},
  data() {
    return {
      activeSection: 'home',
      web3Plug: null
    }
  },
  created(){
    this.web3Plug = new Web3Plug()
  },
  methods: {
    verticalNavButtonClicked(buttonName){
      this.activeSection = buttonName
      console.log('verticalNavButtonClicked ', buttonName)
    },
/*
    web3RefreshCallback(activeAccountAddress,activeNetworkId){
      console.log('web3RefreshCallback',activeAccountAddress,activeNetworkId )

    },
    web3ErrorCallback(errorMessage){
        console.log('web3ErrorCallback', errorMessage)

    },*/


  }
}
</script>
