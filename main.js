const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const {  reconstructNumbering, validateDirectoryStructure, renameFilesAndUpdateJson, processDirectories, countTraitsInDirectory, findDuplicates } = require('./fileprocessor');


// ... your code to create BrowserWindow etc...


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

ipcMain.handle('select-start-directory', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

ipcMain.handle('select-output-directory', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

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

ipcMain.handle('select-second-input-directory', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (filePaths && filePaths.length > 0) {
        return filePaths[0];
    } else {
        return null;
    }
});