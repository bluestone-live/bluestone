// TODO: Try to use quip docs instead
const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const languageContent = {};

const CREDENTIALS = require(`./build-translations.json`);
const SPREADSHEET_ID = `1l3lNajxq3ppXuYPp5mnlw_EU1i0Q3o1-eLHCv-bqBYM`;
const TRANSLATION_PATH = '../src/i18n/translations/';
const LANGUAGES = ['zh', 'en'];

async function getWorksheets() {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
  await promisify(doc.useServiceAccountAuth)(CREDENTIALS);
  const info = await promisify(doc.getInfo)();
  console.log(`Loaded doc: ${info.title} by ${info.author.email}`);
  console.log(`Number of worksheets: ${info.worksheets.length}`);
  return info.worksheets;
}

async function processWorksheet(sheet) {
  console.log(`Process Worksheet: ${sheet.title}...`);

  const cells = await promisify(sheet.getCells)({
    'min-row': 2,
    'min-col': 1,
    'max-col': 1 + LANGUAGES.length,
    'return-empty': true,
  });

  let transKey = '';
  for (const cell of cells) {
    if (cell.col === 1) {
      // Save translation ket for next columns values
      transKey = cell.value;
      // If i don't have the transKey consider it as empty row
      if (!transKey) {
        break;
      }
    }

    if (cell.col > 1) {
      // Since translation start from column 2, we need to start read the LANGUAGES 0
      const lang = LANGUAGES[cell.col - 2];
      if (!languageContent[lang][sheet.title]) {
        languageContent[lang][sheet.title] = {};
      }
      const value = cell.value ? cell.value.replace(/\\n/g, '\n') : '';
      languageContent[lang][sheet.title][transKey] = value;
      // console.log(`${lang}.${sheet.title}.${transKey} = ${value || ''}`);
      if (!value || value === '') {
        console.warn(
          `!!!!! Missing translation for ${transKey} in ${lang} !!!!!`,
        );
      }
    }
  }
}

async function writeToFile(lang) {
  fs.writeFileSync(
    path.join(__dirname, TRANSLATION_PATH, `${lang}.json`),
    JSON.stringify(languageContent[lang], undefined, 2),
    error => {
      console.log(`Save file ${lang}.json failed: ${error || 'unknown'}`);
    },
  );
}

async function main() {
  // Initialize Languages
  LANGUAGES.forEach(lang => {
    languageContent[lang] = {};
  });

  const worksheets = await getWorksheets();

  // Process each worksheets
  for (const sheet of worksheets) {
    await processWorksheet(sheet);
  }

  // Write languageContent to language js file
  for (const lang of LANGUAGES) {
    writeToFile(lang);
  }
}

// Execute functions
main();
