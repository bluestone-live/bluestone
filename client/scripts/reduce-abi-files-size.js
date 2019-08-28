const fs = require('fs');
const path = require('path');

const reduceABIFileSize = () => {
  const contractsFolder = path.resolve(__dirname, 'contracts');

  const fileNames = fs.readdirSync(contractsFolder);

  fileNames.forEach(fileName => {
    const filePath = path.resolve(contractsFolder, fileName);
    const contractDeclarationFile = require(filePath);

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          abi: contractDeclarationFile.abi
        },
        null,
        2,
      ),
    );

    console.log(`${filePath} done`);
  });
};
module.exports = reduceABIFileSize;
