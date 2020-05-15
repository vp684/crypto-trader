"use strict";
require('dotenv').config()
const GeminiAPI = require('gemini-api-vp').default
const sleep = require('../../../helper/sleep').sleep
const logger = require('../../../helper/logger')
const G_Format = require('./gemini_format')

 

class Gemini_REST{
    constructor(db){
        this.publicQue = []
        this.last_public_call = 0
        this.privateQue= []
        this.last_private_call = 0
        this.api = new GeminiAPI({key: process.env.GEMINI_KEY, secret:  process.env.GEMINI_SECRET})
        this.format = new G_Format()
        this.db = db
        //time in ms between calls
        this.public_limit = 1000 // 120 per min no more than 1 per sec
        this.private_limit = 200 // 600 per min no moe than 5 per sec.
   
        this.privateLimiter()
        //this.publicLimiter()
        this.getMyPastTrades = this.getMyPastTrades.bind(this)
    }

    async publicLimiter(){
        try{
         
            if(this.publicQue.length > 0){
                let curtime = new Date().getTime()                
                let newpubtime = this.last_public_call + this.public_limit                    
                if(curtime > newpubtime){
                    this.last_public_call = curtime
                    this.publicQue[0].func()
                    this.publicQue.splice(0, 1)
                }    
            }
            await sleep(50) //  time to check between calls that fail to meet min delay  
            this.publicLimiter()       
        }
        catch(e){
           logger.error('Gemini REST public limiter error', e)
            await sleep(2000)
            this.publicLimiter() 
        }
      
    }

    async privateLimiter(){
        try{
         
            if(this.privateQue.length > 0){                     
                let curtime = new Date().getTime()            
                let newprivtime = this.last_private_call + this.private_limit  
                console.log(curtime - newprivtime)          
                if(curtime > newprivtime){
                    this.last_private_call = curtime  
                                                       
                    this.privateQue[0].func()
                    this.privateQue.splice(0, 1)                                        
                }                                                        
            }
             //  extra time to check between calls
           
        
            await sleep(50)
            this.privateLimiter() 
                
            
           
                 
        }
        catch(e){
           logger.error('Gemini REST public limiter error', e)
            await sleep(2000)
            
        }


    }

    pushPublic(){

    }

    pushPrivate(funcobj){
        if(funcobj.func){   
            let noduplicate = this.privateQue.some((value) => { 
                let fe = value.name === funcobj.name                
                return fe
            })
            if(!noduplicate){
                console.log('called limiter que is 1', this.privateQue.length)
               this.privateQue.push(funcobj)  
            } 
                                          
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
     * @param {Object} params object   symbol: string limit_trades?: number timestamp?: number
     */
    getMyPastTrades(params){
           
            return new Promise((resolve, reject) => {
                let exec = () => {
                        this.api.getMyPastTrades(params).then( async (results) => {                                                    
                            let final = await this.format.restTrades(results, params.symbol)
                            let inserted = await this.db.insertManyFills(final, params.symbol)
                            resolve(inserted)  
                        }).catch(e =>{
                            logger.error('past trades error', e)
                            reject('error')
                        })
                }
                let final = {
                    name: 'pasttrades' + params.symbol,
                    func: exec
                }

               this.pushPrivate(final)
            })
            

    }

  
}

module.exports = Gemini_REST