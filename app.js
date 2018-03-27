const AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

const syncWorkspace = require('./src/sync-workspace');

let bucket = process.argv[2];
let prefix = process.argv[3];
let root = process.argv[4];

console.log(root);

if (root && bucket){

  try {
    
    let config = {
      s3: s3,
      bucket: bucket,
      prefix: prefix,
      root: root,
      ignore: [],
    }

    let callbacks =  {
      onBefore: (params) => {
        console.log("------------------------------------------");
        console.log("Operation: " + params.type);
        console.log("Item: " + params.name);
        return true;
      },
      onError: (err, params) => {
        console.log("FAILED: " + params.name)
        console.log("------------------------------------------");
      },
      onComplete: (params) => {
        console.log("COMPLETED: " + params.name)
        console.log("------------------------------------------");
      },
      onSyncError: (err, params) => {
        console.log(err);
      },
      onSyncComplete: (params) => {
        console.log("============SYNC COMPLETE=============")
      }
    }

    syncWorkspace(config, callbacks);

  } catch (err) {
    console.log(err);
  }

} else {
  console.log("Invalid Argument List. Must provide both a directory and bucket key.");
}

