import document from 'global/document';

export function addProperty (obj, name, onGet, onSet) {

	// wrapper functions
	let oldValue = obj[name];
	let getFn = () => onGet.apply(obj, [oldValue]);
	let setFn = (newValue) => {
		oldValue = onSet.apply(obj, [newValue]);
		return oldValue;
	};

	// Modern browsers, IE9+ (IE8 only works on DOM objects, not normal JS objects)
	if (Object.defineProperty) {
		Object.defineProperty(obj, name, {
			get: getFn,
			set: setFn
		});
	}
}


/**
 *
 * @param {String} input
 * @return {string}
 */
export function escapeHTML (input) {

	if (typeof input !== 'string') {
		throw new Error('Argument passed must be a string');
	}

	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;'
	};

	return input.replace(/[&<>"]/g, (c) => {
		return map[c];
	});
}

// taken from underscore
export function debounce (func, wait, immediate = false) {

	if (typeof func !== 'function') {
		throw new Error('First argument must be a function');
	}

	if (typeof wait !== 'number') {
		throw new Error('Second argument must be a numeric value');
	}

	let timeout;
	return () => {
		let context = this, args = arguments;
		let later = () => {
			timeout = null;
			if (!immediate) {
				func.apply(context, args);
			}
		};
		let callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) {
			func.apply(context, args);
		}
	};
}

/**
 * Determine if an object contains any elements
 *
 * @see http://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
 * @param {Object} instance
 * @return {Boolean}
 */
export function isObjectEmpty (instance) {
	return ((Object.getOwnPropertyNames(instance).length > 0) ? false : true);
}

export function splitEvents (events, id) {

	let rwindow = /^((after|before)print|(before)?unload|hashchange|message|o(ff|n)line|page(hide|show)|popstate|resize|storage)\b/;
	// add player ID as an event namespace so it's easier to unbind them all later
	let ret = {d: [], w: []};
	forEach((events || '').split(' '), (k, v) => {
		let eventname = v + '.' + id;
		if (eventname.indexOf('.') === 0) {
			ret.d.push(eventname);
			ret.w.push(eventname);
		}
		else {
			ret[rwindow.test(v) ? 'w' : 'd'].push(eventname);
		}
	});
	ret.d = ret.d.join(' ');
	ret.w = ret.w.join(' ');
	return ret;
}

/**
 *
 * @param {String} className
 * @param {HTMLElement} node
 * @param {String} tag
 * @return {HTMLElement[]}
 */
mejs.getElementsByClassName = (className, node, tag) => {

	if (node === undefined || node === null) {
		node = document;
	}
	if (node.getElementsByClassName !== undefined && node.getElementsByClassName !== null) {
		return node.getElementsByClassName(className);
	}
	if (tag === undefined || tag === null) {
		tag = '*';
	}

	let
		classElements = [],
		j = 0,
		teststr,
		els = node.getElementsByTagName(tag),
		elsLen = els.length
	;

	for (i = 0; i < elsLen; i++) {
		if (els[i].className.indexOf(className) > -1) {
			teststr = `,${els[i].className.split(' ').join(',')},`;
			if (teststr.indexOf(`,${className},`) > -1) {
				classElements[j] = els[i];
				j++;
			}
		}
	}

	return classElements;
};