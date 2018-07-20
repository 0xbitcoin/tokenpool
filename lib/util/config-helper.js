



module.exports =  {

  getAccountConfig(pool_env)
  {

    var accountConfig;

    if(pool_env == 'test')
    {
      accountConfig =  require('../../test.account.config').accounts;
    }else if(pool_env == 'staging'){
      accountConfig =  require('../../account.config').accounts;
    }else if(pool_env == 'production'){
      accountConfig =  require('../../account.config').accounts; 
    }

    return accountConfig;
  }

}
