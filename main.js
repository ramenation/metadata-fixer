const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { validateDirectoryStructure, renameFilesAndUpdateJson, processDirectories } = require('./fileprocessor');


// ... your code to create BrowserWindow etc...


let mainWindow;


app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
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
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'CSV', extensions: ['csv'] }]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            event.sender.send('selected-file', result.filePaths[0]);
        }
    }).catch(err => {
        console.log(err);
    });
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