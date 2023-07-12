const pm2 = require('pm2');

const app = async function() {
    pm2.connect(async function(err) {
            if (err) {
                console.error(err)
                process.exit(2)
            }

            const discardService = function(name) {
                return new Promise(function(resolve,reject) {
                    pm2.stop(name,function(err,apps) {
                        pm2.delete(name,function(err,apps) {
                            resolve();
                        })
                    })
                });
            }

            const retrievePSList = async function() {
                return new Promise(function(resolve,reject) {
                    pm2.list(function(x,y,z) { 
                        resolve(y);
                    });
                });
            }

            let y = await retrievePSList(); 
            for(let i=0;i<y.length;i++) {
                await discardService(y[i].name);
            }

            pm2.killDaemon(function(a,b) {
                pm2.disconnect();
                process.exit(0);
            })
                
    });

}

app();
