# corrently-edge
Edge Server for small systems (like RPi)

- starts local mqtt broker
- activates edge middleware for corrently-current
- fires up web ui (corrently-current) with preconfigured data-source on edge.
- setup for edge to cloud connectivity


## Usage
```
node index.js
```

Point browser to: http://localhost:1880/?middleware=edge
