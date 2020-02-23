const AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

const DirectorySync = require('./src/dir-sync');

let bucket = process.argv[2];
let prefix = process.argv[3];
let root = process.argv[4];

try {

    let config = {
        s3: s3,
        bucket: 'buckets.sandbox',
        prefix: 'JHA.WORKSPACE',
        root: 'C:\\Users\\Cloud Strife\\Desktop\\testdir',
        ignore: [],
    }

    let dirSync = new DirectorySync(config);

        dirSync.on("objectSyncStart", (params) => {
            console.log("NAME: " + params.name);
            console.log("SYNC TYPE: " + params.type);
        })

        dirSync.on("objectSyncError", (err, params) => {
            console.log("ERROR: " + err);
            console.log("---------------------------------------");
        })

        dirSync.on("objectSyncComplete", (params) => {
            console.log("PROGRESS: " + dirSync.progress);
            console.log("OPERATION COMPLETE");
            console.log("---------------------------------------");
        })

        dirSync.startSync();

} catch (err) {
    console.log(err);
}



