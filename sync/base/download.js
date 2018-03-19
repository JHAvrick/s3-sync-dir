const fs = require('fs');

/**
 * Promise wrapper for uploading an item to an s3 bucket
 * 
 * @async
 * @param {object} s3 - An AWS.S3 instance
 * @param {string} bucket - The S3 bucket key
 * @return {Promise<array>} Array of objects detailing bucket contents
 */
async function download(s3, params, path){

	return new Promise((resolve, reject) => {

		s3.getObject(params, function(err, data) {
			if (err) reject(err, err.stack);
			else	{

				var writer = fs.createWriteStream(path);
						writer.write(data.Body);
						writer.end();

				writer.on('finish', () => {
					resolve(path);
				});

				writer.on('error', (err) => {
					reject(err);
				});

			}

		});

	});

}

module.exports = download;

