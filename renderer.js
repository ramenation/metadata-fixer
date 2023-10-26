document.addEventListener("DOMContentLoaded", function() {
    // Get Electron's ipcRenderer module and the necessary functions from fileprocessor.js
    const { ipcRenderer } = require('electron');
    const { processDirectories, processCsvToJSON, mergeDirectoriesAndProcessFiles, countTraitsInDirectory, findDuplicates,  reconstructNumbering } = require('./fileprocessor');
    const outputElement = document.getElementById('output');

    let startDirectory = null;
    let outputDirectory = null;

    // Event listener to select start directory
    document.getElementById('start-directory').addEventListener('click', () => {
        ipcRenderer.invoke('select-start-directory').then((path) => {
            if (path) {
                startDirectory = path;
                document.getElementById('start-directory-display').textContent = startDirectory;
            }
        });
    });

    // Event listener to select output directory
    document.getElementById('output-directory').addEventListener('click', () => {
        ipcRenderer.invoke('select-output-directory').then((path) => {
            if (path) {
                outputDirectory = path;
                document.getElementById('output-directory-display').textContent = outputDirectory;
            }
        });
    });

    // Event listener to select second input directory
    document.getElementById('second-input-directory').addEventListener('click', () => {
        ipcRenderer.invoke('select-second-input-directory').then((path) => {
            if (path) {
                secondInputDirectory = path;
                document.getElementById('second-input-directory-display').textContent = secondInputDirectory;
            }
        });
    });

    // IPC event for file selection 
    ipcRenderer.on('selected-file', (event, filePath) => {
        if (filePath) {
            processCsvToJSON(filePath,outputDirectory);
        } else {
            console.error("No file selected");
        }
    });

    // Event listeners for script buttons
    const scriptButtons = document.querySelectorAll('.script-btn');
    scriptButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            switch (index) {
                case 0:
                    ipcRenderer.send('open-file-dialog');
                    break;
                case 1:
                    reconstructNumbering(startDirectory, outputDirectory);
                    break;
                case 2:
                    mergeDirectoriesAndProcessFiles(startDirectory, secondInputDirectory, outputDirectory);
                    break;
                case 3:
                    reconstructNumbering(startDirectory, outputDirectory);
                    break;
                case 4:
                    countTraitsInDirectory(startDirectory, outputElement);
                    break;
                case 5:
                    findDuplicates(startDirectory,outputElement);
                    break;
                default:
                    console.error('Invalid Script');
            }
        });
    });


});
