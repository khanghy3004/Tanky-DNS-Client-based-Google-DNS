const connectBtn = document.getElementById("startstop")
const doh = document.getElementById("doh");
const exec = require('child_process').exec;
const cp = require('child_process');
const path = require('path')
const tool = require('./tools.js');

const ipLocal = tool.getIPAddress();

// Used for executing shell commands
function execute(command, callback) {
  exec(command, (error, stdout, stderr) => {
    callback(stdout);
  });
};

var connectionStatusInfo = document.getElementById("connection-status");
var connectionDetailsInfo = document.getElementById("connection-details");
var connectionDNSInfo = document.getElementById("connection-dns");
var connectionTimeInfo = document.getElementById("connection-time");
var dnsServer = "8.8.8.8";
var started = false;


function dnsSetON() {
  document.getElementById("startstop").checked = true;
  connectionStatusInfo.innerHTML = "CONNECTED";
  connectionStatusInfo.classList = "sub-text connected yes";
  connectionDetailsInfo.innerHTML = "Your DNS queries are now <b>private</b> and <b>faster</b>.";
  connectionDNSInfo.innerHTML = "DNS Server: " + dnsServer;
  connectionTimeInfo.innerHTML = "Query time: Loading";
  execute('powershell "Measure-Command { nslookup www.google.com 2> $null }" | FINDSTR "^TotalMilliseconds"', (output) => {
    var time = tool.getQueryTime(output);
    connectionTimeInfo.innerHTML = "Query time: " + time;
  });
}

function dnsSetOFF() {
  document.getElementById("startstop").checked = false;
  connectionStatusInfo.innerHTML = "DISCONNECTED";
  connectionStatusInfo.classList = "sub-text connected no";
  connectionDetailsInfo.innerHTML = "Your DNS queries are <b>not private</b>.";
  connectionDNSInfo.innerHTML = "DNS Server: Loading";
  connectionTimeInfo.innerHTML = "Query time: Loading";
  execute('ipconfig /all | FINDSTR /C:"DNS Servers"', (output) => {
    var dns = tool.getDNS(output);
    connectionDNSInfo.innerHTML = "DNS Server: " + dns;
  });
  execute('powershell "Measure-Command { nslookup www.google.com 2> $null }" | FINDSTR "^TotalMilliseconds"', (output) => {
    var time = tool.getQueryTime(output);
    connectionTimeInfo.innerHTML = "Query time: " + time;
  });
}

require('electron').ipcRenderer.on('dnsSetONinit', (event, message) => {
  if (message.dohEnabled) {
    document.getElementById("doh").checked = true;
    cp.fork(path.join(__dirname, 'doh-server/index.js'))
  }
  dnsServer = message.dnsServer;
  dnsSetON();
})
require('electron').ipcRenderer.on('dnsSetOFFinit', (event, message) => {
  if (message.dohEnabled) {
    document.getElementById("doh").checked = true;
    cp.fork(path.join(__dirname, 'doh-server/index.js'))
  }
  dnsServer = message.dnsServer;
  dnsSetOFF();
})

// call the function
doh.addEventListener('click', function (event) {
  var dohCheck = document.getElementById("doh").checked;
  if (dohCheck) {
    tool.writeData("dohEnabled", true);
    dnsServer = ipLocal;
    if (!started) {
      cp.fork(path.join(__dirname, 'doh-server/index.js'))
      started = true;
    }
  } else {
    tool.writeData("dohEnabled", false);
    dnsServer = "8.8.8.8";
  }
});

// call the function
connectBtn.addEventListener('click', function (event) {
  var checked = document.getElementById("startstop").checked;
  if (checked) {
    // Enabling new DNS
    execute('wmic nicconfig where (IPEnabled=TRUE) call SetDNSServerSearchOrder ("'+ dnsServer +'")', (output) => {
      if (output.indexOf("ReturnValue = 0") > -1) {
        dnsSetON();
        console.log('on')
      }
      if (output.indexOf("ReturnValue = 91") > -1) {
        dnsSetOFF();
        console.log('off')
      }
    });
  } else {
    // Resetting DNS values back to default
    execute('wmic nicconfig where (IPEnabled=TRUE) call SetDNSServerSearchOrder ()', (output) => {
      if (output.indexOf("ReturnValue = 0") > -1) {
        dnsSetOFF();
        console.log('off')
      }
      if (output.indexOf("ReturnValue = 91") > -1) {
        dnsSetON();
        console.log('on')
      }
    });
  }
});
