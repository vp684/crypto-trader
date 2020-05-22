"use strict";
require('dotenv').config()
const GeminiAPI = require('gemini-api-vp').default
const sleep = require('../../../helper/sleep').sleep
const logger = require('../../../helper/logger')
const G_Format = require('./gemini_format')
const crypto = require('crypto')
const randomBytes = crypto.randomBytes

 

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
        this.publicLimiter()
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
                //console.log(curtime - newprivtime)          
                if(curtime > newprivtime){
                    this.last_private_call = curtime                                                         
                    this.privateQue[0].func()
                    this.privateQue.splice(0, 1)                                        
                }                                                        
            }
             //  extra time to check between calls
                   
            await sleep(20)
            this.privateLimiter()                                                         
        }
        catch(e){
           logger.error('Gemini REST public limiter error', e)
            await sleep(2000)
            this.privateLimiter()             
        }


    }

    pushPublic(funcobj){
        if(funcobj.func){   
            let noduplicate = this.privateQue.some((value) => { 
                let fe = value.name === funcobj.name                
                return fe
            })
            if(!noduplicate){              
               this.publicQue.push(funcobj)  
            } 
                                          
        }
    }

    pushPrivate(funcobj){
        if(funcobj.func){   
            let noduplicate = this.privateQue.some((value) => { 
                let fe = value.name === funcobj.name                
                return fe
            })
            if(!noduplicate){  
               this.privateQue.push(funcobj)  
            } 
                                          
        }
    }

    /**
     * 
     * @param {String} market market symbol "btcusd"
     * @param {String} qty amount to buy or sell
     * @param {String} price price as string
     * @param {String} side  "buy" or "sell"
     * @param {Boolean} makerbool default true for maker or cancel
     */
    newOrder(market, qty, price, side, makerbool = true ){
        // client_order_id?: string
        // symbol: string
        // amount: string
        // price: string
        // side: OrderSide
        // type: OrderType
        // options?: OrderExecutionOption
        let opts = []
        if(makerbool){
            opts.push('maker-or-cancel')    
        }
        let id = randomBytes(10).toString('hex')
        console.log(id)

       
        return new Promise((resolve, reject) =>{
            let exec = () => {
                this.api.newOrder({
                    "client_order_id": id,
                    "symbol": market, 
                    "amount": qty, 
                    "price": price,
                    "side": side, 
                    "type": "exchange limit",
                    "options": opts
                })
            }
            let final = {
                name: "newOrder" + id, 
                func: exec
            }
            this.pushPrivate(final)
        })

    }

    getCandles(symbol, timeframe = '1hr'){
        return new Promise((resolve, reject) =>{
            let exec = () => {
                this.api.getCandles(symbol, timeframe).then((results) => {   
                    if(results){
                        resolve(results)
                    }else{resolve(false)}                                                 
                     
                }).catch(e =>{
                    logger.error('past trades error', e)
                    resolve(false)
                })
            }
            let final = {
                name: 'candles' + symbol,
                func: exec
            }

            this.pushPublic(final)
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
                            if(results){
                                let fills = await this.format.restTrades(results, params.symbol)
                                let inserted = await this.db.insertManyFills(fills, params.symbol)
                                resolve({
                                    nInserted: inserted, 
                                    fills: fills
                                }) 
                            }else{reject(false)}                                                 
                             
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

    getMyAvailableBalances(){
        return new Promise((resolve, reject) => {
            let exec = () => {
                this.api.getMyAvailableBalances().then(async (results) =>{               
                    resolve(results)
                })
            }
            let final = {
                name: 'getMyAvailableBalances', 
                func: exec
            }

            this.pushPrivate(final)
        })
    }

    /**
     * 
     * @param {String} symbol required market symbol to filter for: ETHUSD, BTCUSD. 
     * @param {Object} params object for optional parameters, timestamp: in ms, limit_transfers: integer max 50 
     */
    getMyTransfers(symbol, params = { limit_transfers: 50 }){
        return new Promise((resolve, reject) => {
            let exec = () => {
                this.api.getMyTransfers(params).then(async (results) => {
                    if(results){
                        let transfers = results.filter(item =>  item.currency == symbol)
                        transfers = await this.format.restTransfers(transfers, symbol)
                        let inserted = await this.db.insertManyTransfers(symbol, transfers)
                        resolve({
                            nInserted: inserted, 
                            transfers: transfers
                        })               
                    }
                         
                })
            }
            let final = {
                name: "getMyTransfers",
                func: exec
            }
            this.pushPrivate(final)
        })
    }

    
  
}

module.exports = Gemini_REST