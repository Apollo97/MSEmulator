
window.GetSearchParams = function GetSearchParams() {
	const url = new URL(window.location, window.location.origin);
	let params = {};

	for ([key, value] of url.searchParams.entries()) {
		params[key] = value;
	}

	return params;
}

window.DownloadData = (function () {
	let a = document.createElement("a");
	document.body.appendChild(a);
	a.style = "display: none";
	a.target = "_blank";
	return function DownloadData(text, type, fileName) {
		let blob = new Blob([text], { type: type || "octet/stream" });
		let url = window.URL.createObjectURL(blob);
		if (fileName && fileName != "") {
			a.href = url;
			a.download = fileName;
			a.click();
		}
		else {
			//a.href = url;
			//a.click();
			window.open(url, '_blank');
		}
		window.URL.revokeObjectURL(url);
	};
}());

window.SelectText = function SelectText(elem) {
	var range, selection;

	if (document.body.createTextRange) {
		range = document.body.createTextRange();
		range.moveToElementText(elem);
		range.select();
	}
	else if (window.getSelection) {
		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents(elem);
		selection.removeAllRanges();
		selection.addRange(range);
	}
}
window.copyToClipboard = function copyToClipboard(text) {
	var $temp = $("<input>");
	$("body").append($temp);
	$temp.val(text).select();
	document.execCommand("copy");
	$temp.remove();
}

/**
 * disable textNode "#text"
 * @param {string} xml - xml
 * @param {string[]=} arrayTags - optional
 * @returns {object}
 */
function parseXml(xml, arrayTags) {
	var dom = null;
	if (window.DOMParser) {
		dom = (new DOMParser()).parseFromString(xml, "text/xml");
	}
	else if (window.ActiveXObject) {
		dom = new ActiveXObject('Microsoft.XMLDOM');
		dom.async = false;
		if (!dom.loadXML(xml)) {
			throw dom.parseError.reason + " " + dom.parseError.srcText;
		}
	}
	else {
		throw "cannot parse xml string!";
	}

	function isArray(o) {
		return Object.prototype.toString.apply(o) === '[object Array]';
	}

	function parseNode(xmlNode, result) {
		if (xmlNode.nodeName == "#text" && xmlNode.nodeValue.trim() == "") {
			return;
		}

		var jsonNode = {};
		var existing = result[xmlNode.nodeName];
		if (existing) {
			if (!isArray(existing)) {
				result[xmlNode.nodeName] = [existing, jsonNode];
			}
			else {
				result[xmlNode.nodeName].push(jsonNode);
			}
		}
		else {
			if (arrayTags && arrayTags.indexOf(xmlNode.nodeName) != -1) {
				result[xmlNode.nodeName] = [jsonNode];
			}
			else {
				result[xmlNode.nodeName] = jsonNode;
			}
		}

		if (xmlNode.attributes) {
			var length = xmlNode.attributes.length;
			for (var i = 0; i < length; i++) {
				var attribute = xmlNode.attributes[i];
				jsonNode[attribute.nodeName] = attribute.nodeValue;
			}
		}

		var length = xmlNode.childNodes.length;
		for (var i = 0; i < length; i++) {
			parseNode(xmlNode.childNodes[i], jsonNode);
		}
	}

	var result = {};
	if (dom.childNodes.length) {
		parseNode(dom.childNodes[0], result);
	}

	return result;
}
