const GeminiAPI = require('gemini-api').default
require('dotenv').config()
const sleep = require('../../../helper/sleep').sleep

const api = new GeminiAPI({key: process.env.GEMINI_KEY, secret:  process.env.GEMINI_SECRET})

 

class Gemini_REST{
    constructor(){

    }

    async rateLimiter(){


        await sleep(50)
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
