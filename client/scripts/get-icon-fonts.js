const axios = require('axios');
const fs = require('fs');
const path = require('path');

if (!process.argv[2]) {
  throw Error('require download path');
}

const hash = process.argv[2];

const removeFillPropertiesFromSVG = finalPath => filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, filePath), 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        const reg = new RegExp('fill="#.{3,6}"', 'ig');
        const result = data.replace(reg, '');
        fs.writeFile(path.resolve(__dirname, finalPath), result, error => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(filePath);
          }
        });
      }
    });
  });
};

const download = (url, filePath) => {
  return axios.get(url).then(
    res =>
      new Promise((resolve, reject) => {
        fs.writeFile(
          path.resolve(__dirname, filePath),
          res.data,
          {
            encoding: 'utf8',
          },
          err => {
            if (err) {
              console.error(err);
              reject(err);
            } else {
              resolve(filePath);
            }
          },
        );
      }),
  );
};

download(
  `https://at.alicdn.com/t/font_${hash}.js`,
  '../src/styles/iconfont/iconfont.js',
).then(removeFillPropertiesFromSVG('../src/styles/iconfont/iconfont.js'));
