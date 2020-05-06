

class Market {
    constructor(symbol, ws, exchange){

        this.symbol = symbol
        this.ws = ws.websocket
        this.obMgr = null
        this.exchange = exchange
        this.init()        
    }

    init(){
        switch(this.exchange){
            case 'gemini':               
                let obmanager = require('../exchanges/gemini/gemini_orderbook_mgr')
                this.obMgr = new obmanager(this.symbol)

        }

    }

    marketListener(){
        this.ws.openMarketSocket(this.symbol, (event) => {
            console.log(event)

            this.ws.addMarketMessageListener((data) => {
                console.log(data, market.target.url)
            })
        })
    }

    mainLoop(){
        
    }

    
}

module.exports = Market