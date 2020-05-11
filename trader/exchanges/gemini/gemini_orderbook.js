const { RBTree } = require('bintrees');
const BigNumber = require('bignumber.js');
const assert = require('assert');

class Orderbook {
    constructor(symbol){
        this.symbol = symbol
        this.lastupdate = null
        this.bids = new RBTree((a, b) => a.price.comparedTo(b.price))
        this.asks = new RBTree((a, b) => a.price.comparedTo(b.price))
        
    }

    _getTree(side) {
        return side === 'ask' ? this.asks : this.bids;
    }

    state(book) {
        //supply book to state to instantiate from snapshot
        return new Promise((resolve, reject) => {
            if (book) {            
                book.bids.forEach(order =>
                    this.add({                           
                        side: 'bid',
                        price: BigNumber(order.price),
                        size: BigNumber(order.size),
                        time: order.time
                    })
                );
    
                book.asks.forEach(order =>
                    this.add({                                     
                        side: 'ask',
                        price: BigNumber(order.price),
                        size: BigNumber(order.size),
                        time: order.time
                    })
                );
                resolve(true)
             
            } else {
                book = { asks: [], bids: [], ready:false, time: this.lastupdate };
    
                this.bids.reach(bid => book.bids.push(bid));
                this.asks.each(ask => book.asks.push(ask));

                if(book.asks.length > 0 && book.bids.length > 0){
                    book.ready = true
                }
                resolve(book);
            } 
        })
       
    }


    update(data){

        // delta:"3981.111652"
        // price:"1.01582"
        // reason:"place"
        // remaining:"3981.111652"
        // side:"ask"
        // type:"change"
        this.lastupdate = data.time
        data.events.forEach(order =>{
            let change_order = {
                side: order.side, 
                price: BigNumber(order.price), 
                size: BigNumber(order.remaining),  
                time: data.time    

            }

            if(change_order.size.isEqualTo(0)){
                this.remove(change_order)
            }else{
                this.add(change_order)
            }
        })
         
    }

    add(order) {
 
        const tree = this._getTree(order.side);
        let node = tree.find({ price: order.price });

        if (!node) {
            node = order
            // {
            //     price: order.price,
            //     size: order.size,   
            //     side:order.side             
            // };

            tree.insert(node);
        }

        node = order

    }
    
    remove(order) {

        const tree = this._getTree(order.side);
        const node = tree.find({ price: order.price });

        if(node){
            tree.remove(node);
        }               
        
    }
        
}

module.exports = Orderbook