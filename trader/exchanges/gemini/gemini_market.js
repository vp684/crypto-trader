let obmanager = require('./gemini_orderbook_mgr')
const G_WS = require('./gemini_ws')

class Market {
    constructor(symbol){

        this.symbol = symbol
        this.ws = new G_WS(symbol)
        this.obMgr = new obmanager(this.symbol)
        this.exchange = 'gemini'
        this.marketListener = this.marketListener.bind(this)
        this.init()        
    }

    init(){    
       console.log('gemini market open', this.symbol)   
       this.marketListener()     
    }

    marketListener(){        
        this.ws.openMarketSocket((data) => {
               
              
            if(data.type === "update"){
                'some update use data.socket_sequence'
                let order_changes = {
                    socket_sequence: data.socket_sequence,
                    events: data.events.filter( order => order.type === "change")
                }                                
                this.obMgr.onMessage(order_changes)
                
            }
        })
    }

    mainLoop(){
        
    }

    
}

module.exports = Market