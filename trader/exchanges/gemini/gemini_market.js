const sleep = require('../../../helper/sleep').sleep
let obmanager = require('./gemini_orderbook_mgr')
const G_WS = require('./gemini_ws')

const checkInternet = require('../../../helper/checkinternet').checkInternet



class Market {
    constructor(symbol, db, rest){

        this.symbol = symbol
        this.position = {
            total_avg_price: null,
            ex_avg_price: null, 
            exchange_qty: null,
            total_quantity: null,
            calculated: false
        }
        this.ws = new G_WS(symbol)
        this.obMgr = new obmanager(this.symbol)
        this.rest = rest
        this.exchange = 'gemini'
        this.db = db

        this.socket = null
        this.marketListener = this.marketListener.bind(this)
        this.calculatePosition = this.calculatePosition.bind(this)
        this.getFills = this.getFills.bind(this)
        this.pingServer = this.pingServer.bind(this)        
        this.init()
    }

    async init(){    
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
        if(!await this.pingServer()){
            await sleep(15000)
            this.mainLoop()
        }

        await this.calculatePosition()

        if(this.position.calculated){
            //position is correct for exchange.
        }
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

    getFills(){
        
        return new Promise((resolve, reject) =>{    
                                        
            this.db.calcFromFill(this.symbol).then(fills=>{              
                resolve(fills)
            }).catch(e=>{
                //set calcualted to false, some error
                this.position.calculated = false
                resolve()
            })
            

           
        })
    }

    calculatePosition(){


        return new Promise(async (resolve, reject) =>{

            //let fills = await this.getFills()
            
            // calculate position or make more fills calls
            //console.log(fills)

            // finish calculating position and determien if we need more fills in datrabase
            let trades = false
            if(true){
                trades = await this.rest.getMyPastTrades({symbol:this.symbol})
            }
          
            //insert any trades into db and recalculate position
            if(trades){
                               
            }
            
            
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

    pingServer(){
        return new Promise((resolve, reject) =>{
            checkInternet((canping)=>{
                if(!canping){
                    
                }
                resolve(canping)

            }, "https://api.gemini.com")
        })
    }
    
}

module.exports = Market