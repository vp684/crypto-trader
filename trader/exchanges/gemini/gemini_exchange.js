
const Market = require('./gemini_market')
const settings = require('./gemini_settings')

class GeminiExchange {

        constructor(db){
              this.markets = {}                
              this.exchange = 'gemini'  
              this.db = db  
              this.socket= null                                  
              this.init = this.init.bind(this)
              this.defaultmarkets = ['BTCUSD']
              this.init()
        }



        init(){
            console.log(this.exchange)  
            this.defaultmarkets.forEach(mrk=> this.addMarket(mrk))
                           
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
                let mrk = new Market(market, this.db)      
                this.markets[market] = mrk

            }
                
        }

        getMarkets(){
            let markets = []
            for(let mrk in this.markets){               
                markets.push(mrk)
            }
            return markets
        }

        setSocketToMarkets(socket){
            for(let mrk in this.markets){               
                this.markets[mrk].setSocket(socket)
            }
        }




}

module.exports = GeminiExchange