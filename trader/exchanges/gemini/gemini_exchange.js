
const Market = require('./gemini_market')
const settings = require('./gemini_settings')
const G_Rest = require('./gemini_rest')

const checkInternet = require('../../../helper/checkinternet').checkInternet
const sleep = require('../../../helper/sleep').sleep

class GeminiExchange {

        constructor(db){
              this.markets = {}                
              this.exchange = 'gemini'  
              this.db = db  
              this.rest = new G_Rest(this.db)
              this.socket= null                                  
              this.init = this.init.bind(this)
              this.defaultmarkets = ['BTCUSD']
              this.init()
        }



        async init(){           
            if(!await this.pingServer()){
                await sleep(15000)
                return this.init()
            }
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
                let mrk = new Market(market, this.db, this.rest)      
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


        pingServer(){
            return new Promise((resolve, reject) =>{
                checkInternet((canping)=>{
                    if(!canping){
                        console.log(`cant reach: ${this.exchange} api` )
                    }
                    resolve(canping)
    
                }, "https://api.gemini.com")
            })
        }



}

module.exports = GeminiExchange