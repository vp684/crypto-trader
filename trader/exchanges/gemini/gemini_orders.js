const Settings = require('./gemini_settings')

module.exports = class Orders{
    constructor(db){
        this.bidModel
        this.askModel
        this.bids
        this.asks

        this.settings = new Settings(db)

    }

    createBidModel(topofbook, position, stats){
        return new Promise((resolve, reject)=>{
            let market = position.market  
            let bm = {
                'market': market, 
                'orders': [], // {price: '' , vol: ''}
                'side': 'bids'
            }
            let cfg = this.settings.getSettings()
            
            position.tradeable = cfg[market].tradeable
            let traded = position.equity
            let tradeable = position.tradeable
            if(traded > tradeable){ //  over traded send empty bidmodel
                resolve(bm)     
                return   
            }
                                              
            let num_bids = cfg[market].num_entries
            let dflt_bidspace // amount to stagger bids if more than one
            let round = 2 //  need to round to different amount if trading cross pairs.
          
            let bid = topofbook.bid[0].price                      
            let statlevel = stats.strategy.bidlevel        
           
            let bandpercent                                                              
            let vol = cfg[market].default.min_bid_vol
            bandpercent = cfg[market].bandpercent
            let singlevalue  = bid * vol//  $4000 * 0.01 = $40.00    
    
                
            let adjust = parseFloat((statlevel * bandpercent).toFixed(round));
            let bidlevel = parseFloat((statlevel - adjust).toFixed(round));
            
            let lastbuypercent = 1 + cfg[market].lastbuy_pct
    
            if(position.price > 0 && bidlevel > (position.price * lastbuypercent)){
               // let adj = 0.0001 * position.lastbuy >= 0.02 ? (1 - 0.0001): (1 - ( 0.02 / position.lastbuy))        
                
                let bl = (position.price * lastbuypercent)
              
               bl = bl - (bl * bandpercent)
                bidlevel = parseFloat(bl.toFixed(round))                 
            }            
            
                            
            if(bidlevel > bid){ // adjust bidlevel to best bid if its less then level.
                bidlevel = parseFloat((bid - (bid * bandpercent)).toFixed(round));
            };
    
            // bm = {
            //     'market': market, 
            //     'orders': [],
            //     'side': 'bids'
            // }
            dflt_bidspace = cfg[market].entry_spacing //space otu bid orders by this percentage
    
            dflt_bidspace =  bidlevel * dflt_bidspace >= 0.01 ? (1 - dflt_bidspace) : (1 - (0.01 / bidlevel)) //  add 1- so we can jsut multiply buy bidlevl to reduce by prvious line amount
    
            if(num_bids > 0){
                let remaining = traded < tradeable ? (tradeable - traded): 0 //  
                let totalvol = num_bids * vol // total vol value of bids
                let totvalue = bidlevel * totalvol //  total dolalr value of bids 
                num_bids = remaining > totvalue ? num_bids : 0
    
            }
        
            
    
            
            for(let i = 0; i < num_bids; i++){
                if( i > 0){ //  lower bidlevle for mutliple entries
                    bidlevel = parseFloat(bm.orders[bm.orders.length -1].price)
                    bidlevel *= dflt_bidspace
                }
                          
                let ro = {
                    'price': bidlevel.toFixed(2),
                    'vol': vol.toString()
                }   
                    
                bm.orders.push(ro)
            }
    
            resolve(bm)
        })
    };

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