const aedes = require('aedes')()
const mqttbroker = require('net').createServer(aedes.handle)
const mqttport = 1883

mqttbroker.listen(mqttport, function () {
    console.log('MQTT Serice started on port', mqttport)
});