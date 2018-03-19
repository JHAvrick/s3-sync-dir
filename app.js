var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});

AWS.config.update({
    accessKeyId: "AKIAIWGYOIY5CTQ4LQAQ",
    secretAccessKey: "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"
});

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

const path = require('path');
const SYNC = require('./sync/base/sync-tools');
const DIR = require('./sync/dir/dir-tools');
const syncDir = require('./sync/sync-dir');

let bucket = 'buckets.sandbox';
let root = '/Users/vvalent/Desktop/buckets.sandbox';
let file = '/girl_2.jpg';

let params = {
  Key: 'su.mkv',
  Bucket: bucket,
  Body: 'a51de12a-8575-4c49-b64c-27102313a07a'
}

/*
DIR.buildPath(root, 'one\\two\\three\\ugs').then((data) => {
  console.log("Path build Complete!");
}).catch((err) => {
  console.log(err);
})
*/



/*
SYNC.upload(s3, params).then((data) => {
  console.log(data);
});
*/

/*
SYNC.initUploadFile(s3, bucket, root, file).then((data) => {
  console.log(data);
}).catch((err) => {
  console.log(err);
})
*/

/*
SYNC.softDeleteObject(s3, bucket, 'text_1.txt').then((data) => {
  console.log(data);
}).catch((err) => {
  console.log(err);
})
*/


syncDir(s3, bucket, root, {
  onBeforeUpload: (bucket, root, file) => {
    console.log("UPLOAD STARTING: " + path.basename(file));
    return true;
  },
  onUploadComplete: (bucket, root, file) => {
    console.log("COMPLETED: " + path.basename(file));
  }
});




/*
SYNC.listBucket(s3, 'buckets.sandbox').then((data) => {
  console.log(data);
})
*/




/*
updateObject(s3, bucket, root, file).then((data) => {
  console.log(data);
}).catch((err) => {
  console.log(err);
})
*/


/*
const getObjectTags = require('./sync/base/get-object-tags');
const S3tagsToObj = require('./sync/base/s3-tags-to-obj');
const isLocalCurrent = require('./sync/base/is-local-current');

let objectKey = path.relative(root, file);
getObjectTags(s3, bucket, objectKey).then((tags) => {
  isLocalCurrent(file, S3tagsToObj(tags).lastSyncDate).then((result) => {
    console.log(result);
  })
});



/*
syncFile(s3, 'buckets.sandbox', root, file).then((data) => {
  console.log(data);
  console.log("Success...");
}).catch((err) => {
  console.log(err);
  console.log("Failed...");
})
*/

/*
listBucket(s3, 'buckets.sandbox', 'girl.jpg').then((data) => {
  console.log(data);
})
*/


/*
console.log(path.relative('C:\\Users\\Cloud Strife\\Desktop\\', 'C:\\Users\\Cloud Strife\\Desktop\\girl.jpg'));


let dir = path.join('C:\\Users\\Cloud Strife\\Desktop\\girl.jpg');
let bucket = 'buckets.sandbox';
let params = {
  Bucket: bucket,
  Key: 'girl.jpg'
}

uploadFile(s3, params, dir).then(() => {
  console.log("Complete");
}).catch((err) => {
  console.log(err);
})

*/


/*
//console.log(require('os').hostname());



/*


{
  lastSyncBy:
  lastSyncDate: 
  createdBy:
  createdDate: 
  syncedTo:
  deleted:
  deletedBy:
  deletedDate:
}




download(s3, params, dir).then(() => {
  console.log("Complete!");
}).catch((err) => {
  console.log("Error!");
})
*/
