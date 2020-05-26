var child_process = require('child_process')
var logger = require('../helper/logger')

    // _this.db.collection('ETH-USD').createIndex({ "trade_id": -1 }, { unique: true })
    // _this.db.collection('BTC-USD-transfers').createIndex({"id": -1}, {unique: true})
    // _this.db.createCollection('BTC-USD-lastorders', {capped:true, size:512000000})
    // _this.db.createCollection('ZRX-USD-lastorders', {capped:true, size:512000000})
    // _this.db.collection('BTC-USD-lastorders').createIndex({'trade_id': -1}, {unique:true})



class MongoTools {

    constructor(){
        this.db = null
        this.MongoClient = require('mongodb')
        this.insertManyFills = this.insertManyFills.bind(this)
    };


    /**
     * Conencts to default local database
     */
    connectDB(){
        let _this = this
        return new Promise((resolve, reject) =>{
            try{
                child_process.exec('sudo systemctl start mongod.service', function (error, stdout, stderr) {
                    if (error) {
                        if (error.code == 100) {
                            console.log('already running');
                        }else{
                            logger.error('Database child_process error', error)
                        } 
    
                    }
                    if(stderr){
                        console.log(stderr)
                        logger.error('Database stderr error', error)
                    }    
                    if (error === null) {
                        console.log(stdout);
                        _this.MongoClient.connect('mongodb://localhost:27017', function (err, database) {
               // assert.equal(null, err)
                            if(err){
                                logger.error('Database connction error', err)
                                reject(false)                                
                                return
                            }
                            if(database){                        
                                _this.db = database.db('CryptoData');                            
                               

                                console.log("Connected successfully to MongoDB")
                                resolve(_this)
                            }
                        })
                       
                    }    
                                           
                })

            }catch(e){
                reject(false)
                logger.error('Database catch error', e)
            }
        })

    };

   /**
    * 
    * @param {*} market string - crypto marekt name eg ETHUSD
    * 
    */
    CreateFillsDB(market, exchange){
        let _this = this
        return new Promise((resolve, reject)=>{
            if(_this.db){
                _this.db.collection(market + '-Fills').createIndex({ "trade_id": -1, "exchange": 1 }, { unique: true })         
                resolve(true)
            }else{
                logger.warn('CreateFillsDB promise reject, no db object')
                reject(false)
            }
        })
    }


    /**
     * 
     * @param {*} market string - crypto marekt name eg ETHUSD
     * 
     */
    CreateTransfersDB(market){
        let _this = this
        return new Promise((resolve, reject)=>{
            if(_this.db){            
                _this.db.collection(market + '-Transfers').createIndex({"time": 1, "exchange": 1}, {unique: true})
                resolve(true)
            }else{
                logger.warn('CreateTransfersDB promise reject, no db object')
                reject(false)
            }
        })
    }




    getExchangeSettings(exchg, mrk){
        let _this = this
        return new Promise((resolve, reject) => {
            if(_this.db){
                _this.db.collection('exchange-settings').findOne({exchange: exchg}).then((result, err) =>{
                    let final = null
                    if(err){
                        console.log(err)
                        logger.error('getExchangeSettings', err)
                        resolve(final)
                    }
                    if(result){
                        for(let mark in result){
                           
                            if(mark === mrk){
                                final = result[mark]
                            }
                            
                        }
                        console.log(result)
                        resolve(final)
                    }
                })
            }
        })

    }

    setExchangeSettings(exchg, market, settings){       

        let _this = this
        let options = {
            upsert: true, 
            returnOriginal : false
        }
               
        let update = {
            $set: {
                [market]:settings
            }
        }
        return new Promise((resolve, reject) => {
            if(_this.db){
                _this.db.collection('exchange-settings').findOneAndUpdate({exchange: exchg, }, update, options, (err, result)=>{
                    if(err){
                        console.log(err)
                    }
                    if(result){
                        console.log(result)
                    }
                    resolve(true)
                })
            }
        })

    }

    DisconnectDB(){
        if(this.db){
            this.db.close()
        }
    }

