
const Market = require('./gemini_market')
const settings = require('./gemini_settings')

class GeminiExchange {

        constructor(){
              this.markets = {}                
              this.exchange = 'gemini'                         
              this.init = this.init.bind(this)
              this.init()
        }



        init(){
            console.log(this.exchange)
            this.addMarket('btcusd')
            this.addMarket('daiusd')
        }

        /**
         * 
         * @param {String} market  hyphenated market to trade ie BTCUSD
         */
        addMarket(market){
            let index = settings.markets.indexOf(market)
            for(let mrk in this.markets){
                if(mrk === market){
                    index = -1
                }
            }
            if(index !== -1){
                let mrk = new Market(market)      
                this.markets[market] = mrk

            }
                
        }




}

module.exports = GeminiExchange