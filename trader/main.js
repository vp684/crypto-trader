const internet = require('../helper/checkinternet')
const logger = require('../helper/logger')
const Mongo = require('../database/mongo')
const db = new Mongo()
const sleep = require('../helper/sleep')
const GeminiExchange = require('./exchanges/gemini/gemini_exchange')

class Engine {
    constructor(){
        this.init()
        this.internetout = true
        this.exhanges = []
        
    }

    async init(){
        internet.checkInternet((val) =>{        
            db.connectDB().catch( err =>{
                console.log(err)
                logger.error('db connection error', err)
            })
        })

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
                        _this.start()
                    }else{
                        _this.internetout = false
                        _this.engineCycle() // runs engine logic once
                    }
                    
                   
                }else{
                    if(!_this.internetout){
                        console.log('INERNET DROPPED OUT - calling engine.stop')
                        _this.stop() 
                    }
                    _this.internetout = true       
                                                  
                    console.log('cant reach internet')
                    await sleep.sleep(2000).catch(error=>{
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
     * Main loop to run after internet check
     * 
     * Gather active exchanges
     * gather active markets per exchange
     * initiate 
     */
    MainLoop(){

    }

    createExchange(name){
        switch(name){
            case 'gemini':
                let gemEx = new GeminiExchange()
                this.exchanges.push(gemEx)                
        }
    }


}




module.exports = Engine