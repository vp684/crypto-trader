const Settings = require('./gemini_settings')
const crypto = require('crypto')
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
        this.settings = new Settings(db)
        this.db = db
        this.sent = false
        this.symbol = symbol
        this.config = null
        this.rest = rest
        this.init()
    }

    async init(){
        this.config = await this.db.getExchangeSettings('gemini', this.symbol)
    }

    createBidModel(topofbook, position, stats){
        return new Promise((resolve, reject)=>{
            let market = this.symbol  
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
           
            let bandpercent = 0.001                                                           
            let vol = cfg.min_vol
            let singlevalue  = bid * vol//  $4000 * 0.01 = $40.00    
    
                
            let adjust = parseFloat((statlevel * bandpercent).toFixed(cfg.price_decimal_places));
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
                    'price': bidlevel.toFixed(cfg.price_decimal_places),
                    'vol': vol.toString()
                }   
                    
                bm.push(ro)
            }
            this.bidModel.orders = bm
            resolve()
        })
    };
     
    bidUpdate(bid){
        // new data about bid cancel or add to active bids
        console.log(bid)
        let newBid = {
            client_order_id: bid.client_order_id, 
            order_id: bid.order_id,
            time: bid.timestampms,
            is_live: bid.is_live ,
            is_cancelled: bid.is_cancelled,
            executed_amount: bid.executed_amount,
            remaining_amount: bid.remaining_amount,
            original_amount: bid.original_amount,
            price: bid.price, 
            symbol: bid.symbol,                         
        }   
   
        if(bid.type === 'rejected'){
            console.log('rejected order', bid)
        }
        if(bid.type === 'initial'){
            this.bids.push(newBid)
        }
        if(bid.type === 'closed'){
            let index = this.bids.findIndex(item => item.client_order_id == bid.client_order_id)
            this.bids.splice(index, 1)

            let xlindex = this.bidModel.xlsent.findIndex(item => item == bid.client_order_id)
            this.bidModel.xlsent.splice(xlindex, 1)
        }       
        if(bid.type === 'booked'){
            let index = this.bidModel.sent.findIndex(item => item.client_order_id == bid.client_order_id)
            this.bidModel.sent.splice(index, 1)
            this.bids.push(bid)
        }
    }
       
    async manageBids(){
        //called after book state to send cancels and new bids.
        // currently can only send one order per price level.

        //find bids to cancel and send cancels
        for (let i = 0; i < this.bids.length; i++) {
            const bid = this.bids[i];
            let cancelbid = true
            for (let k = 0; k < this.bidModel.orders.length; k++) {
                const bidmodel = this.bidModel.orders[k];
                if(bidmodel.price === bid.price){
                    if(bidmodel.vol === bid.original_amount){
                        cancelbid = false
                    }
                }

            }

            for (let k = 0; k < this.bidModel.xlsent.length; k++) {
                const xlbid = this.bidModel.xlsent[k];
                if(bid.order_id == xlbid){
                    cancelbid = false
                }
            }

            if(cancelbid){
                //send cancel for current bid
                let co = await this.cancelOrder(bid.client_order_id)
                this.bidModel.xlsent.push(co)
            }
            
        }


        //find bids already contained and send remaining.
        for (let i = 0; i < this.bidModel.orders.length; i++) {
            const modelbid = this.bidModel.orders[i];

            let bidmatch = false
            //check if already on book
            for (let k = 0; k < this.bids.length; k++) {
                const bid = this.bids[k];
                if(modelbid.price === bid.price && modelbid.vol === bid.original_amount){
                    bidmatch = true
                    k = this.bids.length
                }                                                
            }
            
            //check if already sent
            for (let k = 0; k < this.bidModel.sent.length; k++) {
                const sentbid = this.bidModel.sent[k];
                if(modelbid.price === sentbid.price && modelbid.vol === sentbid.amount){
                    bidmatch = true
                    k = this.bidModel.sent.length
                }                                
            }

            //not sent nor on book, send order
            if(!bidmatch){
               
                let bo = await this.newOrder(modelbid.vol, modelbid.price, 'buy')               
                this.bidModel.sent.push(bo)              
            }

            
        }
        
    }

      
    createOfferModel(cfg, position, topofbook){
        return new Promise((resolve, reject)=>{
    
    
            let ask = topofbook.ask[0]
            let market = position.market    
            let minimumvol = null        
            let om = {
                'market': market, 
                'orders': [], // {price: '' , vol: ''}
                'side': 'offers'
            }
    
            let traded = position.equity                     
            position.tradeable = cfg[market].tradeable        
    
            // check for position
            if(position.long > 0){
                
                let profitpercent
                let longprice = position.offer_price
                let offerlevel     
                minimumvol = cfg[market].default.min_offer_vol
                profitpercent = cfg[market].default.min_profit    
    
                if(traded/position.tradeable < cfg[market].bigpos_pct){// for small positions
                    profitpercent = cfg[market].smallpos_profit
                    offerlevel = parseFloat(((1 + profitpercent) * longprice).toFixed(2))                                      
                }
                else{ //we have a postion big              
                    profitpercent = cfg[market].bigpos_profit // minimum you want to make on a big position                                           
                    offerlevel = parseFloat(((1 + profitpercent) * longprice).toFixed(2))
                }
    
    
                if(market == 'ZRX-USD'){
                    offerlevel = (Math.ceil( ( (1 + profitpercent) * longprice) * 100  )  ) /100
                }                
                
                if(ask.price >= offerlevel){
                    offerlevel = ask.price
    
                }      
    
                let num_orders = cfg[market].num_exits
                num_orders = (num_orders * minimumvol) < position.long ? num_orders : 1 // have to have atleast this postion to break orders up
                let hits_to_flat = cfg[market].hits_to_flat          
                let price_increment = cfg[market].price_increment
    
                //find remainder if any
                let x = position.long/minimumvol
                let decimals = parseFloat( ( (x - Math.floor(x) ) * minimumvol).toFixed(8) ); // shoudl equal 0.12345 or the decimal portion.
                let wholevol = parseFloat(decimals)
                let pl_no = position.long/num_orders
    
                let volst = position.long / minimumvol
                let vol_s = volst / hits_to_flat 
                let vol_f = pl_no >= minimumvol ? minimumvol : position.long   
                
            
                vol_f = (vol_s >= 1 && vol_f == minimumvol ) ?  parseFloat(vol_s.toFixed(0) * minimumvol ) : vol_f
               
    
                // set first order to have the remainder past the minimum value ie if min value is .01 and long position is 1.785728784  .015728784 shoudl be first order. 
    
                for(let i = 0; i < num_orders; i++){// add the orders to array
                    let order = {
                        'price': null,
                        'vol': null
                    }
                    let tp =  i > 0 ? 1 + (i * price_increment) : 1
                    let pi = parseFloat((tp * offerlevel).toFixed(2))
    
                    if(i == 0 && decimals < minimumvol){
                        order.price = pi.toFixed(2)
                        order.vol =(vol_f + wholevol).toFixed(8)
                    }else{
                        order.price = pi.toFixed(2)
                        order.vol = vol_f.toFixed(8)
                    }  
    
                    om.orders.push(order)           
                }                           
            } 
            resolve(om)    
    
        })
    }

    offerUpdate(offer){

    }

    manageOffers(offer){

    }

    async newOrder(qty, price, side){  
        let uid = randomBytes(10).toString('hex')
        console.log(id)                
        let order = await this.rest.newOrder(this.symbol, qty, price, side, uid)
        return order
    }

    async cancelOrder(orderID){
        let order = await this.rest.cancelOrder(orderID)
        return order
    }


}