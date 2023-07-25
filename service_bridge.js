const mqtt = require('mqtt');
const fs = require("fs");

const mqttport = 1883;

const mqttedge = mqtt.connect("mqtt://localhost:"+mqttport);
let  mqttbridge = null;
let cache = {};

mqttedge.on('connect', function () {
    let __connectionOptions = null;

    /**
     * Connects the bridge using the specified connection options.
     *
     * @param {_connectionOptions} _connectionOptions - The connection options for the bridge.
     */
    const connectBridge = function(_connectionOptions) {
        mqttbridge = mqtt.connect(_connectionOptions);
        mqttedge.subscribe("#",function() {});
    }

    mqttedge.subscribe("corrently/mqtt/connect",function(err,msg2) {
    })
    mqttedge.on('message', (topic, payload) => {
        if(topic == "corrently/mqtt/connect") {
            // Request to connect to a bridge with given configuration
            _connectionOptions = JSON.parse(payload.toString());
            fs.writeFileSync("./runtime/bridge.json",JSON.stringify(_connectionOptions));
            connectBridge(_connectionOptions);
            const pm2 = require('pm2');
            pm2.connect(async function(err) {
                console.log("Restarting Bridge");
                pm2.restart('bridge',function(err,apps) {
                });
            });

        } else if(topic == "corrently/mqtt/disconnect") {
            fs.unlink("./runtime/bridge.json");
            const pm2 = require('pm2');
            pm2.connect(async function(err) {
                console.log("Restarting Bridge");
                pm2.restart('bridge',function(err,apps) {
                });
            });
        } else if(mqttbridge !== null) {
                if((_connectionOptions !== null) && (_connectionOptions.enabled !== 'false')) {
                    payload = payload.toString();
                    if (_connectionOptions.basePath.endsWith("#")) {
                        _connectionOptions.basePath = _connectionOptions.basePath.slice(0, -1);
                    }
                    if(typeof _connectionOptions.basePath !== 'undefined') {
                        topic = _connectionOptions.basePath + topic;
                    }
                    // Throttle to 1 message per 10 seconds & topic
                    if((typeof cache[topic] == 'undefined')||(cache[topic] < new Date().getTime() - 10000)) {
                        cache[topic] = new Date().getTime();
                        mqttbridge.publish(topic, payload);
                    }                    
                }
            }
    });
    
    if(fs.existsSync("./runtime/bridge.json")) {
        _connectionOptions = JSON.parse(fs.readFileSync("./runtime/bridge.json"));
        if(typeof _connectionOptions.payload !== 'undefined') {
            _connectionOptions = _connectionOptions.payload;
        }
        connectBridge(_connectionOptions);
    }
    
});