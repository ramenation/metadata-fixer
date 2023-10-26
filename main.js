const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const {  reconstructNumbering, validateDirectoryStructure, renameFilesAndUpdateJson, processDirectories, countTraitsInDirectory, findDuplicates } = require('./fileprocessor');

// Initialize the main application window
let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true,
        }
    });
    mainWindow.loadFile('index.html');
});

// Utility function to open a directory selection dialog
async function selectDirectory() {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
}

// IPC Handlers for directory and file selections
ipcMain.handle('select-start-directory', selectDirectory);
ipcMain.handle('select-output-directory', selectDirectory);

ipcMain.on('open-file-dialog', (event) => {
    const fileSelection = dialog.showOpenDialogSync({
        title: "Select CSV file",
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
    });
    
    if (fileSelection && fileSelection.length > 0) {
        event.reply('selected-file', fileSelection[0]);
    } else {
        event.reply('selected-file', null);
    }
});

ipcMain.handle('select-second-input-directory', selectDirectory);