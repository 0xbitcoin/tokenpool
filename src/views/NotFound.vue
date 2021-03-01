<template>
  <div class="bg-gray-800" >

      <Navbar />



      <div class="lg:flex mb-4">
          File not found!
          <router-link to="/">Go Home</router-link>
      </div>

  <Footer/>

  </div>
</template>


<script>


import Navbar from './components/Navbar.vue';
import DocumentationNav from './components/DocumentationNav.vue';
import Footer from './components/Footer.vue'

export default {
  name: 'NotFound',
  props: [],
  components: {Navbar,DocumentationNav,Footer},
  data() {
    return {

    }
  },
  methods: {

  }
}
</script>
