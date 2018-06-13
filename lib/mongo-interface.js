
 var mongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/tokenpool";

module.exports =  {



    async init(   )
    {


        mongoClient.connect(url, function(err, db) {
          if (err) throw err;
          console.log("Mongo database created!");
          db.close();
        });

    },




     getMongoClient()
     {
       return mongoClient;
     },



}
