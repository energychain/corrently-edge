const pm2 = require('pm2');

const app = async function() {
   /*
    pm2.killDaemon(function(a,b) {
        console.log('Killer',b);
    })
*/
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

            const startService = function(conf) {
                return new Promise(function(resolve,reject) {
                    pm2.start(conf, (err, apps) => {
                        console.log("Started Service",conf.name);
                        if (err) { reject(err) } else {
                            resolve();
                        }
                    })
                });
            }

            setTimeout(async function() {
                console.log("Starting Services");
                let l=0;

                await startService ({
                    script: 'service_mqtt.js',
                    name:'mqtt'
                });

                await startService ({
                    script: 'service_nodered.js',
                    name:'nodered'
                });

                await startService ({
                    script: 'service_bridge.js',
                    name:'bridge'
                });

                await startService ({
                    script: './corrently-current/main.js',
                    name:'middleware'
                });
  
                await startService ({
                    script: 'service_edge.js',
                    name:'edgemanager'
                });

                console.log("Disconnect");
                pm2.disconnect();
                process.exit(0);
            },1000);
    });

}

app();
