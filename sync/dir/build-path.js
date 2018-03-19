const fs = require('fs');
const path = require('path');

async function buildPath(root, filePath){
	let parsedPath = filePath.split(path.sep);

	try {	

		var pathString = '';
		for (let i = 0; i < parsedPath.length - 1; i++){
			pathString = path.join(pathString, parsedPath[i]);
			let nextDir = path.join(root, pathString);

			await mkdir(nextDir);
		}

	} catch (err) {

		throw err;

	}

	return true;
}

function mkdir(dirPath){
	return new Promise((resolve, reject) => {
		fs.mkdir(dirPath, err => {
			if (err && err.code !== 'EEXIST') reject(err);
			else resolve(true);
		});
	});
}

module.exports = buildPath;