
 var mongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/tokenpool";
var dbo;
module.exports =  {



    async init(   )
    {

      var self = this;


        mongoClient.connect(url, function(err, db) {
          if (err) throw err;
            dbo = db.db("pooldb");

        /*  dbo.createCollection("miners", function(err, res) {
            if (err) throw err;
            console.log("Miners collection created!");
          }); */


          self.insertOne('stats',{'hashrate':1000})

        });





    },


    async insertOne(collectionName,obj)
    {
    //  var myobj = { name: "Company Inc", address: "Highway 37" };
      return new Promise(function(resolve, reject) {
          dbo.collection(collectionName).insertOne(obj, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      });

    },

    async find(collectionName,query,outputFields)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).find(query, outputFields).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    },

     getMongoClient()
     {
       return mongoClient;
     },



}
