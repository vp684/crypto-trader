import React, { useState, useEffect } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
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

  btn : {
      backgroundColor: "grey",
      margin: "5px"
  },

  input : {
      margin : '5px'
  }
  
});

export default function MarketSettings(props) {
    const market = props.market
    const exchange = props.exchange
    const [config, setConfig] = useState()

    const updateValue = (name, e) => {

        let cfg = {...config}
        if(name === 'profit_percent'){
            cfg.strategy.strategy[name] = Number(e.target.value)
        }else{
            cfg[name] = Number(e.target.value)
        }

        setConfig(cfg)
    }

    const updateConfig = async () => {
        const response = await fetch('/set-config', {
            method:'POST', 
            headers:{
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify({ex: exchange, market: market, config: config})
        });
        const body = await response.json();
        
        if (response.status !== 200) {
          throw Error(body.message) 
        }
           
        return

    }

    async function fetchConfig(){
        const response = await fetch('/get-config', {
            method:'POST', 
            headers:{
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify({ex:'gemini', market: market})
        });
        const body = await response.json();
        
        if (response.status !== 200) {
          throw Error(body.message) 
        }
        setConfig(body)
        console.log(body)
        return
    }


    useEffect(() => {                     
        fetchConfig()             
    }, [])



    const classes = useStyles()
    return (
        <div>
           <Card className={classes.root}>
               <CardContent>

                    { config &&
                    <div>
                    <TextField
                        className={classes.input}
                        id="outlined-number"
                        label="Tradeable"
                        value={config.tradeable}
                        onChange={(e)=> {updateValue('tradeable', e)}}
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        size="small"
                    />
                           
                    <TextField
                        className={classes.input}
                        id="outlined-number"
                        label="Bid Value"
                        value={config.bid_value}
                        onChange={(e)=> {updateValue('bid_value', e)}}
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        size="small"
                    />
                    
                    <TextField
                        className={classes.input}
                        id="outlined-number"
                        label="Number of Entries"
                        value={config.num_entries}
                        onChange={(e)=> {updateValue('num_entries', e)}}
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        size="small"
                    />    
                                  
                    <TextField
                        className={classes.input}
                        id="outlined-number"
                        label="Number of Exits"
                        value={config.num_exits}
                        onChange={(e)=> {updateValue('num_exits', e)}}
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        size="small"
                    />
                    
                    <TextField
                        className={classes.input}
                        id="outlined-number"
                        label="Entry Spacing"
                        value={config.entry_spacing}
                        onChange={(e)=> {updateValue('entry_spacing', e)}}
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        size="small"
                    /> 
                     
                    <TextField
                        className={classes.input}
                        id="outlined-number"
                        label="Exit Spacing"
                        value={config.exit_spacing}
                        onChange={(e)=> {updateValue('exit_spacing', e)}}
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        size="small"
                    />
                    
                    <TextField
                        className={classes.input}
                        id="outlined-number"
                        label="Profit Percent"
                        value={config.strategy.strategy.profit_percent}
                        onChange={(e)=> {updateValue('profit_percent', e)}}
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                        size="small"
                    />  
                    </div>
                    }                 
                    <Button className={classes.btn} onClick={updateConfig}>Apply Settings</Button>
                
               </CardContent>
           </Card>
        </div>
    )
}
