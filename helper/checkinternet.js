'use strict'
const dns = require('dns')



/**
 * 
 * @param {*} cb call bacck function that returns true or false 
 * @param {*} url url to check, if none defaults to google.com
 */
function checkInternet(cb, url = 'google.com') {
   
    dns.lookup(url, function (err) {
        if (err && err.code == "ENOTFOUND") {
            cb(false);
        } else {
            cb(true);
        }
    })
};

module.exports = {
    checkInternet
}