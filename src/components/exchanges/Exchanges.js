
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Route } from "react-router-dom";
import ExchangeCard from "./ExchangeCard"



const useStyles = makeStyles((theme) => ({
  main: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2, 1),

    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
   
}));

export default function Exchanges(){
    const classes = useStyles();
    return(
       
        <div >          
            <ExchangeCard name="Gemini"/>           
        </div>
      
    )
}