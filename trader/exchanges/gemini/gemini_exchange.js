const G_WS = require('./gemini_ws')

class GeminiExchange {
        constructor(){
              this.markets = []                 
              this.exchange = 'gemini'
              this.init = this.init.bind(this)
              this.init()
              this.websocket = new G_WS()
              this.books = {
                    
              }
        }



        init(){
            console.log(this.exchange)
        }

        /**
         * 
         * @param {String} market  hyphenated market to trade ie BTC-USD
         */
        addMarket(market){
                
        }




}

module.exports = GeminiExchange