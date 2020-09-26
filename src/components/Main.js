
import React, {useState, useEffect} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Route } from "react-router-dom";
import Exchanges from "./exchanges/Exchanges"


import AllMarkets from './markets/AllMarkets'
import MarketDetail from './markets/MarketDetail'



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



export default function Main(props){
  const classes = useStyles();      
  const [exchanges, setExchanges] = useState(props.exchanges)
  const [data, setData] = useState(props.data)
 
  useEffect(() => {    
    setExchanges(props.exchanges)    
  }, [props.exchanges])

  useEffect(() => {
    setData(props.data)
  }, [props.data])


  return(
      
    <main className={classes.content}>
      <div className={classes.main} />
      <Route exact path="/exchanges" render={props => <Exchanges {...props} exchanges={exchanges}/>} />
      <Route exact path="/markets/:id" render={props => <AllMarkets {...props} data={data} />} />
      <Route exact path="/markets/:exchange/:market" render={props => <MarketDetail {...props} data={data} />} />
        
    </main>
    
  )
}