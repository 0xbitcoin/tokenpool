<template>
  <div id="solutiontxlist"  class="box background-secondary transaction-list " style="overflow-x:auto; min-height:480px;">
        <div class='subtitle'>{{label}}</div>


        <table class='table table-dark zeroauto' v-cloak>

          <thead>
            <tr >
              <td> Block </td>
              <td> TxHash </td>
              <td>   </td>
              <td> Status </td>
            </tr>
          </thead>

          <tbody>

            <tr v-for="(item, index) in transactionsList"  v-bind:class="item.htmlClass">
              <td>  {{ item.block  }} </td>
              <td>

                <a v-bind:href='item.txURL' >
                 {{ item.txHash  }}
               </a>
               </td>

              <td class="tx-status-cell">  {{ item.status}} </td>
            </tr>

          </tbody>
        </table>

      </div>
</template>


<script>

export default {
  name: 'TransactionsTable',
  props: [ 'transactionsList' , 'label'],
  components: { },
  data() {
    return { 
    }
  },
  methods: {

  }
}
</script>
