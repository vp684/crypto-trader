
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

              this.marketBalances = this.marketBalances.bind(this)
              this.init()
        }

        async init(){           
            if(!await this.pingServer()){
                await sleep(15000)
                return this.init()
            }
            this.defaultmarkets.forEach(mrk=> this.addMarket(mrk))
            this.mainLoop()               
        }



        /**
         * Main Loop 
         */
        async mainLoop(){
            //couldnt ping server, wait and restart
            if(!await this.pingServer()){ return this.restartLoop(15000) }
            
            //send active balance to markets
            await this.marketBalances()
            
            

            //restart loop
            this.restartLoop(3000)
        }

        async restartLoop(delay){
            await sleep(delay)
            this.mainLoop()
        }

        marketBalances(){
            return new Promise(async (resolve, reject) =>{
                let bals = await this.rest.getMyAvailableBalances()

                for(let mark in this.markets){
                    this.markets[mark].setBalances(bals)
                }
            })
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
    
                }, "exchange.gemini.com")
            })
        }



}

module.exports = GeminiExchange