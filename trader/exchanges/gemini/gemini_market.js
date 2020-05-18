const sleep = require('../../../helper/sleep').sleep
let obmanager = require('./gemini_orderbook_mgr')
const G_WS = require('./gemini_ws')
const BigNumber = require('bignumber.js')



class Market {
    constructor(symbol, db, rest){

        this.symbol = symbol      
        this.tradesymbol = symbol.slice(0, 3).toUpperCase()
        this.position = {
            total_avg_price: null,
            ex_avg_price: null, 
            exchange_qty: null,
            total_quantity: null,
            calculated: false, 
            reset_counter: 0 
        }
        this.balances = {
            usd: null,  
            symbol:null,  
            update: false
        }
        this.ws = new G_WS(symbol)
        this.obMgr = new obmanager(this.symbol)
        this.rest = rest
        this.exchange = 'gemini'
        this.db = db

        this.socket = null
        this.marketListener = this.marketListener.bind(this)
        this.calculatePosition = this.calculatePosition.bind(this)  
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

        await this.calculatePosition()

    

        if(this.position.calculated){
            //position is correct for exchange. continue logic

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
     
        }
       
        
     
        this.restartLoop(750)   
        
    }

    async restartLoop(delay){
        await sleep(delay)
        this.mainLoop()
    }


    setBalances(bal){
        
        if(bal.length > 0){
            for(let i = 0; i < bal.length; i++){
                if(bal[i].currency == 'USD'){
                    this.balances.usd = bal[i].available
                }
                if(bal[i].currency == this.tradesymbol){
                    this.balances.symbol = bal[i].available
                }
            }
            this.balances.update = new Date().getTime()
        }
        console.log(bal)
    }

    calculatePosition(){


        return new Promise(async (resolve, reject) =>{
            

            if(this.balances.symbol !== null){
                    //calculate position
                //get db fills and transfers
                let fills = await this.db.calcFromFill(this.symbol)
                let xfertime = fills.length > 0 ? fills[0].time : 0
                let transfers = await this.db.getTransfers(this.tradesymbol, this.exchange, xfertime)

                let average = null
                let qty = null
                let total_withdrawals = BigNumber(0)
                for (let i = 0; i < transfers.length; i++) {
                    const xfer = transfers[i];
                    if(xfer.type === 'withdrawal'){
                        let subtract = BigNumber(xfer.amount)
                        total_withdrawals = total_withdrawals.minus(subtract)
                    }
                    if(xfer.type === 'deposit'){
                        let addition = BigNumber(xfer.amount)
                        total_withdrawals = total_withdrawals.plus(addition)
                    }


                }
                let test = total_withdrawals.toNumber()
                console.log(test)

                let exchange_bal = BigNumber(0) // compare to exchange balances to see fi we are missing trades in db
                let total_price = BigNumber(0) // pre calc for total avg entry price across all exchanges                                 
                let total_bal = BigNumber(0) //  total balance accross all exchanges for calcualting avg price to sell at


                for (let i = 0; i < fills.length; i++) {
                    const fill = fills[i];
                    let qty = BigNumber(fill.size)
                    let price = BigNumber(fill.price)

                    // add all buy qtys from all exchanges to total_bal used for calculating avg prices excluding sales.
                    total_bal = fill.side === 'buy' ? total_bal.plus(qty) : total_bal
                    total_price = fill.side === 'buy' ? total_price.plus(price.multipliedBy(qty)) : total_price
                    if(fill.exchange == this.exchange){
                        //same exchange calculate exchange quantitiy, or amount available to sell on this exchange.                                              
                        exchange_bal = fill.side === 'buy' ? exchange_bal.plus(qty) : exchange_bal.minus(qty)
                                                
                    }                  
                }

                let total_avg_price = total_price.dividedBy(total_bal)
                // check exchange balance against reported amounts                
                exchange_bal = exchange_bal.plus(total_withdrawals)
                console.log(exchange_bal.toNumber())

                console.log({
                    total_avg_price: total_avg_price.toNumber(), 
                    total_bal: total_bal.toNumber(), 
                    exchange_bal: exchange_bal.toNumber()
                })  
                
                let rest_balance = BigNumber(this.balances.symbol)
                if(exchange_bal.isEqualTo(rest_balance) ){ //
                    this.position = {
                        total_avg_price: total_avg_price,       
                        exchange_qty: exchange_bal,
                        total_quantity: total_bal,
                        calculated: true
                    }
                    return resolve(true)
                }else{
                    this.position.reset_counter += 1
                    if(this.position.reset_counter > 10){
                        // missing some trades or transfers in db
                        if(fills.length > 0){
                            await this.getAllFillsXfers(fills[0].time)
                        }
                        
                    }
                }
            }
            resolve(false)
            
            
        })
        
    }

    getAllFillsXfers(time){
        return new Promise(async (resolve, reject) => {
                let condition = true
                let trade_continue = true
                let xfer_continue = true
                time = time.getTime()
                let lastFill = time
                let lastXfer = time
                while(condition){
                    if(trade_continue){
                        let trades = await this.rest.getMyPastTrades({symbol:this.symbol, limit_trades: 500, timestamp: lastFill}) 
                        let l_trade_time = trades.fills[trades.fills.length -1].time.getTime() 
                        if(lastFill === l_trade_time){
                            trade_continue = false
                        }
                        lastFill =  l_trade_time                     
                    }    

                    if(xfer_continue){
                        let transfers = await this.rest.getMyTransfers(this.tradesymbol, {limit_transfers: 50, timestamp: time }) 
                        let l_xfer_time = transfers.transfers[transfers.transfers.length -1].time.getTime()
                        if(lastXfer === l_xfer_time){
                            xfer_continue = false
                        }
                        lastXfer =  l_xfer_time
                    }

                    if(!trade_continue && ! xfer_continue){
                        condition = false 
                        return resolve()                       
                    }
                   
                  
                    await sleep(1000)

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
    
}

module.exports = Market