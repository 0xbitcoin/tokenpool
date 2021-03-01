<template>
  <div   class="navbar h-nav">
    <div class=" grid  grid-flow-col  ">

      <div
      class="font-sans bg-gray-200 border-2 border-gray-500 cursor-pointer capitalize text-gray-900 text-center p-2 m-2"
      >
       TVL
     </div>

     <div
     class="font-sans bg-gray-200 border-2 border-gray-500 cursor-pointer capitalize text-gray-900 text-center p-2 m-2"
     >
      DCA APY
    </div>

    <div
    class="font-sans bg-gray-200 border-2 border-gray-500 cursor-pointer capitalize text-gray-900 text-center p-2 m-2"
    >
     Fees Earned
   </div>


   <div
   class="font-sans bg-gray-200 border-2 border-gray-500  cursor-pointer capitalize text-gray-900 text-center p-2 m-2"
   >
    Emission Timer
  </div>




    </div>
  </div>
</template>


<script>

export default {
  name: 'StandardMetricsBar',
  props: [ ],
  components: { },
  data() {
    return {
    //  buttonNames: ['home','trading','staking','analytics']
    }
  },
  methods: {

  }
}
</script>
