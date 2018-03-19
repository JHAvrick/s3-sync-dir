const fs = require('fs');

/**
 * Upload a gie
 * 
 * @async
 * @param {object} s3 - An AWS.S3 instance
 * @param {string} params - Upload params
 * @param {string} path - Path to file
 * @return {Promise<array>} 
 */
function uploadFile(s3, params, path){
	return new Promise((resolve, reject) => {

		params.Body = fs.createReadStream(path);

		s3.upload(params, function(err, data) {
		  if (err) reject(err);
		  else resolve(data);
		});

	});

}

module.exports = uploadFile;