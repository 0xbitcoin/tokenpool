<template>



        <div class="section bg-gray-900  px-0 lg:px-1 border-b-2 border-gray-500">

     <div class=" ">
     


  <div data-collapse="small" data-animation="default" data-duration="400" class="navbar w-nav">
    <div class="bg-transparent   ">
    <div class="container w-container">
      <div class="w-full  flex ">

        <div class="flex-grow">
          <a href="/" class="brand w-nav-brand w--current">
               <img src="@/assets/images/logo.png" height="55"  alt="" class="w-6 m-2">
            <div class=" inline-block text-xl text-gray-100">Token Mining Pool</div>
         </a>
       </div>

       <div class="hidden lg:inline-block text-gray-100  " style=" ">
         <UpperNav
         v-bind:web3Plug="web3Plug"

         />
       </div>


       <div class="inline-block lg:hidden  pull-right p-4" style=" ">

         <button @click="showResponsiveMenu=!showResponsiveMenu" class="flex items-right px-3 py-2 border rounded text-gray-900 border-teal-400 hover:text-white hover:border-white">
          <svg class="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
        </button>

        <div  class="w-full absolute left-0 block flex-grow lg:flex lg:items-center lg:w-auto bg-gray-500" style="top:60px" :class="{'hidden': !showResponsiveMenu }">
          <div class="text-sm lg:flex-grow">
             <AccordionNav
             v-bind:web3Plug="web3Plug"

             />

          </div>

        </div>

       </div>

      </div>

    </div>
    </div>
  </div>
  </div>


   </div>
</template>


<script>

import Web3NetButton from './Web3NetButton.vue'


import UpperNav from './UpperNav.vue';
import AccordionNav from './AccordionNav.vue';

export default {
  name: 'Navbar',
  props: ['web3Plug','web3RefreshCallback','web3ErrorCallback'],
  components: {UpperNav,AccordionNav},
  data() {
    return {

      showResponsiveMenu: false
    }
  },
  methods: {



  }
}
</script>
