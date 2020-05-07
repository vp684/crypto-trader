
import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Route } from "react-router-dom";
import Exchanges from "./exchanges/Exchanges"
import io from 'socket.io-client'
import AllMarkets from './markets/AllMarkets'


const useStyles = makeStyles((theme) => ({
  main: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
   
}));

const socket = io('http://localhost:8000')

export default function Main(){
    
    useEffect( () => {
      socket.on('connect', function(){
        console.log('client socket connect')
        
      })
     
    }, [])

    const classes = useStyles();
    return(
       
        <main className={classes.content}>
            <div className={classes.main} />
            <Route exact path="/exchanges" render={props => <Exchanges {...props} />} />
            <Route path="/markets/:id" render={props => <AllMarkets {...props}/>} />
        </main>
      
    )
}