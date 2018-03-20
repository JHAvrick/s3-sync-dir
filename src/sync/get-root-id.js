const FS = require('fs');
const PATH = require('path');
const shortid = require('shortid');

function getRootId(rootPath){
    return new Promise((resolve, reject) => {

        let rootIdPath = PATH.join(rootPath, '.rootid.json')

        FS.readFile(rootIdPath, 'utf8', (err, data) => {
            if (err && err.code === "ENOENT"){

                const rootId = { id: shortid.generate() }
                FS.writeFile(rootIdPath, JSON.stringify(rootId), (err) => {
                    if (err) reject(err);
                    else resolve(rootId.id);
                  });

            } else {
                resolve(JSON.parse(data).id);
            }
        });  
    });
}

module.exports = getRootId;