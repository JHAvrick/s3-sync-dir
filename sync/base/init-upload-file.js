const uploadFile = require('./upload-file');
const getInitTags = require('./get-init-tags');
const TagSet = require('../class/tag-set.js');
const PATH = require('path');


/**
 * This method should should be used to perform first-time uploads of files to 
 * an S3 bucket. This method will upload a file and create initial tags/metadata.
 * This method should not be used to update existing objects as tags and metadata
 * will be overwritten and not merged.
 *
 * @async
 * @param {object} s3 - An authenticated S3 instance
 * @param {string} bucket - The bucket key 
 * @param {string} rootPath - Absolute path to the root sync folder
 * @param {string} filePath - Absolute path to a file within the root folder
 * @param {callback} onBefore - Return false to abort upload
 * @param {callback} onComplete - 
 * @return {Promise<object>} Promise with response from S3 service
 */
async function initUploadFile(s3, bucket, rootPath, filePath){
	let objectKey = PATH.relative(rootPath, filePath).replace(/\\/g, "/");
	let params = {
		Bucket: bucket,
		Key: objectKey,
		Tagging: await new TagSet().getInitTags(filePath), //async because of md5 fetch
	}

	return uploadFile(s3, params, filePath);
}

module.exports = initUploadFile;