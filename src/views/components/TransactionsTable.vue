<template>
  <div id="solutiontxlist"  class="box background-secondary transaction-list " style="overflow-x:auto; min-height:480px;">
        <div class='text-xl'>{{label}}</div>


        <table class='table w-full' v-cloak>

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
              <td class="px-1">  {{ item.block  }} </td>
              <td class="px-1">

                <a target="_blank" v-bind:href='item.txURL' >
                 {{ item.txHash  }}
               </a>
               </td>

              <td class="tx-status-cell px-1">  {{ item.status}} </td>
            </tr>

          </tbody>
        </table>

      </div>
</template>


<script>

export default {
  name: 'TransactionsTable',
  props: [ 'transactionsList' , 'label' ],
  components: { },
  data() {
    return { 
    }
  },
  methods: {

  }
}
</script>
