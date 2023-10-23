const fs = require('fs');
const path = require('path');



function getBaseNameFromJsonName(jsonName) {
    // This regex removes a hash "#" followed by digits at the end of the string.
    return jsonName.replace(/#\d+$/, '').trim();
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}


function ensureDirectoryExistence(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }
}

function validateDirectoryStructure(inputDirectory) {
    const subdirectories = fs.readdirSync(inputDirectory, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    if (subdirectories.length !== 2) {
        throw new Error('Input directory must have exactly two subdirectories.');
    }

    let jsonDirectory, imageDirectory;

    if (fs.readdirSync(path.join(inputDirectory, subdirectories[0])).some(file => file.endsWith('.json'))) {
        jsonDirectory = subdirectories[0];
        imageDirectory = subdirectories[1];
    } else {
        jsonDirectory = subdirectories[1];
        imageDirectory = subdirectories[0];
    }

    return { jsonDirectory, imageDirectory };
}

function getMatchingImageFileName(jsonFileName, imageDirectory) {
    const baseName = path.basename(jsonFileName, '.json');
    const possibleExtensions = ['.jpg', '.png'];
    for (const ext of possibleExtensions) {
        const imageFileName = `${baseName}${ext}`;
        if (fs.existsSync(path.join(imageDirectory, imageFileName))) {
            return imageFileName;
        }
    }
    return null;
}

function renameFilesAndUpdateJson(inputDirectory, outputDirectory, jsonDirectory, imageDirectory) {
    const jsonFiles = fs.readdirSync(path.join(inputDirectory, jsonDirectory)).filter(file => file.endsWith('.json'));
    const shuffledNumbers = shuffleArray([...Array(jsonFiles.length).keys()].map(i => i + 1));

    // Ensure output directories exist
    ensureDirectoryExistence(path.join(outputDirectory, jsonDirectory));
    ensureDirectoryExistence(path.join(outputDirectory, imageDirectory));

    jsonFiles.forEach((jsonFile, index) => {
        const jsonFilePath = path.join(inputDirectory, jsonDirectory, jsonFile);
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

        if (!jsonData.name) {
            throw new Error(`Missing "name" attribute in ${jsonFile}`);
        }

        const imageFileName = getMatchingImageFileName(jsonFile, path.join(inputDirectory, imageDirectory));
        if (!imageFileName) {
            throw new Error(`No matching image file found for ${jsonFile}`);
        }

        const imageFilePath = path.join(inputDirectory, imageDirectory, imageFileName);

        const baseNameWithoutNumber = getBaseNameFromJsonName(jsonData.name);
        const newNumberedName = `${baseNameWithoutNumber} #${shuffledNumbers[index]}`;
        const newJsonName = `${newNumberedName}.json`;
        const newImageName = `${newNumberedName}${path.extname(imageFileName)}`;

        jsonData.name = newNumberedName;

        fs.copyFileSync(jsonFilePath, path.join(outputDirectory, jsonDirectory, newJsonName));
        fs.copyFileSync(imageFilePath, path.join(outputDirectory, imageDirectory, newImageName));
        fs.writeFileSync(path.join(outputDirectory, jsonDirectory, newJsonName), JSON.stringify(jsonData, null, 2));

        // Optionally, delete the original files
        //fs.unlinkSync(jsonFilePath);
        //fs.unlinkSync(imageFilePath);
    });
}




function processDirectories(startDirectory, outputDirectory) {
    try {
        const { jsonDirectory, imageDirectory } = validateDirectoryStructure(startDirectory);
        renameFilesAndUpdateJson(startDirectory, outputDirectory, jsonDirectory, imageDirectory);
        alert('Files renamed successfully!');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }


}

// ... [rest of your code] ...

function processCsvToJSON(outputDirectory) {
    // Prompt user to select the input CSV file
    const fileSelection = dialog.showOpenDialogSync({
        title: "Select CSV file",
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
    });

    if (!fileSelection || fileSelection.length === 0) {
        console.error("No file selected");
        return;
    }

    const inputFile = fileSelection[0]; // Get the selected file path

    fs.createReadStream(inputFile)
        .pipe(csv())
        .on('data', (row) => {
            const attributes = [];

            let index = 0;
            for (const [key, value] of Object.entries(row)) {
                if (index > 1) {
                    attributes.push({
                        trait_type: key,
                        value: value
                    });
                }
                index++;
            }

            const transformedObj = {
                name: row.Name,
                description: row.Description,
                attributes: attributes
            };

            let fileName = row.Name.replace(/[\/\\?%*:|"<>]/g, '') + '.json';

            fs.writeFileSync(path.join(outputDirectory, fileName), JSON.stringify(transformedObj, null, 4));

            console.log(`Converted ${row.Name} to JSON and saved to ${fileName}`);
        })
        .on('end', () => {
            console.log('CSV has been processed');
            alert('CSV has been processed and JSON files have been saved!');
        });
}

async function mergeDirectoriesAndProcessFiles(inputDir1, inputDir2, outputDir) {
    const allJsonFiles = [];
    const allImageFiles = [];

    const processDirectoryFiles = async (directory) => {
        const { jsonDirectory, imageDirectory } = validateDirectoryStructure(directory);

        const jsonFiles = fs.readdirSync(path.join(directory, jsonDirectory)).filter(file => file.endsWith('.json'));
        const imageFiles = fs.readdirSync(path.join(directory, imageDirectory)).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));

        allJsonFiles.push(...jsonFiles.map(file => path.join(directory, jsonDirectory, file)));
        allImageFiles.push(...imageFiles.map(file => path.join(directory, imageDirectory, file)));
    };

    await processDirectoryFiles(inputDir1);
    await processDirectoryFiles(inputDir2);

    const totalFiles = allJsonFiles.length;
    const shuffledNumbers = shuffleArray([...Array(totalFiles).keys()].map(i => i + 1));

    allJsonFiles.forEach((jsonFilePath, index) => {
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        const baseNameWithoutNumber = getBaseNameFromJsonName(jsonData.name);
        const newNumberedName = `${baseNameWithoutNumber} #${shuffledNumbers[index]}`;
        jsonData.name = newNumberedName;
    
        const jsonFileName = path.basename(jsonFilePath);
        const imageFileName = getMatchingImageFileName(jsonFileName, path.dirname(jsonFilePath));
    
        if (!imageFileName) {
            console.error(`No matching image file found for ${jsonFileName}`);
            return; // Skip this iteration
        }
    
        const imageFilePath = allImageFiles.find(filePath => path.basename(filePath) === imageFileName);
    
        if (!imageFilePath) {
            console.error(`Image file path not found for ${imageFileName}`);
            return; // Skip this iteration
        }
    
        const newJsonName = `${newNumberedName}.json`;
        const newImageName = `${newNumberedName}${path.extname(imageFileName)}`;
    
        fs.writeFileSync(path.join(outputDir, newJsonName), JSON.stringify(jsonData, null, 2));
        fs.copyFileSync(imageFilePath, path.join(outputDir, newImageName));
    });
}



module.exports = {
    validateDirectoryStructure,
    renameFilesAndUpdateJson,
    processDirectories,
    getMatchingImageFileName,
    ensureDirectoryExistence,
    getBaseNameFromJsonName,
    processCsvToJSON,
    mergeDirectoriesAndProcessFiles
};
