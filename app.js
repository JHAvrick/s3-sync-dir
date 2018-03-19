const AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

const syncWorkspace = require('./sync/sync-workspace');

let bucket = process.argv[2];
let prefix = process.argv[3];
let root = process.argv[4];

if (root && bucket){

  try {

    syncWorkspace(s3, bucket, prefix, root);

  } catch (err) {
    console.log(err);
  }

} else {
  console.log("Invalid Argument List. Must provide both a directory and bucket key.");
}

