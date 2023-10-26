const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');



function countTraitsInDirectory(directoryPath, outputElement) {
    const traitCounts = walkDir(directoryPath);
    const traitStrings = [];
    for (const [trait, countObj] of Object.entries(traitCounts)) {
        traitStrings.push(objectToString(trait, countObj));
    }
    outputElement.textContent = traitStrings.join('\n\n');
}

function walkDir(dir) {
    let traitCounts = {};
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            Object.assign(traitCounts, walkDir(dirPath)) :
            path.extname(dirPath) === '.json' && Object.assign(traitCounts, processFile(dirPath, traitCounts));
    });
    return traitCounts;
}



function objectToString(traitName, obj) {
    let output = traitName + ':\n';
    for (const [key, value] of Object.entries(obj)) {
        output += key + ': ' + value + '\n';
    }
    return output;
}
// 

function findDuplicates(directory, outputElement) {
    const files = fs.readdirSync(directory);
    const seenAttributes = new Map();
    const duplicateFiles = [];

    files.forEach(file => {
        if (path.extname(file) === '.json') {
            const filePath = path.join(directory, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (data.attributes) {
                const sortedAttributes = data.attributes.sort((a, b) => a.trait_type.localeCompare(b.trait_type));
                const attributeString = sortedAttributes.map(attr => `${attr.trait_type}:${attr.value}`).join(',');
                if (seenAttributes.has(attributeString)) {
                    duplicateFiles.push(file);
                } else {
                    seenAttributes.set(attributeString, file);
                }
            }
        }
    });

    outputElement.textContent = duplicateFiles.length > 0 ? 
        `Duplicate Files: \n${duplicateFiles.join('\n')}` : 
        'No Duplicates Found!';
}


function processFile(file, traitCounts) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (data.attributes && Array.isArray(data.attributes)) {
        data.attributes.forEach(attr => {
            const traitType = attr.trait_type;
            const value = attr.value;

            // If traitType doesn't exist in traitCounts, add it
            if (!traitCounts[traitType]) {
                traitCounts[traitType] = {};
            }

            // If value doesn't exist for the traitType in traitCounts, add it with count 1
            // Otherwise, increase the count by 1
            if (!traitCounts[traitType][value]) {
                traitCounts[traitType][value] = 1;
            } else {
                traitCounts[traitType][value]++;
            }
        });
    }
    return traitCounts;
}

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

function processCsvToJSON(inputFile, outputDirectory) {

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

const mergeDirectoriesAndProcessFiles = async (inputDir1, inputDir2, outputDir) => {
    const totalJsonFiles = getJsonFiles(inputDir1).length + getJsonFiles(inputDir2).length;
    const shuffledNumbers = shuffleArray([...Array(totalJsonFiles).keys()].map(i => i + 1));

    // Ensure the output directory and its subdirectories exist
    ensureDirectoryExistence(outputDir);
    
    const { jsonDirectory, imageDirectory } = validateDirectoryStructure(inputDir1); // Assuming both input directories have the same structure
    ensureDirectoryExistence(path.join(outputDir, jsonDirectory));
    ensureDirectoryExistence(path.join(outputDir, imageDirectory));

    let lastUsedIndex = await processDirectoryFiles(inputDir1, outputDir, shuffledNumbers, 0);
    await processDirectoryFiles(inputDir2, outputDir, shuffledNumbers, lastUsedIndex);
    
   
    console.log('Files have been processed');
    alert('Files have been processed and saved to the output directory!');
};

const getJsonFiles = (directory) => {
    const { jsonDirectory } = validateDirectoryStructure(directory);
    return fs.readdirSync(path.join(directory, jsonDirectory)).filter(file => file.endsWith('.json'));
};

const processDirectoryFiles = async (directory, outputDir, numbers, startIndex) => {
    const { jsonDirectory, imageDirectory } = validateDirectoryStructure(directory);

    const jsonFiles = getJsonFiles(directory);
    for (let i = 0; i < jsonFiles.length; i++) {
        const currentNumber = numbers[startIndex + i];
        await renameFilesAndUpdateJson(directory, outputDir, jsonFiles[i], jsonDirectory, imageDirectory, currentNumber);
    }

    return startIndex + jsonFiles.length;
};

const renameFilesAndUpdateJson = (inputDirectory, outputDirectory, jsonFile, jsonDirectory, imageDirectory, number) => {
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
    const newNumberedName = `${baseNameWithoutNumber} #${number}`;
    const newJsonName = `${newNumberedName}.json`;
    const newImageName = `${newNumberedName}${path.extname(imageFileName)}`;

    jsonData.name = newNumberedName;

    fs.copyFileSync(jsonFilePath, path.join(outputDirectory, jsonDirectory, newJsonName));
    fs.copyFileSync(imageFilePath, path.join(outputDirectory, imageDirectory, newImageName));
    fs.writeFileSync(path.join(outputDirectory, jsonDirectory, newJsonName), JSON.stringify(jsonData, null, 2));
};


function reconstructNumbering(inputDirectory, outputDirectory) {
    const { jsonDirectory, imageDirectory } = validateDirectoryStructure(inputDirectory);

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

    console.log('Files renamed and reconstructed successfully!');
    alert('Files renamed and reconstructed successfully!');
}



module.exports = {
    validateDirectoryStructure,
    renameFilesAndUpdateJson,
    processDirectories,
    getMatchingImageFileName,
    ensureDirectoryExistence,
    getBaseNameFromJsonName,
    processCsvToJSON,
    mergeDirectoriesAndProcessFiles,
    countTraitsInDirectory,
    findDuplicates,
    reconstructNumbering
};
