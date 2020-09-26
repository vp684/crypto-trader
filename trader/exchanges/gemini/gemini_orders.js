const Settings = require('../settings/exchange_settings')
const crypto = require('crypto')
const BigNumber = require('bignumber.js')
BigNumber.set({DECIMAL_PLACES: 10})
const randomBytes = crypto.randomBytes

module.exports = class Orders{
    constructor(symbol, rest, db){

        this.bidModel = {
            'market': symbol, 
            'orders': [], // {price: '' , vol: ''}
            'sent': [],
            'xlsent': [],
            'side': 'buy'
        }
        this.offerModel = {
            'market': symbol, 
            'orders': [], // {price: '' , vol: ''}
            'sent': [],
            'xlsent':[],
            'side': 'sell'
        }
        this.bids = []
        this.offers = []
        this.settings = new Settings('gemini', db)
        this.db = db
        this.sent = false
        this.symbol = symbol
        this.config = null
        this.rest = rest
        this.position_change = false
        this.init()
    }

    async init(){
        this.config = await this.settings.getMarketSettings(this.symbol)
    }

    setSettings(cfg){
        this.config = cfg
    }

    orderUpdateClosed(order){
        if(order.side === 'buy'){
            let index = this.bids.findIndex(item => item.client_order_id == order.client_order_id)
            this.bids.splice(index, 1)

            let xlindex = this.bidModel.xlsent.findIndex(item => item == order.order_id)
            this.bidModel.xlsent.splice(xlindex, 1)
        }
        if(order.side === 'sell'){
            let index = this.offers.findIndex(item => item.client_order_id == order.client_order_id)
            this.offers.splice(index, 1)

            let xlindex = this.offerModel.xlsent.findIndex(item => item == order.order_id)
            this.offerModel.xlsent.splice(xlindex, 1)
            
        }
    }

    orderUpdateBooked(order){
        if(order.side === 'buy'){
            let index = this.bidModel.sent.findIndex(item => item.client_order_id == order.client_order_id)
            this.bidModel.sent.splice(index, 1)
            this.bids.push(order)
        }
        if(order.side === 'sell'){
            let index = this.offerModel.sent.findIndex(item => item.client_order_id == order.client_order_id)
            this.offerModel.sent.splice(index, 1)
            this.offers.push(order)

        }
    }

    orderUpdateRejected(order){
        if(order.side === 'buy'){  
            let index = this.bidModel.sent.findIndex(item => item.client_order_id == order.client_order_id)
            this.bidModel.sent.splice(index, 1)

            let xlindex = this.bidModel.xlsent.findIndex(item => item == order.order_id)
            this.bidModel.xlsent.splice(xlindex, 1)
        }
        if(order.side === 'sell'){
            let index = this.offerModel.sent.findIndex(item => item.client_order_id == order.client_order_id)
            this.offerModel.sent.splice(index, 1)

            let xlindex = this.offerModel.xlsent.findIndex(item => item == order.order_id)
            this.offerModel.xlsent.splice(xlindex, 1)
            
        }
    }

    orderUpdate(order){
        // new data about bid cancel or add to active bids
        return new Promise(async (resolve, reject) =>{
            console.log(order)
            let newOrder = {
                client_order_id: order.client_order_id, 
                order_id: order.order_id,
                time: order.timestampms,
                is_live: order.is_live ,
                is_cancelled: order.is_cancelled,
                side: order.side,
                executed_amount: order.executed_amount,
                remaining_amount: order.remaining_amount,
                original_amount: order.original_amount,
                price: order.price, 
                symbol: order.symbol,                         
            }   
       
            if(order.type === 'rejected'){
                console.log('rejected order', order)          
                this.orderUpdateRejected(order)              
                // remove all orders and start over.
            }
            if(order.type === 'initial'){
                if(order.side === 'buy'){
                    this.bids.push(newOrder)
                }
                if(order.side === 'sell'){
                    this.offers.push(newOrder)
                }
                
            }
            if(order.type === 'closed'){
                this.orderUpdateClosed(order)
            }   
    
            if(order.type === 'booked'){
                this.orderUpdateBooked(order)
               
            }
    
            if(order.type === 'fill'){
                let cfg = this.config
                console.log(order)
                let fill_fee = order.fill.fee
                if(order.fill.fee_currency !== 'USD'){
                    //create logic for cross market trades not in USD
                }
                let fill = {
                    market: this.symbol, 
                    trade_id: parseInt(order.fill.trade_id),
                    time: new Date(order.timestampms),
                    side: order.side,
                    size: order.fill.amount,
                    price: order.fill.price,
                    fee: fill_fee,
                    exchange: "gemini"
                }
                let fills = []
                fills.push(fill)
                await this.db.insertManyFills(fills, this.symbol)            
            }

            resolve()

        })
       
    }

    createBidModel(topofbook, position, stats){
        return new Promise((resolve, reject)=>{

            let bm = []
           
            let cfg = this.config
           
            let traded = position.equity
            let tradeable = cfg.tradeable
            if(traded > tradeable){ //  over traded send empty bidmodel
                this.bidModel.orders = []
                return resolve()     
                  
            }
                                              
            let num_bids = cfg.num_entries
            let dflt_bidspace // amount to stagger bids if more than one
            let round = 2 //  need to round to different amount if trading cross pairs.
          
            let bid = Number(topofbook.bid)
            let statlevel = stats.levels.bidlevel        
           
            let bandpercent = 0.0000                                                           
            let vol = cfg.min_vol
            let singlevalue  = parseFloat((bid * vol).toFixed(2))//  $4000 * 0.01 = $40.00    
            if(cfg.bid_value > singlevalue){
                vol = parseFloat((cfg.bid_value / bid).toFixed(cfg.vol_decimal_places))
            }
                
            //remove price adjustment from stats level, always bid at stat level.
            let adjust = 0 // parseFloat((statlevel * bandpercent).toFixed(cfg.price_decimal_places));
            let bidlevel = parseFloat((statlevel - adjust).toFixed(cfg.price_decimal_places));
                                                  
                            
            if(bidlevel > bid){ // adjust bidlevel to best bid if its less then level.
                bidlevel = parseFloat((bid - (bid * bandpercent)).toFixed(cfg.price_decimal_places));
            };
        
            dflt_bidspace = cfg.entry_spacing //space out bid orders by this percentage
    
            dflt_bidspace =  bidlevel * dflt_bidspace >= cfg.price_increment ? (1 - dflt_bidspace) : (1 - (cfg.price_increment / bidlevel)) //  add 1- so we can jsut multiply buy bidlevl to reduce by prvious line amount
    
            if(num_bids > 0){
                let remaining = traded < tradeable ? (tradeable - traded): 0 //  
                
                let totalvol = num_bids * vol // total vol value of bids
                let totvalue = bidlevel * totalvol //  total dolalr value of bids 
                num_bids = remaining > totvalue ? num_bids : 0
    
            }
        
                            
            for(let i = 0; i < num_bids; i++){
                if( i > 0){ 
                    bidlevel = parseFloat(bm[bm.length - 1].price)
                    bidlevel *= dflt_bidspace
                }
                          
                let ro = {
                    'price': Number(bidlevel.toFixed(cfg.price_decimal_places)),
                    'vol': vol
                }   
                    
                bm.push(ro)
            }
            this.bidModel.orders = bm
            resolve()
        })
    };
              
    async manageBids(){
        //called after book state to send cancels and new bids.
        // currently can only send one order per price level.

        //find bids to cancel and send cancels
        let cancels = false
        for (let i = 0; i < this.bids.length; i++) {
            const bid = this.bids[i];
            let cancelbid = true
            for (let k = 0; k < this.bidModel.orders.length; k++) {
                const bidmodel = this.bidModel.orders[k];
                if(bidmodel.price === Number(bid.price)){
                    if(bidmodel.vol === Number(bid.original_amount)){
                        cancelbid = false
                    }
                }

            }
            
            if(cancelbid){
                //send cancel for current bid
                let xlsent = this.bidModel.xlsent.includes(bid.order_id)
                if(!xlsent){
                    let co = await this.cancelOrder(bid.order_id)
                    cancels = true
                    this.bidModel.xlsent.push(co)
                }
                
            }
            
        }
        if(cancels) return

        //find bids already contained and send remaining.
        for (let i = 0; i < this.bidModel.orders.length; i++) {
            const modelbid = this.bidModel.orders[i];

            let bidmatch = false
            //check if already on book
            for (let k = 0; k < this.bids.length; k++) {
                const bid = this.bids[k];
                if(modelbid.price === Number(bid.price) && modelbid.vol === Number(bid.original_amount)){
                    bidmatch = true
                    k = this.bids.length
                }                                                
            }
            
            //check if already sent
            for (let k = 0; k < this.bidModel.sent.length; k++) {
                const sentbid = this.bidModel.sent[k];
                if(modelbid.price === Number(sentbid.price) && modelbid.vol === Number(sentbid.amount)){
                    bidmatch = true
                    k = this.bidModel.sent.length
                }                                
            }

            //not sent nor on book, send order
            if(!bidmatch){
               
                let bo = await this.newOrder(modelbid.vol.toString(), modelbid.price.toString(), 'buy')               
                this.bidModel.sent.push(bo)              
            }

            
        }
        
    }
      
    createOfferModel(topofbook, position, stats){
        return new Promise((resolve, reject)=>{
    
            let cfg = this.config
            let ask = parseFloat(topofbook.ask)
            let market = position.market    
            let minimumvol = cfg.min_vol
            let exchange_qty = BigNumber(position.exchange_qty)
            let om = [] 
           
    
            // check for position
            if(position.exchange_qty > 0){
                
                let profitpercent =cfg.strategy.strategy.profit_percent
                let longprice = position.total_avg_price
                let offerlevel = parseFloat((longprice * (1 + profitpercent)).toFixed(cfg.price_decimal_places))
                let minAsk =  parseFloat((ask - (cfg.price_increment )).toFixed(cfg.price_decimal_places))  

                if( minAsk >= offerlevel){
                    let sameprice = false
                    for(let i = 0; i < this.offers.length; i++){
                        let o_price = parseFloat(this.offers[i].price)
                        if(o_price === ask){
                            offerlevel = o_price
                            sameprice = true
                            i = this.offers.length
                        }
                    }
                    if(!sameprice){
                        offerlevel = parseFloat( (minAsk - (cfg.price_increment)).toFixed(cfg.price_decimal_places)  )
                    }
                    
                }      
                //offerlevel = parseFloat( (minAsk - (cfg.price_increment * 50)).toFixed(cfg.price_decimal_places)  )
                let num_orders = cfg.num_exits
                num_orders = (num_orders * minimumvol) < position.exchange_qty ? num_orders : 1 // have to have atleast this postion to break orders up
                                  
                //find remainder if any                

                let vol =  exchange_qty.dividedBy(num_orders).decimalPlaces(cfg.vol_decimal_places, 1).toNumber() //parseFloat((position.exchange_qty/num_orders).toFixed(10))
                let less_remainder = BigNumber(vol).multipliedBy(num_orders).toNumber() //parseFloat((vol * num_orders).toFixed(cfg.vol_decimal_places))
                let remainder =  BigNumber(position.exchange_qty).minus(less_remainder).toNumber()//parseFloat((position.exchange_qty - less_remainder).toFixed(cfg.vol_decimal_places))
                                           
                // set first order to have the remainder past the minimum value ie if min value is .01 and long position is 1.785728784  .015728784 shoudl be first order. 
    
                for(let i = 0; i < num_orders; i++){// add the orders to array

                    let order = {
                        'price': null,
                        'vol': null
                    }                   
    
                    if(i == 0 && num_orders > 1){
                        order.price = offerlevel
                        order.vol = parseFloat((vol + remainder).toFixed(cfg.vol_decimal_places + 1))
                    }else{
                        let price_inc = i === 0 ? 1 : parseFloat( 1 + (i * cfg.exit_spacing ) )
                        order.price = parseFloat( (offerlevel * price_inc ).toFixed(cfg.price_decimal_places) )
                        order.vol = vol
                    }  
                    
                    om.push(order)
                           
                }                           
            } 

            this.offerModel.orders = om
            resolve()    
    
        })
    }   

    async manageOffers(){
        let cancels = false
        // check if order on exchange needs to be cancelled
        for (let i = 0; i < this.offers.length; i++) {
            const offer = this.offers[i];
            let cancelOffer = true
            for (let k = 0; k < this.offerModel.orders.length; k++) {
                const offerModel = this.offerModel.orders[k];
                if(offerModel.price === Number(offer.price)){
                    if(offerModel.vol === Number(offer.original_amount)){
                        cancelOffer = false
                    }
                }
            }
            
            if(cancelOffer){
                //send cancel for current ogger
                let xlsent = this.offerModel.xlsent.includes(offer.order_id)
                if(!xlsent){
                    let co = await this.cancelOrder(offer.order_id)
                    this.offerModel.xlsent.push(co)
                    cancels = true
                }                
            }            
        }
        // give time for cancels to complete
        if(cancels) return

        //find offers already contained and send remaining.
        for (let i = 0; i < this.offerModel.orders.length; i++) {
            const modelOffer = this.offerModel.orders[i];

            let offerMatch = false
            //check if already on book
            for (let k = 0; k < this.offers.length; k++) {
                const offer = this.offers[k];
                if(modelOffer.price === Number(offer.price) && modelOffer.vol === Number(offer.original_amount)){
                    offerMatch = true
                    k = this.offers.length
                }                                                
            }
            
            //check if already sent
            for (let k = 0; k < this.offerModel.sent.length; k++) {
                const sentOffer = this.offerModel.sent[k];
                if(modelOffer.price === Number(sentOffer.price) && modelOffer.vol === Number(sentOffer.amount)){
                    offerMatch = true
                    k = this.offerModel.sent.length
                }                                
            }

            //not sent nor on book, send order
            if(!offerMatch){               
                let so = await this.newOrder(modelOffer.vol.toString(), modelOffer.price.toString(), 'sell')               
                this.offerModel.sent.push(so)              
            }
            
        }

    }

    async newOrder(qty, price, side){  
        let uid = randomBytes(10).toString('hex')             
        let order = await this.rest.newOrder(this.symbol, qty, price, side, uid)
        return order
    }

    async cancelOrder(orderID){
        let order = await this.rest.cancelOrder(orderID)
        return order
    }


}