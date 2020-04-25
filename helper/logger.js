//const winston = require('winston')
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

var fs = require('fs')
var logDir = 'logs'
var env = process.env.NODE_ENV || 'development'


//winston.setLevels(winston.config.npm.levels)
//winston.addColors(winston.config.npm.colors)
//winston.emitErrs = true

if(!fs.existsSync(logDir)){
    fs.mkdirSync(logDir)
}
const logger = createLogger({
    format: combine(    
        timestamp(),
        prettyPrint()
    ),
    transports: [
        new transports.Console({
            level: 'info',
            colorize: true, 
            handleExceptions: true, 
            json: false
        }),
        new transports.File({
            level: 'info',
            filename: logDir + '/info.log',
            maxsize: 1024 * 1024 * 5 // 20MB
        }), 
        new transports.File({
            level: 'error',
            filename: logDir + '/error.log',
            maxsize: 1024 * 1024 * 5 // 20MB
        }), 
        new transports.File({
            level: 'debug',
            filename: logDir + '/debug.log',
            maxsize: 1024 * 1024 * 5 // 20MB
        }), 
        new transports.File({
            level: 'warn',
            filename: logDir + '/warn.log',
            maxsize: 1024 * 1024 * 5 // 20MB
        }), 

    ],
    exceptionHandlers: [
        new transports.File({
            filename: logDir + '/exceptions.log'
        })
    ],
    exitOnError: false
});

module.exports = logger