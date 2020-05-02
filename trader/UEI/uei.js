"use strict";
const Gem_REST = require('../exchanges/gemini/gemini_rest')


class UEI {
    constructor(){
        this.gemini_REST = new Gem_REST()
        
    }

    /**
     * 
     * @param {String} exchange string for exchange to send to must be coinbase, gemini, binance
     * @param {Object} order {market: String, side: string, qty:Number, price: Number, type: String} order object with order details type must be limit or market
     */    
    newOrder(exchange, order){
        let relay = {
            'exchange': exchange, //  exchange to send to 
            'call': 'newOrder', //function to call
            'data': order // order details
        }    
        this.exchangeRelay(relay)
    }



    connectWS(){

    }

    /**
     * 
     * @param {Object} message object containing properties: exchange, call, data
     */
    exchangeRelay(message){

        switch(message.exchange){
            case 'gemini':
                this.gemini_REST.orderUEI(message)
                break;
                
            default:
                console.log('no exchange detected', message)
                logger.warn('no exchange detected', message)    
        }
      
    }
}