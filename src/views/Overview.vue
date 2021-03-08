<template>

<div>



 
        <Navbar />
     

   <div class="section bg-slate  text-white">
     <div class="w-container pt-8">

       
 

      <h1 class="title font-primary-title color-primary">
        Pool Overview
      </h1>
      


        <div class="whitespace-sm"></div>

      --  TBD --



     
     

      





 


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
