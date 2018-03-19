const path = require('path');
const readdir = require('./dir/readdir');
const isDir = require('./dir/is-dir');
const listDirs = require('./dir/list-dirs');
const listTreeDeep = require('./dir/list-tree-deep');
const listAllDeep = require('./dir/list-all-deep');
const listFiles = require('./dir/list-files');
const listFilesDeep = require('./dir/list-files-deep');
const md5FilesDeep = require('./dir/md5-files-deep');

try {

	/*
	listFilesDeep(path.join('C:\\Users\\Cloud Strife\\Desktop\\buckets.sandbox')).then((data) => {
		console.log(data);
	});
	*/

	/*
	listTreeDeep(path.join('C:\\Users\\Cloud Strife\\Desktop\\buckets.sandbox')).then((result) => {
		console.log(result);
	})
	*/

	
	listFilesDeep(path.join('C:\\Users\\Cloud Strife\\Desktop\\buckets.sandbox')).then((result) => {
		console.log(result);
	})
	


} catch (err){

	console.log(err);

}