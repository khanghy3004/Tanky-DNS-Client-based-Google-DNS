const path = require('path');
const fs = require('fs');
const electron = require('electron');
const dataPath = (electron.app || electron.remote.app).getPath('userData');
const filePath = path.join(dataPath, 'config.json');

module.exports.writeData = (key, value) => {
    let contents = parseData()
    contents[key] = value;
    fs.writeFileSync(filePath, JSON.stringify(contents));
}

module.exports.readData = (key) => {
    let contents = parseData()
    return contents[key]
}

function parseData() {
    const defaultData = {}
    try {
        return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
        return defaultData;
    }
}

module.exports.getIPAddress = () => {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
                return alias.address;
        }
    }
    return '0.0.0.0';
}

module.exports.getDNS = (output) => {
    var dns_server = output.split(":")[1].trim();
    return dns_server;
}

module.exports.getQueryTime = (output) => {
    var time = parseFloat(output.split(":")[1].trim()).toFixed();
    if (time > 2000) {
        time = "Request timed out";
    } else {
        time = time + " ms";
    }
    return time;
}