const getObjectTags = require('./get-object-tags');
const listBucket = require('./list-bucket');
const uploadFile = require('./upload-file');
const md5File = require('md5-file/promise');
const path = require('path');

/**
 * Promise wrapper for uploading an item to an s3 bucket
 * 
 * @async
 * @param {object} s3 - An AWS.S3 instance
 * @param {string} bucket - The bucket key 
 * @param {string} root - Absolute path to the sync folder
 * @param {string} root - Absolute path to resource (within root folder)
 * @return {Promise<array>} 
 */
async function syncFile(s3, bucket, rootPath, filePath){

		//Get object
		let objectKey = path.relative(rootPath, filePath);
		let S3Bucket = await listBucket(s3, bucket, objectKey);

		//OBJECT DOES NOT EXIST - Perform first time upload
		if (S3Bucket.Contents.length === 0){
			return _handleFirstTimeUpload(s3, bucket, objectKey, filePath);

		//OBJECT DOES NOT REQUIRE SYNC
		} else if (){

		}
		
		//OBJECT EXISTS - Get Tags
		} else {
			let objectTags = await getObjectTags(s3, bucket, objectKey);
			let tags = _S3tagsToObject(objectTags); //Get tags in obj format

			//LOCAL FILE IS CURRENT - Upload file to bucket
			if (await _localIsMostRecent(filePath)){


			///LOCAL FILE IS NOT CURRENT 
			} else {

			}

		}
		
		return false;

}


async function _localIsMostRecent(){

}

function _S3tagsToObject(tags){
	let tagObj = {};
	for (let i = 0 ; i < tags.length; i++){
		tagObj[tags[i].Key] = Buffer.from(tags[i].Value, 'base64').toString('ascii');
	}
	return tagObj;
}

function _objectToS3Tags(object){

}

async function _handleObjectDeleted(s3, bucket, objectKey, filePath){

}

//Performs first time upload of a file, setting initial sync metadata
//Returns a promise with data from s3 REST call
function _handleFirstTimeUpload(s3, bucket, objectKey, filePath){

	let deviceName = Buffer.from(require('os').hostname()).toString('base64');
	let deviceList = Buffer.from(JSON.stringify([deviceName])).toString('base64');
	let syncDate = Buffer.from(new Date().toString()).toString('base64');
	let tags = _serialize({
		lastSyncBy: deviceName,
		lastSyncDate: syncDate,
		createdBy: deviceName,
		createdDate: syncDate,
		syncedTo: deviceList
	});

	let params = {
		Bucket: bucket,
		Key: objectKey,
		Tagging: tags
	}

	return uploadFile(s3, params, filePath);

}

//Serialize an object as a Query String
function _serialize(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}


module.exports = syncFile;