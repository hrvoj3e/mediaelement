class Utility {

	set typeChecks (typeChecks) {

		if (!Array.isArray(typeChecks)) {
			throw new Error('`typeChecks` must be an array');
		}

		if (typeChecks.length) {
			for (let element of typeChecks) {
				if (typeof element !== 'function') {
					throw new Error('Element in array must be a function');
				}
			}
		}

		this._typeChecks = typeChecks;
	}

	get typeChecks () {
		return this._typeChecks;
	}

	// addProperty (obj, name, onGet, onSet) {
	//
	// 	// wrapper functions
	// 	let oldValue = obj[name];
	// 	let getFn = () => {
	// 		return onGet.apply(obj, [oldValue]);
	// 	};
	// 	let setFn = (newValue) => {
	// 		oldValue = onSet.apply(obj, [newValue]);
	// 		return oldValue;
	// 	};
	//
	// 	// Modern browsers, IE9+ (IE8 only works on DOM objects, not normal JS objects)
	// 	if (Object.defineProperty) {
	// 		Object.defineProperty(obj, name, {
	// 			get: getFn,
	// 			set: setFn
	// 		});
	// 	}
	// }

	/**
	 * Get the format of a specific media, based on URL and additionally its mime type
	 *
	 * @param {String} url
	 * @param {String} type
	 * @return {String}
	 */
	formatType (url, type = '') {
		return (url && !type) ? this.getTypeFromFile(url) : this.getMimeFromType(type);
	}

	/**
	 * Return the mime part of the type in case the attribute contains the codec
	 * (`video/mp4; codecs="avc1.42E01E, mp4a.40.2"` becomes `video/mp4`)
	 *
	 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#the-source-element
	 * @param {String} type
	 * @return {String}
	 */
	getMimeFromType (type) {

		if (typeof type !== 'string') {
			throw new Error('`type` argument must be a string');
		}

		return (type && ~type.indexOf(';')) ? type.substr(0, type.indexOf(';')) : type;
	}

	/**
	 * Get the type of media based on URL structure
	 *
	 * @param {String} url
	 * @return {String}
	 */
	getTypeFromFile (url) {

		if (typeof url !== 'string') {
			throw new Error('`url` argument must be a string');
		}

		let type;

		// do type checks first
		for (let check of this.typeChecks) {
			type = check(url);

			if (type !== undefined && type !== null) {
				return type;
			}
		}

		// the do standard extension check
		let
			ext = this.getExtension(url),
			normalizedExt = this.normalizeExtension(ext)
		;

		return (/(mp4|m4v|ogg|ogv|webm|webmv|flv|wmv|mpeg|mov)/gi.test(ext) ? 'video' : 'audio') + '/' + normalizedExt;
	}

	/**
	 * Get media file extension from URL
	 *
	 * @param {String} url
	 * @return {String}
	 */
	getExtension (url) {

		if (typeof url !== 'string') {
			throw new Error('`url` argument must be a string');
		}

		let baseUrl = url.split('?')[0];

		return ~baseUrl.indexOf('.') ? baseUrl.substring(baseUrl.lastIndexOf('.') + 1) : '';
	}

	/**
	 * Get standard extension of a media file
	 *
	 * @param {String} extension
	 * @return {String}
	 */
	normalizeExtension (extension) {

		if (typeof extension !== 'string') {
			throw new Error('`extension` argument must be a string');
		}

		switch (extension) {
			case 'mp4':
			case 'm4v':
				return 'mp4';
			case 'webm':
			case 'webma':
			case 'webmv':
				return 'webm';
			case 'ogg':
			case 'oga':
			case 'ogv':
				return 'ogg';
			default:
				return extension;
		}
	}

	/**
	 *
	 * @param {String} output
	 * @return {string}
	 */
	escapeHTML (output) {

		if (typeof output !== 'string') {
			throw new Error('Argument passed must be a string');
		}

		return output.toString().split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
	}

	/**
	 * Format a numeric time in format '00:00:00'
	 *
	 * @param {number} time
	 * @param {Boolean} forceHours
	 * @param {Boolean} showFrameCount
	 * @param {number} fps - Frames per second
	 * @return {String}
	 */
	secondsToTimeCode (time, forceHours = false, showFrameCount = false, fps = 25) {

		if (typeof time !== 'number') {
			throw new Error('Time must be a numeric value');
		}

		let hours = Math.floor(time / 3600) % 24;
		let minutes = Math.floor(time / 60) % 60;
		let seconds = Math.floor(time % 60);
		let frames = Math.floor(((time % 1) * fps).toFixed(3));

		let result = (forceHours || hours > 0) ? `${(hours < 10 ? `0${hours}` : hours)}:` : '';
		result += `${(minutes < 10 ? '0' + minutes : minutes)}:`;
		result += `${(seconds < 10 ? '0' + seconds : seconds)}`;
		result += `${((showFrameCount) ? `:${(frames < 10 ? `0${frames}` : frames)}` : '')}`;

		return result;
	}

	/**
	 * Convert a '00:00:00' time string into seconds
	 *
	 * @param {String} time
	 * @param {Boolean} showFrameCount
	 * @param {number} fps - Frames per second
	 * @return {number}
	 */
	timeCodeToSeconds (time, showFrameCount = false, fps = 25) {

		if (typeof time !== 'string') {
			throw new Error('Time must be a string');
		}

		if (!time.match(/\d{2}(\:\d{2}){0,3}/)) {
			throw new Error('Time code must have the format `00:00:00`');
		}

		let
			parts = time.split(':'),
			hours = 0,
			minutes = 0,
			frames = 0,
			seconds = 0,
			output
		;

		switch (parts.length) {
			default:
			case 1:
				seconds = parseInt(parts[0], 10);
				break;
			case 2:
				minutes = parseInt(parts[0], 10);
				seconds = parseInt(parts[1], 10);
				break;
			case 3:
			case 4:
				hours = parseInt(parts[0], 10);
				minutes = parseInt(parts[1], 10);
				seconds = parseInt(parts[2], 10);
				frames = showFrameCount ? parseInt(parts[3]) / fps : 0;
				break;

		}

		output = ( hours * 3600 ) + ( minutes * 60 ) + seconds + frames;
		return parseFloat((output).toFixed(3));
	}

	/**
	 * Calculate the time format to use
	 *
	 * There is a default format set in the options but it can be incomplete, so it is adjusted according to the media
	 * duration. Format: 'hh:mm:ss:ff'
	 * @param {number} time
	 * @param {Object} options
	 * @param {number} fps - Frames per second
	 */
	calculateTimeFormat (time, options, fps = 25) {

		if (typeof time !== 'number') {
			throw new Error('Time must be a numeric value');
		}

		time = time < 0 ? 0 : time;

		let
			required = false,
			format = options.timeFormat,
			firstChar = format[0],
			firstTwoPlaces = (format[1] == format[0]),
			separatorIndex = firstTwoPlaces ? 2 : 1,
			separator = format.length < separatorIndex ? format[separatorIndex] : ':',
			hours = Math.floor(time / 3600) % 24,
			minutes = Math.floor(time / 60) % 60,
			seconds = Math.floor(time % 60),
			frames = Math.floor(((time % 1) * fps).toFixed(3)),
			lis = [
				[frames, 'f'],
				[seconds, 's'],
				[minutes, 'm'],
				[hours, 'h']
			]
		;

		for (let i = 0, len = lis.length; i < len; i++) {
			if (format.indexOf(lis[i][1]) !== -1) {
				required = true;
			}
			else if (required) {
				let hasNextValue = false;
				for (let j = i; j < len; j++) {
					if (lis[j][0] > 0) {
						hasNextValue = true;
						break;
					}
				}

				if (!hasNextValue) {
					break;
				}

				if (!firstTwoPlaces) {
					format = firstChar + format;
				}
				format = lis[i][1] + separator + format;
				if (firstTwoPlaces) {
					format = lis[i][1] + format;
				}
				firstChar = lis[i][1];
			}
		}

		options.currentTimeFormat = format;
	}

	/**
	 * Convert Society of Motion Picture and Television Engineers (SMTPE) time code into seconds
	 *
	 * @param {String} SMPTE
	 * @return {number|Boolean}
	 */
	convertSMPTEtoSeconds (SMPTE) {

		if (typeof SMPTE !== 'string') {
			throw new Error('Argument must be a string value');
		}

		SMPTE = SMPTE.replace(',', '.');

		let
			secs = 0,
		 	decimalLen = (SMPTE.indexOf('.') != -1) ? SMPTE.split('.')[1].length : 0,
			multiplier = 1
		;

		SMPTE = SMPTE.split(':').reverse();

		for (var i = 0; i < SMPTE.length; i++) {
			multiplier = 1;
			if (i > 0) {
				multiplier = Math.pow(60, i);
			}
			secs += Number(SMPTE[i]) * multiplier;
		}
		return Number(secs.toFixed(decimalLen));
	}

	// taken from underscore
	debounce (func, wait, immediate = false) {

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
	isObjectEmpty (instance) {
		return ((Object.getOwnPropertyNames(instance).length > 0) ? false : true);
	}
}

export let utility = new Utility();
