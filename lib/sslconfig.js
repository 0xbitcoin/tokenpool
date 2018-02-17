

//var lets_encrypt_dir = "/etc/letsencrypt/live/spacewhisper.com/"

var lets_encrypt_dir = "/home/andy/deploy/"


  var ssl =  {

          key: lets_encrypt_dir + 'privkey.pem',
          cert: lets_encrypt_dir + 'cert.pem'

  }


exports.ssl = ssl;
