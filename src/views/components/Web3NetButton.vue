<template>
  <div class="inline-block button text-gray-200  bg-gray-900 hover:bg-gray-700   font-bold py-0 px-1 rounded cursor-pointer">
    <div class="text-green-500 text-xl inline  " style=" text-shadow: 0px 0px 2px #66dd00; ">  ·  </div>{{getNetworkName()}}
  </div>
</template>


<script>

export default {
  name: 'Web3NetButton',
  props: ["providerNetworkID"],
  components: {},
  data() {
    return {
      showResponsiveMenu: false
    }
  },
  methods: {

    getNetworkName(){
      if(this.providerNetworkID == 1){
        return 'Mainnet'
      }
      if(this.providerNetworkID == 42){
        return 'Kovan'
      }
      return 'InvalidNetwork'
    }

  }
}
</script>
