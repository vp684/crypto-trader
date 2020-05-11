const sleep = require('../../../helper/sleep').sleep
let obmanager = require('./gemini_orderbook_mgr')
const G_WS = require('./gemini_ws')


class Market {
    constructor(symbol, database){

        this.symbol = symbol
        this.position = {
            avg_price: null, 
            quantity: null,
            calculated: false
        }
        this.ws = new G_WS(symbol)
        this.obMgr = new obmanager(this.symbol)
        this.exchange = 'gemini'
        this.db = database

        this.socket = null
        this.marketListener = this.marketListener.bind(this)
        this.calculatePosition = this.calculatePosition.bind(this)
        this.init()        
    }

    init(){    
       console.log('gemini market open', this.symbol)        
       this.marketListener()    
       this.mainLoop() 
    }

    marketListener(){        
        this.ws.openMarketSocket((data) => {                             
            if(data.type === "update"){
                'some update use data.socket_sequence'
                let order_changes = {
                    time: data.timestampms,
                    socket_sequence: data.socket_sequence,
                    events: data.events.filter( order => order.type === "change")
                }                                
                this.obMgr.onMessage(order_changes)
                
            }
        })
    }

    async mainLoop(){        

        await this.calculatePosition()

        let ob = await this.obMgr.book.state()
        if(ob.ready){
            let date =  new Date(ob.time)
            let hours =  date.getHours().toString() + ":"
            let minutes = date.getMinutes().toString() + ":"
            let seconds = date.getSeconds().toString()+ "."
            let mills = date.getMilliseconds().toString()
            let topbook = {
                ask: ob.asks[0].price.toString(),
                ask_vol: ob.asks[0].size.toString(),    
                bid: ob.bids[0].price.toString(),
                bid_vol: ob.bids[0].size.toString(), 
                time: hours + minutes + seconds + mills
                
            }
            //console.log(this.symbol, topbook)
            if(this.socket){  
                this.socket.emit(this.symbol, {symbol: this.symbol, data: topbook} )
            }
            
        }
        
     
        
        await sleep(750)
        this.mainLoop()
    }

    calculatePosition(){
        
        return new Promise((resolve, reject) =>{    

            console.log(this)

            resolve()
        })
    }

    setSocket(socket){
        this.socket = socket
        console.log(this.socket.id)
    }

    setSocketEvents(){
        if(this.socket){
            this.socket.emit('connected', {market: this.symbol})
        }
        else{
            console.log('no socket')
        }
    }
    
}

module.exports = Market