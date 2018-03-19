const fs = require('fs');
const path = require('path');

function deleteFile(filePath){
	return new Promise((resolve, reject) => {
		fs.unlink(path.join(filePath), (err) => {
			if (err) reject(err);
			else resolve(true);
		});		
	})
}

module.exports = deleteFile;

