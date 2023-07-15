const mqtt = require('mqtt');
const fs = require("fs");
const axios = require("axios");

const mqttport = 1883;

const mqttedge = mqtt.connect("mqtt://localhost:"+mqttport);
let  mqttbridge = null;

mqttedge.on('connect', function () {


    mqttedge.subscribe("corrently/edge/#",function(err,msg2) {

    })
    mqttedge.on('message', async (topic, payload) => {
        if(topic == "corrently/edge/nodered/retrieve") {
            let data = await axios.get(" http://localhost:1880/red/diagnostics");
            mqttedge.publish("corrently/edge/nodered/result",JSON.stringify(data.data));
        } 
        if(topic == "corrently/edge/nr-node-install/set") {
           payload = payload.toString();
            let data = await axios.post("http://localhost:1880/red/nodes",
            {
                "module":payload
            });
            mqttedge.publish("corrently/edge/nr-node-install/get",JSON.stringify(data.data));
        } 
        if(topic == "corrently/edge/nr-flow/set") {
            const flows = await axios.get("http://localhost:1880/red/flows");
            mqttedge.publish("corrently/edge/nr-flow/get",JSON.stringify(flows.data));
        }
        if(topic == "corrently/edge/nr-add-flow/set") {
            const edgeflow = JSON.parse(payload.toString());
            
            if(typeof edgeflow.modules !== 'undefined') {
                for(let i=0;i<edgeflow.modules.length;i++) {
                    try {
                        await axios.post("http://localhost:1880/red/nodes",
                        {
                            "module":edgeflow.modules[i]
                        });
                    } catch(e) {
                        // Module Installation will fail if module already exists in package.json
                    }
                }
            }

            let nnodes = [];
            let nconfigs  = [];
            
            let tabs = [];

            // find all Tab IDs
            for(let i=0;i<edgeflow.flow.length;i++) {
                if(edgeflow.flow[i].type == 'tab') {
                    tabs.push(edgeflow.flow[i].id);
                }
            }

            // assign all nodes to nnodes where we have a tab (only work with single tab at the moment!)
            for(let i=0;i<edgeflow.flow.length;i++) {
                if(edgeflow.flow[i].z == tabs[0]) {
                    nnodes.push(edgeflow.flow[i]);
                } else {
                    if(edgeflow.flow[i].id !== tabs[0]) {
                        // Must be config node
                        nconfigs.push(edgeflow.flow[i])
                    }
                }
            }
            try {
                await axios.post("http://localhost:1880/red/flow",
                {
                    "label": edgeflow.label,
                    "nodes": nnodes,
                    "configs": nconfigs
                });
                mqttedge.publish("corrently/edge/nr-add-flow/get","done");
            } catch(e) {
                if(e.response.data.message == 'duplicate id') {
                    // We might fix this using new IDs 
                }
                console.log(e.response.data);
            }
        }
        if(topic == "corrently/edge/services/retrieve") {
            const pm2 = require('pm2');
            pm2.connect(async function(err) {
                const retrievePSList = async function() {
                    return new Promise(function(resolve,reject) {
                        pm2.list(function(x,y,z) { 
                            resolve(y);
                        });
                    });
                }
    
                let y = await retrievePSList(); 
                let services  = [];
                for(let i=0;i<y.length;i++) {
                    services.push({
                        "name":y[i].name, 
                        "state":y[i].state
                    });
                }
                mqttedge.publish("corrently/edge/services/result",JSON.stringify(services));
            });
        } 
    });
});