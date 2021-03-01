<template>
  <div   class=" ">
    
     <div class="card card-background-secondary">
        <div class="card-content">
          <div class='subtitle has-text-centered'>Hashrate</div>
          <div class="media-content">
            <canvas ref="hashchart"></canvas>
          </div>
        </div>
      </div>


  </div>
</template>


<script>

export default {
  name: 'HashrateChart',
  props: [ ],
  components: { },
  data() {
    return {
     
    }
  },
  methods: {

  }
}
</script>
