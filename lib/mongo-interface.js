
 
 
 
 import Mongodb from 'mongodb'
 
 var mongoClient = Mongodb.MongoClient;



var url = "mongodb://localhost:27017/tokenpool";
var dbo;


export default class MongoInterface  {



    async init( dbName  )
    {

      var self = this;


      if(dbName == null)
      {
        dbName = "pooldb"
      }

      var database = await new Promise(function(resolve, reject) {
            mongoClient.connect(url, { useUnifiedTopology: true }, function(err, db) {
              if (err) throw err;
                dbo = db.db( dbName );

                //test
                //self.insertOne('stats',{'hashrate':1000})
                resolve(dbo)
            });
        });


        await this.createCollectionUniqueIndexes()

    } 

    async createCollectionUniqueIndexes()
    {
      await this.createIndexOnCollection('miner_shares', 'minerEthAddress') 
      await this.createIndexOnCollection('minerData', 'minerEthAddress') 
      await this.createIndexOnCollection('balance_payments', 'minerEthAddress') 
      await this.createDualIndexOnCollection('balance_payments', 'batchId', 'txHash')  
      
      

      //await this.createDualIndexOnCollection('event_data', 'contractAddress', 'startBlock')
      //await this.createUniqueDualIndexOnCollection('event_list', 'transactionHash', 'logIndex')

       

    }







    async createIndexOnCollection(collectionName, indexColumnName)
    {
      dbo.collection(collectionName).createIndex( { [`${indexColumnName}`]: 1 }, { unique: false } )
    }

    async createUniqueIndexOnCollection(collectionName, indexColumnName)
    {
      dbo.collection(collectionName).createIndex( { [`${indexColumnName}`]: 1 }, { unique: true } )
    }

    async createDualIndexOnCollection(collectionName, indexColumnNameA, indexColumnNameB)
    {
      dbo.collection(collectionName).createIndex( { [`${indexColumnNameA}`]: 1,  [`${indexColumnNameB}`]: 1 }, { unique: false } )
    }

    async createUniqueTripleIndexOnCollection(collectionName, indexColumnNameA, indexColumnNameB, indexColumnNameC)
    {
      dbo.collection(collectionName).createIndex( { [`${indexColumnNameA}`]: 1,  [`${indexColumnNameB}`]: 1 , [`${indexColumnNameC}`]: 1}, { unique: true } )
    }

    async createUniqueDualIndexOnCollection(collectionName, indexColumnNameA, indexColumnNameB)
    {
      dbo.collection(collectionName).createIndex( { [`${indexColumnNameA}`]: 1,  [`${indexColumnNameB}`]: 1 }, { unique: true } )
    }





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

    } 

    async updateOne(collectionName,query,newvalues)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };

      var setvalues = { $set: newvalues }

      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).updateOne(query,setvalues,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    } 

    async updateOneCustom(collectionName,query,customvalues)
    {
     
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).updateOne(query,customvalues,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    } 



    async updateAndFindOne(collectionName,query,newvalues)
     {
       let options= {returnOriginal:false} //give us the new record not the original
       var setvalues = { $set: newvalues }

       return new Promise(function(resolve, reject) {

         dbo.collection(collectionName).findOneAndUpdate(query,setvalues,options,function(err, res) {
            if (err) reject(err);
            resolve(res);
          });


       }.bind(this));

     } 


    async upsertOne(collectionName,query,newvalues)
    {
   

      var setvalues = { $set: newvalues }

      var existing = await this.findOne(collectionName,query)

    
      if( existing )
      {
        return await this.updateOne(collectionName,query,newvalues)
      }else { 
      
        return await this.insertOne(collectionName,newvalues)
      }
 

    } 

    async deleteOne(collectionName,obj)
    {
      return new Promise(function(resolve, reject) {
          dbo.collection(collectionName).deleteOne(obj, function(err, res) {
            if (err) reject(err);
        
            resolve(res);
          });
      });


    } 

    async deleteMany(collectionName,query)
    {
      return new Promise(function(resolve, reject) {
          dbo.collection(collectionName).deleteMany(query, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      });


    } 

    async dropCollection(collectionName)
    {
      return new Promise(function(resolve, reject) {
          dbo.dropCollection(collectionName, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      });


    } 

    async dropDatabase( )
    {
      return new Promise(function(resolve, reject) {
          dbo.dropDatabase(  function(err, res) {
            if (err) reject(err); 
            resolve(res);
          });
      });


    } 

    async findAndDeleteOne(collectionName, query){
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).findOneAndDelete(query,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });
    } 

    async findOne(collectionName,query)
    {
     
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).findOne(query,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    } 

   

    async findAll(collectionName,query,outputFields)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).find(query, outputFields).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    } 


    async findAllSorted(collectionName,query,sortBy)
    {
     
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).find(query).sort(sortBy).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    } 


    async findAllSortedWithLimit(collectionName,query,sortBy,limit)
    {
     //.find().limit( 5 ).sort( { name: 1 } )

     
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).find(query).sort(sortBy).limit(limit).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    } 


     getMongoClient()
     {
       return mongoClient;
     } 



}
