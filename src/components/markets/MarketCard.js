
import React, { useState, useEffect } from 'react';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
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
  
    toggle: {
        backgroundColor: 'Red'
    }
  });


export default function Markets(props){
    const classes = useStyles();  
    const markets = props.data     
    const data = markets.data
    
   return (   
        <>                   
          <Card className={classes.root}>
              <CardContent>     
                  <Typography variant="h5" component="h2">
                      {markets.symbol.toUpperCase()}
                  </Typography>       
                  <Typography variant="body2" component="p">Ask:{data.ask}  Vol: {data.ask_vol} </Typography>
                  <Typography variant="body2" component="p">Bid: {data.bid} Vol:{data.bid_vol} </Typography>
                  <Typography variant="body2" component="p">Time: {data.time} </Typography>
              </CardContent>
              <CardActions>                    
                  
              </CardActions>
          </Card>
                        
        </>
        
    )
             
}