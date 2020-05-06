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
        return side === 'sell' ? this.asks : this.bids;
    }

    state(book) {
        //supply book to state to instantiate from snapshot
        return new Promise((resolve, reject) => {
            if (book) {            
                book.bids.forEach(order =>
                    this.add({                           
                        side: 'buy',
                        price: BigNumber(order[0]),
                        size: BigNumber(order[1]),
                    })
                );
    
                book.asks.forEach(order =>
                    this.add({                                     
                        side: 'sell',
                        price: BigNumber(order[0]),
                        size: BigNumber(order[1]),
                    })
                );
                resolve(true)
             
            } else {
                book = { asks: [], bids: [] };
    
                this.bids.reach(bid => book.bids.push(bid));
                this.asks.each(ask => book.asks.push(ask));

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

        data.events.forEach(order =>{
            let change_order = {
                side: order.side, 
                price: BigNumber(order.price), 
                size: BigNumber(order.size)

            }

            if(change_order.size.isEqualTo(0)){
                this.remove(change_order)
            }else{
                this.add(change_order)
            }
        })
         
    }

    add(order) {
        order = {
            side: order.side,
            price: BigNumber(order.price),
            size: BigNumber(order.size),
        };

        const tree = this._getTree(order.side);
        let node = tree.find({ price: order.price });

        if (!node) {
            node = {
                price: order.price,
                order: order,
            };

            tree.insert(node);
        }

        node.order = order

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