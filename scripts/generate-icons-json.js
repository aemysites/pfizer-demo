const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../lib/icons');

function generateIconJson() {
  // read directory and get all file names
  fs.readdir(source, (err, files) => {
    if (err) {
      console.error('Failed to get icon');
      console.error(err);
    }

    const jsonObject = [];

    // create json with all svg names
    files.forEach((item) => {
      if (item.includes('.svg')) {
        jsonObject.push({
          name: item,
          path: `/lib/icons/${item}`
        });
      }
    });

    // save json file to icons folder
    fs.writeFile(`${source}/_icons.json`, JSON.stringify(jsonObject), (writeFileErr) => {
      if (writeFileErr) {
        console.error(writeFileErr);
      }
      // file written successfully
    });

    console.log(jsonObject);
  });
}

generateIconJson();
