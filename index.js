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
    if (!fs.existsSync(configPath) || fs.readdirSync(configPath).length === 0) {
      console.error('No hay nada que exportar.');
      return;
    }

    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
      console.log(`Directorio creado: ${exportPath}`);
    }

    const zip = new AdmZip();
    const exportFile = path.join(exportPath, 'dbeaver-config-export.zip');

    fs.readdirSync(configPath).forEach(file => {
      const filePath = path.join(configPath, file);
      zip.addLocalFile(filePath);
    });

    zip.writeZip(exportFile);
    console.log(`Configuraciones exportadas a: ${exportFile}`);
  } catch (error) {
    console.error(`Error al exportar configuraciones: ${error.message}`);
  }
};

const importConfig = async (zipPath, configPath) => {
  try {
    if (!fs.existsSync(zipPath)) {
      console.error('El archivo zip no existe.');
      return;
    }

    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    if (zipEntries.length === 0) {
      console.error('El archivo zip está vacío o no contiene configuraciones válidas.');
      return;
    }

    zip.extractAllTo(configPath, true);
    console.log('Configuraciones importadas correctamente en:', configPath);
  } catch (error) {
    console.error(`Error al importar configuraciones: ${error.message}`);
  }
};

const main = async () => {
  console.log(`
    ____  ____  _________ _    ____________ 
   / __ \\/ __ )/ ____/   | |  / / ____/ __ \\
  / / / / __  / __/ / /| | | / / __/ / /_/ /
 / /_/ / /_/ / /___/ ___ | |/ / /___/ _, _/ 
/_____/_____/_____/_/__|_|___/_____/_/ |_|  
  / ____/ __ \\/ | / / ____/  _/ ____/       
 / /   / / / /  |/ / /_   / // / __         
/ /___/ /_/ / /|  / __/ _/ // /_/ /         
\\____/\\____/_/_|_/_/__ /___/\\____/          
 /_  __/ __ \\/ __ \\/ /                      
  / / / / / / / / / /                       
 / / / /_/ / /_/ / /___                     
/_/  \\____/\\____/_____/
𝙫𝟭.𝟬.𝟬

𝙗𝙮 @𝙫𝙤𝙣𝙠𝙖𝙨𝙩𝙚𝙧
`);
  const osChoice = await askOS();
  const action = await askAction();
  const configPath = dbeaverConfigPaths[osChoice];

  if (action === 'Importar configuraciones') {
    console.log('Iniciando aplicación Electron para importar configuraciones...');

    let electronPath;
    if (osChoice === 'windows') {
      electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron.cmd');
    } else if (osChoice === 'linux') {
      electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');
    }

    if (!fs.existsSync(electronPath)) {
      console.error('No se encontró el ejecutable de Electron.');
      process.exit(1);
    }

    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath, { recursive: true });
      console.log(`Directorio de configuración creado: ${configPath}`);
    }

    const electronProcess = spawn(electronPath, ['.'], { stdio: 'inherit', shell: true });

    electronProcess.on('error', (err) => {
      console.error(`Error al iniciar Electron: ${err.message}`);
    });

    electronProcess.on('close', async (code) => {
      if (code !== 0) {
        console.log(`Electron terminó con el código: ${code}`);
      } else {
        const importZipPath = path.join(projectExportPath, 'dbeaver-config-export.zip');
        
        await importConfig(importZipPath, configPath);
      }
    });
  }

  else if (action === 'Exportar configuraciones') {
    if (!fs.existsSync(configPath)) {
      console.error('La configuración de DBeaver no fue encontrada en la ruta esperada.');
      process.exit(1);
    }

    const exportPath = await askExportPath();
    exportConfig(configPath, exportPath);
  }
};

main();