     /**
     * Gets all trades after filled id for market
     * @param {String} market Market to search in
     */
    calcFromFill(market){
        let _this = this
        return new Promise(async (resolve, reject)=>{
            try{

                let flattrade = await _this.getFlatID(market)   
                const collection = _this.db.collection(market + '-Fills')
                collection.find({ trade_id: { $gt: flattrade.trade_id } }).toArray(function (err, result) {
                    
                    if (err) { 
                        logger.error(err)       
                        reject()
                    }
                    if(result){
                        resolve(result)
                    }
                  
                
                })

            }catch(e){
                console.log(e)
                reject(e)
            }
        })

    };

    /**
     * get flat id from file for market
     * @param {String} market 
     */
    getFlatID(market){
        let _this = this
        return new Promise((resolve, reject)=>{
            try{
                let col = market + "-FlatID"
                _this.db.collection(col).find().sort( {$natural: -1}).limit(1).toArray( function (err, result) {                 
                    if (err) { 
                        logger.error('Get_FlatID DB error', err)
                        reject() 
                    }
                    else{
                       // console.log(result[0].flatid)
                        resolve(result[0])
                    }
                }) 

            }catch(e){
                console.log(e)
                logger.error('Get_FlatID error', err)
                reject()
            }
        })
    };

    /**
     * Writes last flat id to file for market
     * @param {Number} lastflatid 
     * @param {String} market 
     */
    Write_FlatID(lastflatid, market){
        let _this = this
        return new Promise((resolve, reject)=>{
            try{
                let col = market + "-flatid"
                  console.log('new flat id', lastflatid)
                let newflatid = {
                    flatid: lastflatid
                }
                console.log('flatid object', newflatid)
                _this.db.collection(col).insertOne(newflatid, function (err, result) {
                     //assert.equal(null, err);
                    //   assert.equal(1, result);
                    console.log(result)
                    if(err){
                        logger.error()
                        console.log('write flat id error', err)
                        return reject()
                    }
                    if(result){ return resolve() }
                    
                })
    
            }catch(e){
                console.log(e)
                reject()
            }
        })
    }

    /**
     * Inserts one fill
     * @param {Object} fill Object conatint fill data
     * @param {String} market Market for object
     */
    InsertLastFill(fill, market){
        let _this = this
        return new Promise((resolve, reject)=> {
            try{
                _this.db.collection(market).insertOne(fill, function (err, result) {
                //assert.equal(null, err);
                //   assert.equal(1, result);
                if(result){ resolve() }
            });
            }catch(e){
                console.log(e)
                reject()
            }
        }) 

    };


    /**
     * 
     * @param {Array} fill Array of fill objects to insert
     * @param {String} market Market for which these fills are being inserted
     */
    insertManyFills(fill, market){
       
        return new Promise((resolve, reject)=>{
            try{
                if(fill !== null && fill.length > 0) {        
                    let options = { ordered: false }                     
                    this.db.collection(market + "-Fills").insertMany(fill, options, function (err, result){         
                        if(err){ 
                            logger.warn("insertManyFills", err)
                            resolve(err.result.nInserted > 0 ? true : false)
                        }               
                        else{ resolve(result.insertedCount > 0 ? true : false) }                        
                    });
                }
            }catch(e){
                console.log(e)
                reject()
            }            
        })
    };  
    

    /**
     * 
     * @param {Array} transfer Array fo transfer objects
     * @param {String} market String for market for which coins were transferred
     */
    insertManyTransfers(market, transfer){
        let _this = this
        return new Promise((resolve, reject)=>{
            try{
                let m = market + "-Transfers"
                let options = { ordered: false };                      
                _this.db.collection(m).insertMany(transfer, options, function (err, result) {                
                    if(err) { 
                        resolve(err.result.nInserted > 0 ? true : false) 
                    }
                    else{ 
                        resolve(result.insertedCount > 0 ? true : false) 
                    }
                });

            }catch(e){
                console.log(e)
                reject()
            }
        })
    };
    
    /**
     * 
     * @param {Object} books object containting book information
     * @param {*} market Market for which this book belongs to
     */
    InsertManyBooks(market, books){
        let _this = this
        return new Promise((resolve, reject)=>{
            try{
                let m = market+"-books"
                let options = { ordered: false };                              

                _this.db.collection(m).insertMany(books, options, function (err, result) {

                    if(err){ reject() }
                    else{ resolve() }
                    
                });

            }catch(e){
                console.log(e)
                reject(e)
            }
        })

    };


