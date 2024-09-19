const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
app.disableHardwareAcceleration();


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

    fs.copySync(tempDir, configPath, { overwrite: true, dereference: true });
    console.log('Archivos copiados a la carpeta de configuración de DBeaver.');

    fs.chmodSync(configPath, '755');
    console.log('Permisos actualizados en la carpeta de configuración de DBeaver.');

    fs.removeSync(tempDir);
    console.log('Configuraciones importadas correctamente.');

    app.quit();
  } catch (error) {
    console.error(`Error al importar configuraciones: ${error.message}`);
  }
}

app.whenReady().then(() => {
  const configPath = path.join(require('os').homedir(), 'AppData/Roaming/DBeaverData/workspace6/General/.dbeaver');
  importConfig(configPath);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});