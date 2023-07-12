
const http = require('http');
const express = require("express");
const RED = require("node-red");

const fs = require('fs');

process.chdir(__dirname);

var nrapp = express();
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

// Serve the editor UI from /red
nrapp.use(mainsettings.httpAdminRoot,RED.httpAdmin);

// Serve the http nodes UI from /api
nrapp.use(mainsettings.httpNodeRoot,RED.httpNode);

nrserver.listen(1880);

RED.start();
