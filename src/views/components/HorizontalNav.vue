<template>
  <div   class="navbar h-nav">
    <div class=" grid grid-flow-col text-gray-900 ">

      <div

      v-for="name in buttonNames"
      @click="onClick(name)"
      class="font-sans bg-gray-200 border-2 border-gray-500 hover:bg-gray-800 hover:text-gray-200 cursor-pointer capitalize  text-center p-2 m-2 inline-block"
      :class="{'bg-green-500': (name == activeSection) , 'text-gray-200': (name == activeSection)}"
      >
       {{name}}
     </div>


    </div>
  </div>
</template>


<script>

export default {
  name: 'HorizontalNav',
  props: ['activeSection','buttonClickedCallback', 'buttonNamesArray'],
  components: { },
  data() {
    return {
      buttonNames: this.buttonNamesArray
    }
  },
  methods: {
    onClick(buttonName){
      this.buttonClickedCallback(buttonName)
    }
  }
}
</script>
