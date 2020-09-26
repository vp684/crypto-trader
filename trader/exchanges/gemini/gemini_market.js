const sleep = require('../../../helper/sleep').sleep
let obmanager = require('./gemini_orderbook_mgr')
const G_WS = require('./gemini_ws')
const BigNumber = require('bignumber.js')
const G_Format = require('./gemini_format')
const Strategy = require('../../strategy/strategy')
const Orders = require('./gemini_orders')



class Market {
    constructor(symbol, db, settings, rest){

        
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
            qty: null,  
            update: false
        }
        this.market_data = {
            init: null, 
            candles: null,
            period: '4hr', 
            standard_m:[1, 5, 15, 30],
            standard_h:[1, 6, 24]
        }
        this.format = new G_Format()
        this.orders = new Orders(symbol, rest, db)
        this.strategy = new Strategy()
        this.settings = settings
        this.market_settings = null
        this.stats = {
            data: null
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
        this.marketBalances = this.marketBalances.bind(this)
        this.halt = false

        this.init()
    }

    async init(){    
        console.log('gemini market open', this.symbol)    
        await this.db.CreateFillsDB(this.symbol)    
        await this.db.CreateTransfersDB(this.symbol)
        await this.db.CreateFlatIdDB(this.symbol)     
        await this.marketBalances()  
        this.market_settings = await this.settings.getMarketSettings(this.symbol)
        this.market_data.period = this.market_settings.strategy.candle_period
        this.initCandles()  
        this.marketListener()  
        this.orderListener()       
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
        this.ws.openOrderSocket(async (data) =>{   
            if(data.type === 'subscription_ack'){ 
                this.orders.socket = true
            }
            if(data.length){
                for (let i = 0; i < data.length; i++) {
                    const order = data[i];
                    if(order.api_session !== "UI"){
                        await this.orders.orderUpdate(order)    
                        if(order.type === 'fill'){
                            this.position.calculated = false
                        }                               
                    }
    
                }
            }
            

        })
    }

