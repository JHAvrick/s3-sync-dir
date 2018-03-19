const fs = require('fs');
const path = require('path');
const upload = require('./upload');
const listTreeDeep = require('../dir/list-tree-deep');
const listFilesDeep = require('../dir/list-files-deep');

async function uploadDir(s3, dir, bucket, onStart  = function(){}, onComplete = function(){}){
	try {

		await _uploadTree(s3, dir, bucket, onStart, onComplete);
		await _uploadFiles(s3, dir, bucket, onStart, onComplete);

	} catch (err) {

		console.log(err);

	}
}

async function _uploadTree(s3, dir, bucket, onStart, onComplete){
	let tree = await listTreeDeep(dir);
	for (let i = 0; i < tree.length; i++){

	 let params = {
			Bucket: bucket,
			Key: path.join(tree[i]), 
			Body: path.join(tree[i])
		}	

		try { 

			onStart(path.basename(tree[i]));

			let result = await upload(s3, params);

			onComplete(path.basename(tree[i]), result);

		} catch (err) { 
			console.log(err); 
		}
		
	}

	return true;
}

async function _uploadFiles(s3, dir, bucket, onStart, onComplete){

	 	let files = await listFilesDeep(dir);
	 	for (let i = 0; i < files.length; i++){

	 		let filePath = path.join(files[i]);
	 		let body = fs.createReadStream(filePath);

			let params = {
				Bucket: bucket,
				Key: filePath, 
				Body: body
			}	

			try { 

				onStart(path.basename(filePath));

				let result = await upload(s3, params);

				onComplete(path.basename(filePath), result);

			} catch (err) { 
				console.log(err); 
			}

	 	}	 	

	 	return true;
}

module.exports = uploadDir;