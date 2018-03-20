const PATH = require('path');

/**
 * Generate an S3 object key based on root directory and S3 bucket prefix
 * 
 * @param {string} prefix - The bucket prefix
 * @param {string} bucket - The root sync directory
 * @param {string} filepath - The path to the file within root directory
 * @return {string} S3 object key
 */
function makeKey(prefix, root, filepath){
    let relativePath = PATH.relative(root, filepath).split(PATH.sep);
        relativePath.unshift(prefix); //Replace root of path with prefix

    return PATH.join(...relativePath).replace(/\\/g, "/");
}

module.exports = makeKey;