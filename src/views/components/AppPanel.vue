
<template>
    <div class="bg-gray-800 p-2">

      <div  class="bg-gray-200 flex flex-row p-2 ">
            <h3 class="text-xl font-bold inline text-gray-900 text-center flex-grow"> {{getTitle()}} </h3>





      </div>


 



 



      </div>







      </div>








    </div>
</template>

<script>

const Web3 = require('web3')

var BN = Web3.utils.BN;

import Web3NetButton from './Web3NetButton.vue'

 
 
export default {
  name: 'AppPanel',
  props: ['activeSection','web3Plug'],
  components:{  },
  data() {
    return {
      

      web3Error: null
    }
  },
 async  mounted()
  {
 
  },
  created(){

      
  },
  updated()
  {

     
  },
  methods: {

    



  }
}

</script>
