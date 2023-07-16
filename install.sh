#!/bin/bash

echo "Installing Corrently Edge"
echo "========================================="
echo "Checking Dependencies ..."

CROSS='\033[1;31m\u2718\033[0m'
TICK='\033[1;32m\u2714\033[0m'

function HAS_NODE {
    if [ -x "$(command -v node)" ]; then return 0; else return 1; fi
}
function HAS_NPM {
    if [ -x "$(command -v npm)" ]; then return 0; else return 1; fi
}

if HAS_NODE && HAS_NPM; then
    : # node and npm is installed, we can continue :)
else
    if HAS_NODE; then :; else echo -en "\b$CROSS   MISSING: nodejs\r\n"; fi
    if HAS_NPM; then :; else echo -en "\b$CROSS   MISSING: npm\r\n"; fi
        echo -e "You can install nodejs and npm manually then run the script again to continue.\r\n\r\n"
        exit 2
fi

node_version=$(node -v)

major_version=$(echo "$node_version" | cut -d. -f1)
major_version=${major_version#v}

required_major_version=15
required_minor_version=0

if [[ $major_version -ge $required_major_version ]]; then
    echo -en "\b$TICK node version: $(node --version)\r\n"
    echo -en "\b$TICK npm version: $(npm --version)\r\n"
else
    echo -en "\b$CROSS Please Install Node JS (>=v$required_major_version.0.0) and NPM (>=7.0.0)\r\n"
    exit 2
fi

if command -v curl &>/dev/null; then
    echo -en "\b$TICK curl installed\r\n"
  else
    echo -en "\b$CROSS   MISSING: curl\r\n"; 
    echo -e "You can install curl manually then run the script again to continue.\r\n\r\n"
    exit 2
fi

echo "Preparing Setup ..."

npm install -g pm2 

if [ ! -d "/opt/corrently-edge" ]; then
    echo -en "\b$TICK Destination folder /opt/corrently-edge available\r\n"
    mkdir -p /opt/corrently-edge
    mkdir /opt/corrently-edge/runtime
    if [ ! -d "/opt/corrently-edge" ]; then
      echo -en "\b$CROSS   Create install folder /opt/corrently-edge\r\n";
      echo -e "Check permissions and run the script again to continue.\r\n\r\n"
      exit 2
    fi
    cd /opt/corrently-edge/runtime
else
    echo -en "\b$CROSS  folder /opt/corrently-edge exists \r\n"; 
     echo -e "Remove the folder manually then run the script again to continue.\r\n\r\n"
    exit 2
fi

echo "Download latest release ..."
release_info=$(curl -s "https://api.github.com/repos/energychain/corrently-edge/releases/latest")
download_url=$(echo "$release_info" | grep "tarball_url.*$filename" | cut -d '"' -f 4)
curl -LJO "$download_url" -o "edge.tgz"

release_info=$(curl -s "https://api.github.com/repos/energychain/corrently-current/releases/latest")
download_url=$(echo "$release_info" | grep "tarball_url.*$filename" | cut -d '"' -f 4)
curl -LJO "$download_url" -o "current.tgz"

echo "Extracting ..."

mkdir /opt/corrently-edge/runtime/unpacked
for files in *.gz; do
    # Entpacke die TAR-Datei ins Zielverzeichnis
    tar -xzxvf "$files" -C "/opt/corrently-edge/runtime/unpacked"
    rm $files
done

cd /opt/corrently-edge/runtime/unpacked
mv energychain-corrently-curren*/* energychain-corrently-edge-*/corrently-current
mv energychain-corrently-edge-*/* /opt/corrently-edge/

cd /opt/corrently-edge/corrently-current
npm install

cd /opt/corrently-edge/
npm install

npm run start
echo -en "\r\n\r\n"
echo -en  "$TICK Corrently Edge has been installed.\r\n\r\n"
echo "Starting: cd /opt/corrently-edge/ && npm run start"
echo "Stoping: cd /opt/corrently-edge/ && npm run stop"
echo -en "\r\n\r\n"
echo "You might use pm2 to autostart Corrently Edge on boot."
echo -en "\r\n\r\n"

ip_address=$(hostname -I | awk '{print $1}')
echo "Connect Corrently Current UI to Edge via http://$ip_address:1880/edge.html?detectEdge=true"
