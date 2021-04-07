



export default class MathHelper {

static rawAmountToFormatted(amount,decimals)
{
  return (amount * Math.pow(10,-1 * decimals)).toFixed(decimals);
}

static formattedAmountToRaw(amountFormatted,decimals)
{

  var multiplier = new BigNumber( 10 ).exponentiatedBy( decimals ) ;


  return multiplier.multipliedBy(amountFormatted).toFixed() ;
}

}