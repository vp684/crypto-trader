
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Route } from "react-router-dom";
import Exchanges from "./exchanges/Exchanges"


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

export default function Main(){
    const classes = useStyles();
    return(
       
        <main className={classes.content}>
            <div className={classes.main} />
            <Route exact path="/exchanges" render={props => <Exchanges {...props} />} />

        </main>
      
    )
}