const GeminiAPI = require('gemini-api').default
require('dotenv').config()
const sleep = require('../../../helper/sleep').sleep
const logger = require('../../../helper/logger')
const api = new GeminiAPI({key: process.env.GEMINI_KEY, secret:  process.env.GEMINI_SECRET})

 

class Gemini_REST{
    constructor(){
        this.publicQue = []
        this.last_public_call = 0
        this.privateQue= []
        this.last_private_call = 0

        //time in ms between calls
        this.public_limit = 1000 // 120 per min no more than 1 per sec
        this.private_limit = 200 // 600 per min no moe than 5 per sec.

        this.publicLimiter()
    }

    async publicLimiter(){
        try{
         
            if(this.publicQue.length > 0){
                let curtime = new Date().getTime()
                for(let i = 0; i < this.publicQue.length; i++){                
                    let newpubtime = this.last_public_call + this.public_delay                    
                    if(curtime > newpubtime){
                        this.last_public_call = curtime
                        this.publicQue[i].func()
                        this.publicQue.splice(i, 1)
                    }
                                        
                }

            }
            await sleep(10) //  time to check between calls that fail to meet min delay  
            this.publicLimiter()       
        }
        catch(e){
           logger.error('Gemini REST public limiter error', e)
            await sleep(10)
            this.publicLimiter() 
        }
      
    }

    async privateLimiter(){
        try{
         
            if(this.privateQue.length > 0){
                let curtime = new Date().getTime()
                for(let i = 0; i < this.privateQue.length; i++){                
                    let newpubtime = this.last_public_call + this.public_delay                    
                    if(curtime > newpubtime){
                        this.last_public_call = curtime
                        this.privateQue[i].func()
                        this.privateQue.splice(i, 1)
                    }
                                        
                }

            }
            await sleep(10) //  time to check between calls that fail to meet min delay  
            this.publicLimiter()       
        }
        catch(e){
           logger.error('Gemini REST public limiter error', e)
            await sleep(10)
            this.publicLimiter() 
        }


    }
}

setTimeout(()=>{
    api.newOrder({
        "symbol": "btcusd", 
        "amount": "0.005", 
        "price": "6915.00",
        "side": "buy"
    })

   // api.getNotionalVolume()

}, 5000)


module.exports = Gemini_REST