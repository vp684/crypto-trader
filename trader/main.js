const internet = require('../helper/checkinternet')
const logger = require('../helper/logger')
const Mongo = require('../database/mongo')
const db = new Mongo()
const sleep = require('../helper/sleep')
const GeminiExchange = require('./exchanges/gemini/gemini_exchange')

class Engine {
    constructor(){
      
        this.internet = false
        this.exchanges = []

        this.createExchange = this.createExchange.bind(this);
        this.enginePreCheck = this.enginePreCheck.bind(this)

        this.init()
    }

    async init(){
        //connect to database
        
        // db.connectDB().catch( err =>{
        //     console.log(err)
        //     logger.error('db connection error', err)
        // })
       this.start()
    }

    async start(){
        if(this.internetout){
            this.enginePreCheck()
            return
        }
        if(this.abortnow == true){
            this.abortnow = false             
            
            logger.info('server started')
            this.enginePreCheck() // start main engine
            
        }
    }

    

    enginePreCheck(){
        let _this = this
        try{
            internet.checkInternet(async function checkNet(result){
                if(result){
                    if(_this.internetout){
                        _this.internetout = false
                        console.log('INERNET BACK ONLINE - calling engine.start')                        
                    
                    }else{
                        _this.internetout = false
                     
                    }
                    
                   
                }else{
                    if(!_this.internetout){
                        console.log('INERNET DROPPED OUT - calling engine.stop')
                      
                    }
                    _this.internetout = true       
                                                  
                    console.log('cant reach internet')
                    await sleep.sleep(5000).catch(error=>{
                        console.log(error)
                    })                    
                    _this.enginePreCheck()
                }
            })

        }
        catch(e){
            console.log('engine precheck error', e)     
            logger.error('internet error', e)   
            _this.enginePreCheck()
        }

    }


    
    /**
     * 
     * @param {String} name Creates and exchange object for trading.  coinbase, gemini, or binance.
     */
    createExchange(name){
        return new Promise((resolve, reject) => {    
            let index = 0 
            this.exchanges.forEach(ex => {
                if(ex.name == name){
                    index = 1
                }
            })

            if(!index){                
                switch(name){
                    case 'gemini':
                        let gemEx = new GeminiExchange()                                                
                        this.exchanges.push({ name: 'gemini', exchange: gemEx})   
                        resolve(true)
                        break;                                                         
                }
            }else{
                resolve(false)
            }
           
        })
        
    }

    checkInternet(){
        internet.checkInternet((val) =>{ 
            console.log('internet:', val)      
            
            
            this.internet = val
          
        })
    }


}




module.exports = Engine