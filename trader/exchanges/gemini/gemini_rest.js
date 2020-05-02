"use strict";
require('dotenv').config()
const GeminiAPI = require('gemini-api').default
const sleep = require('../../../helper/sleep').sleep
const logger = require('../../../helper/logger')


 

class Gemini_REST{
    constructor(){
        this.publicQue = []
        this.last_public_call = 0
        this.privateQue= []
        this.last_private_call = 0
        this.api = new GeminiAPI({key: process.env.GEMINI_KEY, secret:  process.env.GEMINI_SECRET})
        //time in ms between calls
        this.public_limit = 1000 // 120 per min no more than 1 per sec
        this.private_limit = 200 // 600 per min no moe than 5 per sec.

        this.publicLimiter()
        this.privateLimiter()
    }

    async publicLimiter(){
        try{
         
            if(this.publicQue.length > 0){
                let curtime = new Date().getTime()
                for(let i = 0; i < this.publicQue.length; i++){                
                    let newpubtime = this.last_public_call + this.public_limit                    
                    if(curtime > newpubtime){
                        this.last_public_call = curtime
                        this.publicQue[i].func()
                        this.publicQue.splice(i, 1)
                    }                                        
                }
            }
            await sleep(20) //  time to check between calls that fail to meet min delay  
            this.publicLimiter()       
        }
        catch(e){
           logger.error('Gemini REST public limiter error', e)
            await sleep(20)
            this.publicLimiter() 
        }
      
    }

    async privateLimiter(){
        try{
         
            if(this.privateQue.length > 0){
                let curtime = new Date().getTime()
                for(let i = 0; i < this.privateQue.length; i++){                
                    let newprivtime = this.last_private_call + this.private_limit                    
                    if(curtime > newprivtime){
                        this.last_private_call = curtime
                        this.privateQue[i].func()
                        this.privateQue.splice(i, 1)
                    }
                                        
                }

            }
            await sleep(20) //  time to check between calls that fail to meet min delay  
            this.privateLimiter()       
        }
        catch(e){
           logger.error('Gemini REST public limiter error', e)
            await sleep(20)
            this.privateLimiter() 
        }


    }

    newOrder(market, qty, price, side){

        api.newOrder({
            "symbol": "btcusd", 
            "amount": "0.005", 
            "price": "6915.00",
            "side": "buy"
        })

    }

    /**
     * 
     * @param {object} message object containt properties exchange, call, data
     */
    orderUEI(message){
        if(message.call == 'newOrder'){

        }

    }
}

module.exports = Gemini_REST