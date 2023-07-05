console.log("Corrently-Edge");

const http = require('http');
const express = require("express");
const RED = require("node-red");
const mqtt = require('mqtt');
const fs = require('fs');

// We always change into installed folder to ensure relative paths are working.
process.chdir(__dirname);

const aedes = require('aedes')()
const mqttbroker = require('net').createServer(aedes.handle)
const mqttport = 1883

mqttbroker.listen(mqttport, function () {
  console.log('server started and listening on port ', mqttport)
});


var nrapp = express();
var app = express();
nrapp.use("/",express.static("./corrently-current/views/"));

var nrserver = http.createServer(nrapp);

var mainsettings = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/api",
    userDir:__dirname+"/runtime/",
    flowFile: './runtime/flows.json',
    credentialSecret: false,
    functionGlobalContext: { }    // enables global context
  };

RED.init(nrserver,mainsettings);


var webserver = http.createServer(app);

// Serve the editor UI from /red
nrapp.use(mainsettings.httpAdminRoot,RED.httpAdmin);

// Serve the http nodes UI from /api
nrapp.use(mainsettings.httpNodeRoot,RED.httpNode);

webserver.listen(8001);
nrserver.listen(1880);

/* Init Middleware for Browser based UI */
var child_process = require('child_process');
process.chdir('./corrently-current/');
child_process.execSync('npm install',{stdio:[0,1,2]});
child_process.exec('node main.js',{stdio:[0,1,2]});
process.chdir('../');


RED.start();

/* setup for bridging (actualy a msg relay) */

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
                    _connectionOptions.basepath="/corrently";

                    if(typeof _connectionOptions.basepath !== 'undefined') {
                        topic = _connectionOptions.basepath + topic;
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
    
})