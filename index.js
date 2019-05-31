const fs = require('fs-extra');
const path = require('path');

const SEPARATOR = ',';

/**
 * Load the file from fs.
 *
 * @async
 * @param {string} lg - Langcode.
 * @returns {string} - File content.
 */
const loadFile = async lg => {
    const content = await fs.readFile(path.join(__dirname, 'input', `${lg}.txt`));
    return content.toString();
};

/**
 * Split the file into sentences.
 *
 * It also cleans the data, remove unwanted chars, sanitize data...
 *
 * @param {string} content - Content to split.
 * @returns {string[]} - Sentences.
 */
const splitFile = content => content
    // Split lines.
    .split('\n')
    // Split each line into sentences.
    .map(line => line.split('.'))
    // Flatten the result.
    .reduce((acc, line) => acc.concat(line), [])
    // Remove all wikipedia stuff that can be at the beginning of the sentence.
    .map(str => str.replace(/^(\s|\d|\[|\]|\:|\(|\))+/, ''))
    // Remove shortest sentences.
    .filter(sentence => sentence && sentence.length > 5)
    // Remove commas, since we're exporting a comma-separated CSV.
    .map(str => str.replace(/,/g,''));

/**
 * Shuffle an array.
 *
 * @param {Array<*>} a - Array.
 * @returns {Array<*>} - Shuffled array.
 */
const arrayShuffle = (a) => {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
};

/**
 * Format the dataset, shuffle it, then write it on filesystem.
 *
 * @async
 * @param {Array<string>} lgs - Language codes.
 * @param {Array<Array<string>>} contents - Sentences for each language.
 * @returns {number} - Total lines written.
 */
const exportDataset = async (lgs, contents) => {
    const minDatasetSize = Math.min(...contents.map(c => c.length));

    console.log(`Dataset will be truncated to ${minDatasetSize} entries per language.`);

    const lines = [];

    // For each language, add the line with its language in the dataset.
    lgs.forEach((lg, index) => {
        contents[index]
            .slice(0, minDatasetSize - 1)
            .forEach(line => {
                lines.push(`${line}${SEPARATOR}${lg}`);
            });
    });

    // Shuffle the dataset, not sure if AutoML does it.
    arrayShuffle(lines);

    // Prepend header then put the data.
    const data = [`text${SEPARATOR}result`]
            .concat(lines)
            .join('\r\n');

    // Export.
    await fs.writeFile(
        path.join('output', 'export.csv'),
        data,
    );

    // Return file size for debug.
    return lines.length;
};

const main = async (lgs) => {
    const files = await Promise.all(lgs.map(loadFile));
    const contents = files.map(splitFile);
    return exportDataset(lgs, contents);
};

main(['fr', 'en', 'es'])
    .then(console.log)
    .catch(console.error);