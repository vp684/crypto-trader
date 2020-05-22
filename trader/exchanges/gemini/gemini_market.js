const sleep = require('../../../helper/sleep').sleep
let obmanager = require('./gemini_orderbook_mgr')
const G_WS = require('./gemini_ws')
const BigNumber = require('bignumber.js')
const G_Format = require('./gemini_format')



class Market {
    constructor(symbol, db, rest){

        this.format = new G_Format()
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
        this.market_data = {
            init: null, 
            candles: null,
            period: '4hr', 
            standard_m:[1, 5, 15, 30],
            standard_h:[1, 6, 24]
        }
        this.orders = {
            bids: [], 
            asks: []
        }
        this.ws = new G_WS(symbol)
        this.obMgr = new obmanager(this.symbol)
        this.rest = rest
        this.exchange = 'gemini'
        this.db = db
        this.previoustrade = null
        this.socket = null
        this.marketListener = this.marketListener.bind(this)
        this.calculatePosition = this.calculatePosition.bind(this)  
        this.init()
    }

    async init(){    
       console.log('gemini market open', this.symbol)        
       
       this.initCandles()  

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
                
                let trades = data.events.filter(order => order.type === "trade")
                if(trades.length > 0){

                    trades.forEach((value) => { value.time = new Date(data.timestampms) })
                    this.updateCandles(trades)
                }


              
                
               
            }

           
        })
    }

    orderListener(){
        this.ws.openOrderSocket((data) =>{
            console.log(data)
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
        
        if(this.market_data.candles !== null){
            console.log(this.market_data.candles[0])
            console.log(this.market_data.candles)

        }
        
     
        this.restartLoop(5000)   
        
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

    async initCandles(){
        let digits = this.market_data.period.match(/\d+/)[0]
        let period = this.market_data.period.match(/[a-zA-Z]+/)[0]


        let type =  period === 'hr' ? this.market_data.standard_h : this.market_data.standard_m
        let searchperiod = false
        for(let i = type.length -1; i > -1; i--){
            if(type[i] < digits){
                let finalperiod = digits % type[i] === 0 ? type[i] : 0
                if(finalperiod > 0){
                    searchperiod = finalperiod
                    i = -1
                }
            }
        }

        if(searchperiod !== false){
            //get candles from rest
            searchperiod = searchperiod + period
            let initialcandles = await this.rest.getCandles(this.symbol, searchperiod)  
            
            //format candles to erquired period
            if(initialcandles){
                this.market_data.candles = await this.format.formatCandles(initialcandles, digits, period)
                console.log(this.market_data.candles)
            }
        }else{
            logger.error('initCandles problem', {
                digits, period
            })
        }     
        
    }


    async updateCandles(data){
        let digits = Number(this.market_data.period.match(/\d+/)[0])
        let period = this.market_data.period.match(/[a-zA-Z]+/)[0]    

        if(this.market_data.candles){
            let cndl = this.market_data.candles[0]
            let prevcndl = this.market_data.candles[1]
            for (let i = 0; i < data.length; i++) {
                const candle = data[i];
                const datahrormin = period == 'hr' ? candle.time.getHours() : candle.time.getMinutes()
                const cndlhrormin = period == 'hr' ? prevcndl.time.getHours() : prevcndl.time.getMinutes()
                
                if(datahrormin >= (cndlhrormin + digits) ){
                    let ncndl = {
                        open: Number(candle.price),
                        high: Number(candle.price),
                        low: Number(candle.price),
                        close: Number(candle.price),
                        vol: Number(candle.amount),
                        time: candle.time
                    }
                    let sethr = this.market_data.candles[1].getHours() + 4
                    this.market_data.candles[0].time.setHours(sethr, 0, 0, 0)

                    this.market_data.candles = [ncndl, ...this.market_data.candles] 

                    if(this.market_data.candles.length > 500){
                        this.market_data.candles.pop()
                    }

                } else{     
                    let price = Number(candle.price)

                    cndl.high = price > cndl.high ? price : cndl.high
                    cndl.low = price < cndl.low ? price : cndl.low
                    cndl.vol = BigNumber(cndl.vol).plus(BigNumber(candle.amount)).toNumber()
                    cndl.close = price
                    cndl.time = candle.time                                                                                            
                }
            }
        }    
      
    }

    calculatePosition(){


        return new Promise(async (resolve, reject) =>{
            

            if(this.balances.symbol !== null){
                    //calculate position
                //get db fills and transfers
                let fills = await this.db.calcFromFill(this.symbol)
                let xfertime = fills.length > 0 ? fills[0].time : 0
                let transfers = await this.db.getTransfers(this.tradesymbol, this.exchange, xfertime)
 
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
                   
                  
                    await sleep(1500)

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