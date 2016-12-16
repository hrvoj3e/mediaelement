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

	if (typeof output !== 'string') {
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
		let later = function () {
			timeout = null;
			if (!immediate) func.apply(context, args);
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
