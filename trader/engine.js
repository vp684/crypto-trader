const internet = require('../helper/checkinternet')
const logger = require('../helper/logger')
const Mongo = require('../database/mongo')
const db = new Mongo()
const sleep = require('../helper/sleep').sleep
const GeminiExchange = require('./exchanges/gemini/gemini_exchange')
const io = require('socket.io-client')


class Engine {
    constructor(){
      
        this.internetout = true
        this.exchanges = []

        this.createExchange = this.createExchange.bind(this);
        this.enginePreCheck = this.enginePreCheck.bind(this)
        this.socket = null
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
                        //restart logic
                        _this.enginePreCheck()
                    }else{
                        _this.internetout = false                       
                        _this.mainCycle()
                    }
                    
                   
                }else{
                    if(!_this.internetout){
                        console.log('INERNET DROPPED OUT - calling engine.stop')
                        //clear markets internet lost need to reset everything
                    }
                    _this.internetout = true       
                                                  
                    console.log('cant reach internet')
                    await sleep(5000).catch(error=>{
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

    async mainCycle(){
        if(this.internetout) return

        for(let ex in this.exchanges){
            //console.log(ex)
        }     
        await sleep(1000)
        this.enginePreCheck() 
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

                //this.setExchangeSocket()

            }else{
                resolve(false)
            }
           
        })
        
    }

    getMarkets(exchange){

        return new Promise((resolve, reject) =>{
            let index = 0 
            let markets = []  
            if(!index){                
                switch(exchange){
                    case 'gemini':                                                                 
                        this.exchanges.forEach(ex => {
                            if(ex.name == exchange){
                                this.exchanges.forEach(element => {
                                    if(element.name === exchange){
                                        markets = element.exchange.getMarkets()
                                    }
                                });
                                
                            }
                        })
                        resolve(markets)
                        break;                                                         
                }
            }else{
                resolve(markets)
            }
        })
    }
   



    setExchangeSocket(socket){
        
        this.exchanges.forEach(ex =>{
            ex.exchange.setSocketToMarkets(socket)

        })        
    }


}




module.exports = Engine