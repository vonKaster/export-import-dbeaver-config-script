const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');

app.disableHardwareAcceleration();

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.loadURL('data:text/html, <h1>DBeaver Config Manager</h1>');
}

async function openFileDialog() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Archivos Zip', extensions: ['zip'] },
      { name: 'Todos los Archivos', extensions: ['*'] }
    ]
  });

  if (canceled) {
    console.log('Operación cancelada por el usuario.');
    return null;
  }

  return filePaths[0];
}

async function importConfig(configPath) {
  const file = await openFileDialog();
  if (!file) {
    console.log('No se seleccionó ningún archivo.');
    return;
  }

  try {
    const zip = new AdmZip(file);
    const tempDir = path.join(app.getPath('temp'), 'dbeaver-config-temp');

    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
    fs.mkdirSync(tempDir);

    zip.extractAllTo(tempDir, true);

    fs.copySync(tempDir, configPath, { overwrite: true });
    console.log('Configuraciones importadas correctamente.');

    fs.removeSync(tempDir);

    app.quit();
  } catch (error) {
    console.error(`Error al importar configuraciones: ${error.message}`);
  }
}

app.whenReady().then(() => {
  createWindow();
  const configPath = path.join(require('os').homedir(), '.local/share/DBeaverData/workspace6/General/.dbeaver'); // Cambia según el SO
  importConfig(configPath);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
