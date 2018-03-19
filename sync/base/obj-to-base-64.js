function objToBase64(obj){
	let base64Obj = {}
	for (var key in obj){
		if (typeof obj[key] === 'object')
			base64Obj[key] = Buffer.from(JSON.stringify(obj[key])).toString('base64'); 
		else
			base64Obj[key] = Buffer.from(obj[key]).toString('base64');
	}
	return base64Obj;
}

module.exports = objToBase64;