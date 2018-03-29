const uploadFile = require('./upload-file');
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
 * @param {string} key - Object key
 * @param {Array} tagging - Tag array
 * @return {Promise<object>} Promise with response from S3 service
 */
async function initUploadFile(s3, bucket, key, filePath, tagging = []){

	let params = {
		Bucket: bucket,
		Key: key,
		Tagging: tagging
	}

	return uploadFile(s3, params, filePath);
}

module.exports = initUploadFile;