const mqtt = require('mqtt');

const mqttedge = mqtt.connect("mqtt://localhost:"+mqttport);
let  mqttbridge = null;

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
        } else {
            if(mqttbridge !== null) {
                if(_connectionOptions !== null) {
                    payload = payload.toString();
                    if (_connectionOptions.basePath.endsWith("#")) {
                        _connectionOptions.basePath = _connectionOptions.basePath.slice(0, -1);
                      }
                    if(typeof _connectionOptions.basePath !== 'undefined') {
                        topic = _connectionOptions.basePath + topic;
                    }
                    mqttbridge.publish(topic, payload);
                }
            }
        } 
    });
    
    if(fs.existsSync("./runtime/bridge.json")) {
        _connectionOptions = JSON.parse(fs.readFileSync("./runtime/bridge.json"));
        connectBridge(_connectionOptions);
    }
    
});