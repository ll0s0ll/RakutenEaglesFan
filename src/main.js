const { app, BrowserWindow, Menu, powerMonitor, Tray } = require('electron');
const path = require('path');

function buildMenu () {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { role: 'editMenu' }
  ];
  return Menu.buildFromTemplate(template);
}

function createWindow () {
  const bw = new BrowserWindow({
    width: 350,
    height: 450,
    useContentSize: true,
    show: false, // ready-to-show eventを発火させるために必要
    webPreferences: {
      devTools: true,
      enableRemoteModule: true,
      nodeIntegration: false,
      preload: `${__dirname}/preload.js`,
      additionalArguments: [`--argc=${process.argv.slice(2).length}`].concat(process.argv.slice(2))

    },
    frame: false,
    resizable: false,
    movable: false
  });

  bw.loadFile('src/index.html');
  if (process.argv.includes('--debug')) {
    bw.webContents.openDevTools();
  }

  // フォーカスがはずれたら、ウィンドウを隠す。
  bw.on('blur', () => {
    _browserWindow.hide();
  });

  // 起動時にウィンドウを定位置に移動させる。
  bw.on('ready-to-show', () => {
    const { x, y } = calcWindowPosition();
    _browserWindow.setPosition(x, y, true);
    _browserWindow.show();
  });

  bw.webContents.on('devtools-opened', () => {
    _browserWindow.setBounds({ width: 800 }, true);
    const { x, y } = calcWindowPosition();
    _browserWindow.setPosition(x, y, true);
  });

  bw.webContents.on('devtools-closed', () => {
    _browserWindow.setBounds({ width: 350 }, true);
    const { x, y } = calcWindowPosition();
    _browserWindow.setPosition(x, y, true);
  });

  return bw;
}

function createTray () {
  const tray = new Tray(path.parse(__dirname).dir + '/assets/img/team_logo_s.png');
  tray.on('click', function (event) {
    // console.log('clicked')
    toggleWindowVisibility();
  });
  // tray.setTitle('楽 1 - 2 オ 8回裏')
  // tray.setToolTip('Rakuten eagles fan');
  return tray;
}

function toggleWindowVisibility () {
  const { x, y } = calcWindowPosition();
  _browserWindow.setPosition(x, y);
  _browserWindow.isVisible() ? _browserWindow.hide() : _browserWindow.show();
}

function calcWindowPosition () {
  const trayBounds = _tray.getBounds();
  // console.log(trayBounds);
  const windowBounds = _browserWindow.getBounds();
  // console.log(windowBounds);
  const x = trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2);
  const y = trayBounds.y + trayBounds.height;
  return { x, y };
}

var _browserWindow = null;
var _tray = null;

// MacOSのドックにアイコンを表示させない。
app.dock.hide();

app.on('ready', () => {
  _tray = createTray();
  _browserWindow = createWindow();

  powerMonitor.on('resume', () => {
    _browserWindow.webContents.send('resume', 'resume');
  });
});

// 特定のキーボードショートカットだけを有効にするため、カスタムメニューバー設置。
Menu.setApplicationMenu(buildMenu());