    async mainLoop(){        
      
        /**
         * 1. get balances from rest
         * 2. check against balances in database
         * 3. get candles
         * 4. calculate indicators
         * 5. create bid and offer models
         * 6. send orders to mathc bid.offer models
         * 7. update to current data
         * 
         */
        if(this.halt) return 

        if(this.position.calculated){
            // 1, 2 position is correct for exchange. continue logic
            this.orders.setSettings(this.market_settings)
            if(this.market_data.candles !== null){
                //candles complete  
                
                //this.stats = await this.strategy.maEnvelope(this.market_data.candles, {period: 7, percent: 0.02, type: 'simple', all: false})

                this.stats = await this.strategy.applyStrategy(this.market_data.candles, this.market_settings.strategy.strategy)
                //indicators complete

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
                        time: hours + minutes + seconds + mills,   
                        book: {
                            asks: ob.asks, 
                            bids: ob.bids
                        }                     
                    }


                    if(this.stats.data !== null){
                        await this.orders.createBidModel(topbook, this.position, this.stats)
                        await this.orders.createOfferModel(topbook, this.position, this.stats )
                        
                        this.orders.manageBids()      

                        this.orders.manageOffers() 
                    }
                 
                    if(this.socket){  
                        this.socket.emit('gemini', {
                                symbol: this.symbol, 
                                exchange: this.exchange,
                                data: {
                                    bids: this.orders.bidModel,
                                    offers:this.orders.offerModel,
                                    book: topbook, 
                                    stats: this.stats,  
                                    pos: this.position, 
                                    env: this.stats.data[0]                        
                                }
                        } )
                    }

                    

                    console.log({
                        symbol: this.symbol,
                        bids: this.orders.bidModel,
                        offers:this.orders.offerModel,
                        book: topbook, 
                        stats: this.stats,  
                        pos: this.position, 
                        env: this.stats.data[0]                        
                    })           
        
                }
                                 
            }
     
        }else{
            await this.calculatePosition()
        }                                                             

        this.restartLoop(500)   
        
    }

    async restartLoop(delay){
        await sleep(delay)
        this.mainLoop()
    }

 
    setBalances(bal){
        return new Promise((resolve, reject) => {
            if(bal.length > 0){
                for(let i = 0; i < bal.length; i++){
                    if(bal[i].currency == 'USD'){
                        this.balances.usd = bal[i].available
                    }
                    if(bal[i].currency == this.tradesymbol){
                        this.balances.qty = bal[i].amount
                    }
                    if(i == bal.length -1 && this.balances.qty == null){
                        this.balances.qty = 0
    
                    }
                }
                this.balances.update = new Date().getTime()
            }
            console.log(bal)
            resolve()
        })        
    }

    marketBalances(){
        return new Promise(async (resolve, reject) =>{
            let bals = await this.rest.getMyAvailableBalances()            
            await this.setBalances(bals)            
            resolve()
        })
    } 


    async initCandles(){
        let digits = this.market_data.period.match(/\d+/)[0]
        let period = this.market_data.period.match(/[a-zA-Z]+/)[0]


        let type =  period === 'hr' ? this.market_data.standard_h : this.market_data.standard_m
        let searchperiod = false
        for(let i = type.length -1; i > -1; i--){
            if(type[i] <= digits){
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
                    let sethr = this.market_data.candles[1].time.getHours() + 4
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
            

            if(this.balances.update !== false){
                    //calculate position
                //get db fills and transfers
                let fills = await this.db.calcFromFill(this.symbol)
                let xfertime = fills.length > 0 ? fills[0].time : 0
                let transfers = await this.db.getTransfers(this.tradesymbol, xfertime)
 
                let total_transfers = BigNumber(0)
                let exchange_transfers = BigNumber(0)
                for (let i = 0; i < transfers.length; i++) {
                    const xfer = transfers[i];
                    if(xfer.type === 'withdrawal' || xfer.type === 'withdraw'){
                        let subtract = BigNumber(xfer.amount)
                        total_transfers = total_transfers.minus(subtract)
                        if(xfer.exchange === this.exchange){
                            exchange_transfers = exchange_transfers.minus(subtract)
                        }
                    }
                    if(xfer.type === 'deposit'){
                        let addition = BigNumber(xfer.amount)
                        total_transfers = total_transfers.plus(addition)
                        if(xfer.exchange === this.exchange){
                            exchange_transfers = exchange_transfers.plus(addition)
                        }
                    }
                }    


                let exchange_bal = BigNumber(0) // compare to exchange balances to see fi we are missing trades in db
                let total_price = BigNumber(0) // pre calc for total avg entry price across all exchanges                                 
                let total_bal = BigNumber(0) //  total balance accross all exchanges for calcualting avg price to sell at
                let bal_for_avg_price = BigNumber(0)

                //seperate buys and sells
                // let buys = fills.filter(fill => fill.side === "buy").reverse()
                // let sells = fills.filter(fill => fill.side === "sell").reverse()


                for (let i = 0; i < fills.length; i++) {
                    const fill = fills[i];
                    let qty = BigNumber(fill.size)
                    let price = BigNumber(fill.price)

                    // add all buy qtys from all exchanges to total_bal used for calculating avg prices excluding sales.
                    
                    total_bal = fill.side === 'buy' ? total_bal.plus(qty) : total_bal.minus(qty)
                    bal_for_avg_price = fill.side === 'buy' ? bal_for_avg_price.plus(qty) : bal_for_avg_price
                    total_price = fill.side === 'buy' ? total_price.plus(price.multipliedBy(qty)) : total_price

                    if(fill.exchange == this.exchange){
                        //same exchange calculate exchange quantitiy, or amount available to sell on this exchange.                                              
                        exchange_bal = fill.side === 'buy' ? exchange_bal.plus(qty) : exchange_bal.minus(qty)
                                                
                    }                  
                }

                let total_avg_price = total_price.dividedBy(bal_for_avg_price)

                // check exchange balance against reported amounts                
                exchange_bal = exchange_bal.plus(exchange_transfers)
                total_bal = total_bal.plus(total_transfers)
                                
                let rest_balance = BigNumber(this.balances.qty)
                if(exchange_bal.isEqualTo(rest_balance) ){ //
                    this.position = {
                        total_avg_price: Number.isNaN(total_avg_price.toNumber()) === true ? 0 : total_avg_price.toNumber() ,       
                        exchange_qty: exchange_bal.toNumber(),
                        total_quantity: total_bal.toNumber(),
                        equity: Number.isNaN(total_avg_price.multipliedBy(exchange_bal).toNumber()) === true ? 0 : total_avg_price.multipliedBy(exchange_bal).toNumber(),
                        calculated: true
                        
                    }
                    if(exchange_bal.isEqualTo(0) && fills.length > 0){
                        //record flat id.
                      
                        let flatOrder = fills[0]
                        if(flatOrder.side === "sell"){                          
                            this.db.Write_FlatID(flatOrder, this.symbol)
                        }
                        
                       
                       
                    }

                    return resolve(true)
                }else{
                    await this.marketBalances()
                    this.position.reset_counter += 1                    
                    if(this.position.reset_counter > 5){
                        // missing some trades or transfers in db
                        if(fills.length > 0){
                            await this.getAllFillsXfers(fills[0].time)
                        }else {
                            await this.getAllFillsXfers(new Date(2000, 0, 0, 0))
                        }
                        this.position.reset_counter = 0
                    }
                }
            }else{
                await this.marketBalances()                
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
                        lastFill = l_trade_time                     
                    }    

                    if(xfer_continue){
                        let transfers = await this.rest.getMyTransfers(this.tradesymbol, {limit_transfers: 50, timestamp: time }) 
                        if(transfers.transfers.length > 0){
                            let l_xfer_time = transfers.transfers[transfers.transfers.length -1].time.getTime()
                            if(lastXfer === l_xfer_time){
                                xfer_continue = false
                            }
                            lastXfer = l_xfer_time
                        }else{
                            xfer_continue = false
                        }
                        
                    }

                    if(!trade_continue && !xfer_continue){
                        condition = false 
                        return resolve()                       
                    }
                   
                  
                    await sleep(1500)

                }   
              
                
                
            
        })    
        
       
    }
   

    setSocket(socket){
        this.socket = socket        
    }

    setSocketEvents(){
        if(this.socket){
            this.socket.emit('connected', {market: this.symbol})
        }
        else{
            console.log('no socket')
        }
    } 

    stop(){
        //halt market remove references clear sockets.
        this.halt = true
    }
    

    setSettings(cfg){        
        this.market_settings = cfg
    }
}

module.exports = Market