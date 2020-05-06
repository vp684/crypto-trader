const ob = require('./gemini_orderbook')

class OrderbookManager {
    constructor(symbol){
        this.symbol = symbol 
        this.book = new ob(symbol)
        this.buffer = []
        this.syncing = false
        this.l_updated = null

    }
    getState(){
        return this.book.state()
    }

    sync(data){    
        console.log('sync start', this.symbol)    
        this.syncing = true       
        this.l_updated = data.socket_sequence
        this.buffer = []
        this.book = new ob(this.symbol)
        this.initBook(data)                   

    }
  
    async initBook(data){
        // first sync        
        //create bids and asks for intial book state

        // delta:"990000"
        // price:"0.00001"
        // reason:"initial"
        // remaining:"990000"
        // side:"bid"
        // type:"change"

        let _books = {
            bids: [], 
            asks: []
        }

        data.events.forEach(item =>{
            let order = [item.price, item.size]     
            if(item.side === 'bid'){
                _books.bids.push(order)
            }else{
                _books.asks.push(order)
            }

        })



        await this.book.state(_books)
        this.syncing = false
        this.buffer.forEach(this.onMessage, this);
        console.log('sync_complete', this.symbol)  
    }    
    

    onMessage(data){     

        if (data.socket_sequence === 0) {
            // Start first sync
            this.sync(data);
            return;
        } 
        
        if (this.syncing === true && data.socket_sequence > 0){
            this.buffer.push(data)
            return
        }           
                                             
        if(this.syncing === false && data.socket_sequence > this.l_updated){
            this.l_updated = data.socket_sequence    

            this.book.update(data)
        }
    

    }

}

module.exports = OrderbookManager