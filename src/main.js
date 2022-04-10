// Modules to control application life and create native browser window
const { app, BrowserWindow, Notification, Tray, Menu } = require('electron');
const path = require('path');
const exec = require('child_process').exec;
const tool = require('./tools.js');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function execute(command, callback) {
  exec(command, (error, stdout, stderr) => {
    callback(stdout);
  });
};

const ipLocal = tool.getIPAddress();

function initDNS() {
  var dohEnabled = tool.readData('dohEnabled');

  execute('ipconfig /all | FINDSTR /C:"DNS Servers"', (output) => {
    var data = {};
    data.dohEnabled = dohEnabled;
    data.dnsServer = "8.8.8.8";
    if (output.indexOf("8.8.8.8") > -1 || output.indexOf(ipLocal) > -1) {
      if (output.indexOf(ipLocal) > -1) {
        data.dnsServer = ipLocal;
      }
      mainWindow.webContents.send('dnsSetONinit', data)
    } else {
      if (dohEnabled) {
        data.dnsServer = ipLocal;
      }
      mainWindow.webContents.send('dnsSetOFFinit', data)
    }
  });
};

// In main process.
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 380,
    height: 600,
    frame: false,
    resizable: false,
    icon: path.join(__dirname, 'assets/img/icons8-tank-96.png'),
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('src/index.html')
  // Open the DevTools.
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
  function showNotification () {
    new Notification({ title: "TankyDNS", body: "App is still running" }).show()
  }

  // Emitted when the window is hide.  
  let tray = null;
  mainWindow.on('minimize', () => {
    if (tray) { return mainWindow.hide(); }
    //  tray documentation at - https://github.com/electron/electron/blob/main/docs/api/menu-item.md
    tray = new Tray(path.join(__dirname, 'assets/img/icons8-tank-96.png'));
    const template = [
      {
        label: 'Show App', click: function () {
          mainWindow.show();
        },
      },
      {
        label: 'Quit', click: function () {
          mainWindow.close();
        },
      },
    ];
    const contextMenu = Menu.buildFromTemplate(template);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('TankyDNS');
    tray.on('click', () => {
      mainWindow.show();
    });
    mainWindow.hide();
    showNotification ();
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    // Resetting DNS values back to default
    execute('wmic nicconfig where (IPEnabled=TRUE) call SetDNSServerSearchOrder ()', (output) => {
      console.log(output);
    });
  })

  mainWindow.webContents.on('dom-ready', (event, input) => {
    initDNS();
  })
}

app.setAppUserModelId('TankyDNS 1.0.0');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
