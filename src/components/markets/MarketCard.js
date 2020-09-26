
import React from 'react';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';

import { useHistory } from "react-router-dom";

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


export default function Markets(props){
    const classes = useStyles();  
    let history = useHistory()
    const markets = props.data     
    const data = markets.data
    const exchange = props.exchange
       
    const handleUrl = (mrkName) =>{
      let market = mrkName.toLowerCase()
      let link = `/markets/${exchange}/${market}`
      history.push(link)
    }
    
   return (   
        <>                   
          <Card className={classes.root}>
              <CardContent>     
                  <Typography variant="h5" component="h2">
                      {markets.symbol.toUpperCase()}
                  </Typography>       
                  <Typography variant="body2" component="p">Ask:{data.book.ask}  Vol: {data.book.ask_vol} </Typography>
                  <Typography variant="body2" component="p">Bid: {data.book.bid} Vol:{data.book.bid_vol} </Typography>
                  <Typography variant="body2" component="p">Time: {data.book.time} </Typography>
                  <Typography variant="body2" component="p">Position: {data.pos.total_quantity} </Typography>
                  
              </CardContent>
              <CardActions>                    
                <Button size='small' onClick={() =>{handleUrl(markets.symbol)}}>Details</Button>
              </CardActions>
          </Card>
                        
        </>
        
    )
             
}