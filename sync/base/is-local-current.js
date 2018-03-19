const fs = require('fs');
const path = require('path');

async function isLocalCurrent(filePath, lastSyncDate){
	return new Promise((resolve, reject) => {
		fs.lstat(path.join(filePath), (err, stats) => {
			if (err) reject(err);

			fileDate = new Date(stats.mtime);
			objDate = new Date(lastSyncDate);

			if (fileDate > objDate)
				resolve(true);
			else
				resolve(false);

		});
	});
}

module.exports = isLocalCurrent;