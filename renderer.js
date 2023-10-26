document.addEventListener("DOMContentLoaded", function() {


document.querySelector('button').addEventListener('click', () => {
    console.log("A button was clicked.");
});


const { ipcRenderer } = require('electron');
const { processDirectories, processCsvToJSON, mergeDirectoriesAndProcessFiles, countTraitsInDirectory, findDuplicates,  reconstructNumbering } = require('./fileprocessor');
const outputElement = document.getElementById('output');

let startDirectory = null;
let outputDirectory = null;

document.getElementById('start-directory').addEventListener('click', () => {
    ipcRenderer.invoke('select-start-directory').then((path) => {
        if (path) {
            startDirectory = path;
            document.getElementById('start-directory-display').textContent = startDirectory;
        }
    });
});


document.getElementById('output-directory').addEventListener('click', () => {
    console.log("Output directory button clicked");
    ipcRenderer.invoke('select-output-directory').then((path) => {
        if (path) {
            console.log("Received path from main process:", path);
            outputDirectory = path;
            document.getElementById('output-directory-display').textContent = outputDirectory;
        }
    });
});


document.getElementById('second-input-directory').addEventListener('click', () => {
    ipcRenderer.invoke('select-second-input-directory').then((path) => {
        if (path) {
            secondInputDirectory = path;
            document.getElementById('second-input-directory-display').textContent = secondInputDirectory;
        }
    });
});


ipcRenderer.on('selected-file', (event, filePath) => {
    if (filePath) {
        processCsvToJSON(filePath,outputDirectory);
    } else {
        console.error("No file selected");
    }
});

const scriptButtons = document.querySelectorAll('.script-btn');
console.log(scriptButtons);
document.querySelector('.script-btn').addEventListener('click', () => {
    console.log(" script button was clicked.");
});
scriptButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        console.log(`Button with index ${index} was clicked.`);

        switch (index) {
            case 0:
                // Instead of processing the CSV immediately, request the file dialog.
                ipcRenderer.send('open-file-dialog');
                break;
            case 1:
                console.log("Attempting to process directories...");
                processDirectories(startDirectory, outputDirectory);
                break;
            case 2:
                console.log(startDirectory, secondInputDirectory, outputDirectory)
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

function runScript1(startDir, outputDir) {
    alert('Running Script 1');
    console.log('Script 1 - Start Directory:', startDir);
    console.log('Script 1 - Output Directory:', outputDir);
    // Add your script logic here
}

function runScript2(startDir, outputDir) {
    alert('Running Script 2');
    console.log('Script 2 - Start Directory:', startDir);
    console.log('Script 2 - Output Directory:', outputDir);
    // Add your script logic here
}

function runScript3(startDir, outputDir) {
    alert('Running Script 3');
    console.log('Script 3 - Start Directory:', startDir);
    console.log('Script 3 - Output Directory:', outputDir);
    // Add your script logic here
}

    // ... all your previous renderer.js code here ...
});
