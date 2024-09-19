const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const AdmZip = require('adm-zip');

const dbeaverConfigPaths = {
  linux: path.join(os.homedir(), '.local/share/DBeaverData/workspace6/General/.dbeaver'),
  windows: path.join(os.homedir(), 'AppData/Roaming/DBeaverData/workspace6/General/.dbeaver')
};

const projectExportPath = path.join(__dirname, 'export');

const askOS = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'os',
      message: '¿En qué sistema operativo estás?',
      choices: ['Linux', 'Windows']
    }
  ]);

  return answers.os.toLowerCase();
};

const askAction = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '¿Qué acción deseas realizar?',
      choices: ['Importar configuraciones', 'Exportar configuraciones']
    }
  ]);

  return answers.action;
};

const askExportPath = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'exportPath',
      message: `¿Dónde deseas guardar el archivo exportado? (Presiona Enter para usar la ruta por defecto: ${projectExportPath})`,
      default: projectExportPath
    }
  ]);

  return answers.exportPath;
};

const exportConfig = async (configPath, exportPath) => {
  try {
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
      console.log(`Directorio creado: ${exportPath}`);
    }

    const zip = new AdmZip();
    const exportFile = path.join(exportPath, 'dbeaver-config-export.zip');

    fs.readdirSync(configPath).forEach(file => {
      const filePath = path.join(configPath, file);
      zip.addLocalFile(filePath); // Añade cada archivo individualmente
    });

    zip.writeZip(exportFile);
    console.log(`Configuraciones exportadas a: ${exportFile}`);
  } catch (error) {
    console.error(`Error al exportar configuraciones: ${error.message}`);
  }
};

const main = async () => {
  const osChoice = await askOS();
  const action = await askAction();
  const configPath = dbeaverConfigPaths[osChoice];

  if (!fs.existsSync(configPath)) {
    console.error('La configuración de DBeaver no fue encontrada en la ruta esperada.');
    process.exit(1);
  }

  if (action === 'Exportar configuraciones') {
    const exportPath = await askExportPath();
    exportConfig(configPath, exportPath);
  } else if (action === 'Importar configuraciones') {
    console.log('Iniciando aplicación Electron para importar configuraciones...');
    const electronProcess = spawn('electron', ['.'], { stdio: 'inherit' });

    electronProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`Electron terminó con el código: ${code}`);
      }
    });
  }
};

main();
