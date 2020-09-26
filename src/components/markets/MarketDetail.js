import React, { useState, useEffect } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import MarketSettings from './MarketSettings'
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
    
  root: {
    minWidth: 100,
    maxWidth: 350, 
    margin: 10
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
  
});

export default function MarketDetail(props) {

  const classes = useStyles();  
  const [data, setData] = useState()
  const market = props.match.params.market.toUpperCase()
  const exchange = props.match.params.exchange
  useEffect(() => {
    if(props.data.length > 0){
      let final = props.data.filter(item => item.symbol === market)[0]
      setData(final.data)  
    }

  }, [props, market])

  
    return (
        <div>
        
          <Typography>{market}</Typography>
          

          { data && 
            <Card className={classes.root}>
              <CardContent>                            
                  <Typography variant="body2" component="p">Ask: {data.book.ask}  Vol: {data.book.ask_vol} </Typography>
                  <Typography variant="body2" component="p">Bid: {data.book.bid} Vol: {data.book.bid_vol} </Typography>
                  <Typography variant="body2" component="p">Time: {data.book.time} </Typography>
                  <Typography variant="body2" component="p">Position: {data.pos.exchange_qty} </Typography>
                  <Typography variant="body2" component="p">Average Price: {data.pos.total_avg_price} </Typography>
                  <Typography variant="body2" component="p">Equity: ${data.pos.equity} </Typography>

                  
              </CardContent>              
            </Card>
          }

          <MarketSettings market={market} exchange={exchange} />
           
        </div>
    )
}
