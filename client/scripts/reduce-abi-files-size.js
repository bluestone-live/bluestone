const fs = require('fs');
const path = require('path');

const reduceABIFileSize = () => {
  const contractsFolder = path.resolve(__dirname, '../src/contracts');

  const fileNames = fs.readdirSync(contractsFolder);

  fileNames.forEach(fileName => {
    const filePath = path.resolve(contractsFolder, fileName);
    const contractDeclarationFile = require(filePath);

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          contractName: contractDeclarationFile.contractName,
          abi: contractDeclarationFile.abi,
        },
        null,
        2,
      ),
    );

    console.log(`${filePath} done`);
  });
};
module.exports = reduceABIFileSize;
