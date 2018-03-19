const AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

const syncDir = require('./sync/sync-dir');

let root = process.argv[2];
let bucket = process.argv[3];

if (root && bucket){

  try {

    syncDir(s3, bucket, root, {
      onBeforeUpload: (bucket, root, file) => {
        console.log("UPLOAD STARTING: " + path.basename(file));
        return true;
      },
      onUploadComplete: (bucket, root, file) => {
        console.log("COMPLETED: " + path.basename(file));
      }
    });

  } catch (err) {
    console.log(err);
  }

} else {
  console.log("Invalid Argument List. Must provide both a directory and bucket key.");
}