    /**
     * 
     * @param {Array} array_trades Array of public market orders to insert to database
     * @param {String} market Market for which these trades belong to
     */
    insertManyPublicTrades(market, array_trades){
        let _this = this
        return new Promise((resolve, reject)=>{
            try{
                var mark = market + '-lastorders'
                var options = { ordered: false }; 
                _this.db.collection(mark).insertMany(array_trades, options, function (err, result){
                    if(err){ 
                        logger.debug('insert many trades error', {'err': err})
                        reject(err) }
                    else{ resolve() }
                })

            }catch(e){
                console.log(e)
                logger.debug('insert many trades catch', {'catcherr': e})
                reject(e)
            }
        })

    };

    
    /**
     * 
     * @param {Number} filledid Last known filled id
     * @param {String} market  Market for this Id
     */
    FindLastFill(market, filledid){
        let _this = this
        return new Promise((resolve, reject)=>{
            try{
                _this.db.collection(market).find({ trade_id: { $gte: filledid } }).toArray(function (err, result) {                 
                    if (err) { reject() }
                    else{ resolve(result) }

                })   
            }catch(e){
                console.log(e)
                reject()
            }
        })

    };

    /**
     * 
     * @param {Number} filledid Filled id to search from
     * @param {String} token Token to search for
     * @param {Int} time optional date object or timestamp in ms to search after
     */
    getTransfers(token, _exchange, time = 0){
        let _this = this
        return new Promise((resolve, reject)=>{
            try{
                let m = token +"-Transfers"
    

                let xdate = typeof time === 'object' ? time : new Date(time)
                _this.db.collection(m).find({ time: { $gte: xdate }, exchange:  _exchange}).toArray(function (err, result) {
                    if (err) {
                        logger.error('getTransfers error', err)
                        resolve(null)
                    }
                    else{resolve(result)}                                                          
                }) 
             
                               
             
                 
            }catch(e){
                console.log(e)
                reject(null)
            }

        })
    };

   

    /**
     * 
     * @param {*} market market to earch
     * @param {*} side side to earch 'buy' or 'sell'
     * @param {*} count number of records to retreive: 100-1000?
     */
    getLastMarketOrders(market, side, count) { 

        let _this = this
        return new Promise((resolve, reject)=>{
            try{                        
                
                let collec = market + "-lastorders"
                const collection = _this.db.collection(collec)
                collection.find({ side: { side } }).sort({ $natural: -1 }).limit(count).toArray(function (err, result) {
                    
                    if (result) {
                        let newdata = []
                        result.forEach((element)=>{
                            let el ={  
                                'price':  element.price,
                                'product_id': element.product_id,
                                 'side': element.side,
                                 'size': element.size,                         
                                 'time': element.time,                 
                            }
                            newdata.push(el)
                        })
                        resolve(newdata)
                    }
                    else{
                        reject(false)
                    }                  
                
                })

            }catch(e){
                console.log(e)
                reject(false)
            }
        })

    }


    getProfitTrades(market, daysago) { 
        let _this = this
        let tempdays = daysago || 30 // defaults to 30 days
        
        let finaldays = tempdays * 24 * 60 * 60 * 1000// milliseoncds in a day 86,400,000
        let days = new Date(Date.now() -  finaldays)

        // Convert date object to hex seconds since Unix epoch
        var hexSeconds = Math.floor(days / 1000).toString(16);      
        // Create an ObjectId with that hex timestamp
        var constructedObjectId =  this.MongoClient.ObjectId(hexSeconds + "0000000000000000");
        
        return new Promise((resolve, reject) => { 
            let collec = market + "-flatid"
            const collection = _this.db.collection(collec)
            collection.find({ _id: {$gt: constructedObjectId}}).toArray(function (err, result) {
                
                if (result) {
                    
                    resolve(result)
                }
                else {
                   
                    reject(err)
                }                  
            
            })

        })

    }

}

module.exports = MongoTools