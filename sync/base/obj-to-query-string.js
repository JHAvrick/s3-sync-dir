//Serializes S3 tags for use in URL Query String
function objToQueryString(obj) {
	var str = [];
	for (var p in obj)
			if (obj.hasOwnProperty(p)) {
					str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
			}
	return str.join("&");
}

module.exports = objToQueryString;