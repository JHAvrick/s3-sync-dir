//This config object holds two special properties
//The 'body' property is the body that is uploaded in place of any soft-deleted objects
//The md5 is the hash of this body
//Any object with this hash has been soft-deleted
//This is to help reduce the number of REST calls necessary to determine whether a directory is synced
const softDeleteConfig = {
	body: 'a51de12a-8575-4c49-b64c-27102313a07a', //Randomy GUID
	md5: 'ad1f62cc022a1db3700cb2343bb70a45' //MD5 hash of random GUID
}

module.exports = softDeleteConfig;