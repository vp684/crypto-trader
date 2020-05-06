

class Market {
    constructor(symbol, ws){

        this.symbol = symbol
        this.ws = ws.websocket
        this.orderbook = null        
    }

    init(){
        this.marketListener()
        
    }

    marketListener(){
        this.ws.openMarketSocket(this.symbol, (market) => {
            console.log(market)
            this.ws.addMarketMessageListener((data) => {
                console.log(data, market.target.url)
            })
        })
    }

    mainLoop(){

    }

    
}

module.exports = Market