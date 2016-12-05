import {mejs} from './namespace';

class i18n {

	constructor(language = '', strings = {}) {
		this.defaultLang = 'en';
		this.locale = {
			language : language,
			strings: strings
		};

		// i18n fixes for compatibility with WordPress
		if (typeof mejsL10n !== 'undefined') {
			this.locale.language = mejsL10n.language;
			this[mejsL10n.lang] = mejsL10n.strings;
		}
	}

	set language(language) {
		if (typeof language !== 'string') {
			throw new Error('Language code must be a string value');
		}

		if (!language.match(/^[a-z]{2}(\-[a-z]{2})?]/i)) {
			throw new Error('Language code must have format `xx` or `xx-xx`');
		}

		this._locale.language = language;
	}

	set strings(strings) {
		if (typeof strings !== 'object') {
			throw new Error('Translation strings must be an object');
		}

		this._locale.strings = strings;
	}

	get language() {
		let language = this._locale.language || this._defaultLang;
		return /^(x\-)?[a-z]{2,}(\-\w{2,})?(\-\w{2,})?$/.exec(language) ? language : this._defaultLang;
	}

	get strings() {
		return this._locale.strings;
	}

	/**
	 *
	 * @return {Function[]}
	 * @private
	 */
	pluralForms_() {
		return [
			// 0: Chinese, Japanese, Korean, Persian, Turkish, Thai, Lao, Aymará,
			// Tibetan, Chiga, Dzongkha, Indonesian, Lojban, Georgian, Kazakh, Khmer, Kyrgyz, Malay,
			// Burmese, Yakut, Sundanese, Tatar, Uyghur, Vietnamese, Wolof
			(...args) => args[1],

			// 1: Danish, Dutch, English, Faroese, Frisian, German, Norwegian, Swedish, Estonian, Finnish,
			// Hungarian, Basque, Greek, Hebrew, Italian, Portuguese, Spanish, Catalan, Afrikaans,
			// Angika, Assamese, Asturian, Azerbaijani, Bulgarian, Bengali, Bodo, Aragonese, Dogri,
			// Esperanto, Argentinean Spanish, Fulah, Friulian, Galician, Gujarati, Hausa,
			// Hindi, Chhattisgarhi, Armenian, Interlingua, Greenlandic, Kannada, Kurdish, Letzeburgesch,
			// Maithili, Malayalam, Mongolian, Manipuri, Marathi, Nahuatl, Neapolitan, Norwegian Bokmal,
			// Nepali, Norwegian Nynorsk, Norwegian (old code), Northern Sotho, Oriya, Punjabi, Papiamento,
			// Piemontese, Pashto, Romansh, Kinyarwanda, Santali, Scots, Sindhi, Northern Sami, Sinhala,
			// Somali, Songhay, Albanian, Swahili, Tamil, Telugu, Turkmen, Urdu, Yoruba
			(...args) => {
				return (args[0] === 1) ? args[1] : args[2];
			},

			// 2: French, Brazilian Portuguese, Acholi, Akan, Amharic, Mapudungun, Breton, Filipino,
			// Gun, Lingala, Mauritian Creole, Malagasy, Maori, Occitan, Tajik, Tigrinya, Uzbek, Walloon
			(...args) => {
				return ([0, 1].indexOf(args[0]) > -1) ? args[1] : args[2];
			},

			// 3: Latvian
			(...args) => {
				if (args[0] % 10 === 1 && args[0] % 100 !== 11) {
					return args[1];
				} else if (args[0] !== 0) {
					return args[2];
				} else {
					return args[3];
				}
			},

			// 4: Scottish Gaelic
			(...args) => {
				if (args[0] === 1 || args[0] === 11) {
					return args[1];
				} else if (args[0] === 2 || args[0] === 12) {
					return args[2];
				} else if (args[0] > 2 && args[0] < 20) {
					return args[3];
				} else {
					return args[4];
				}
			},

			// 5:  Romanian
			(...args) => {
				if (args[0] === 1) {
					return args[1];
				} else if (args[0] === 0 || (args[0] % 100 > 0 && args[0] % 100 < 20)) {
					return args[2];
				} else {
					return args[3];
				}
			},

			// 6: Lithuanian
			(...args) => {
				if (args[0] % 10 === 1 && args[0] % 100 !== 11) {
					return args[1];
				} else if (args[0] % 10 >= 2 && (args[0] % 100 < 10 || args[0] % 100 >= 20)) {
					return args[2];
				} else {
					return [3];
				}
			},

			// 7: Belarusian, Bosnian, Croatian, Serbian, Russian, Ukrainian
			(...args) => {
				if (args[0] % 10 === 1 && args[0] % 100 !== 11) {
					return args[1];
				} else if (args[0] % 10 >= 2 && args[0] % 10 <= 4 && (args[0] % 100 < 10 || args[0] % 100 >= 20)) {
					return args[2];
				} else {
					return args[3];
				}
			},

			// 8:  Slovak, Czech
			(...args) => {
				if (args[0] === 1) {
					return args[1];
				} else if (args[0] >= 2 && args[0] <= 4) {
					return args[2];
				} else {
					return args[3];
				}
			},

			// 9: Polish
			(...args) => {
				if (args[0] === 1) {
					return args[1];
				} else if (args[0] % 10 >= 2 && args[0] % 10 <= 4 && (args[0] % 100 < 10 || args[0] % 100 >= 20)) {
					return args[2];
				} else {
					return args[3];
				}
			},

			// 10: Slovenian
			(...args) => {
				if (args[0] % 100 === 1) {
					return args[2];
				} else if (args[0] % 100 === 2) {
					return args[3];
				} else if (args[0] % 100 === 3 || args[0] % 100 === 4) {
					return args[4];
				} else {
					return args[1];
				}
			},

			// 11: Irish Gaelic
			(...args) => {
				if (args[0] === 1) {
					return args[1];
				} else if (args[0] === 2) {
					return args[2];
				} else if (args[0] > 2 && args[0] < 7) {
					return args[3];
				} else if (args[0] > 6 && args[0] < 11) {
					return args[4];
				} else {
					return args[5];
				}
			},

			// 12: Arabic
			(...args) => {
				if (args[0] === 0) {
					return args[1];
				} else if (args[0] === 1) {
					return args[2];
				} else if (args[0] === 2) {
					return args[3];
				} else if (args[0] % 100 >= 3 && args[0] % 100 <= 10) {
					return args[4];
				} else if (args[0] % 100 >= 11) {
					return args[5];
				} else {
					return args[6];
				}
			},

			// 13: Maltese
			(...args) => {
				if (args[0] === 1) {
					return args[1];
				} else if (args[0] === 0 || (args[0] % 100 > 1 && args[0] % 100 < 11)) {
					return args[2];
				} else if (args[0] % 100 > 10 && args[0] % 100 < 20) {
					return args[3];
				} else {
					return args[4];
				}
			},

			// 14: Macedonian
			(...args) => {
				if (args[0] % 10 === 1) {
					return args[1];
				} else if (args[0] % 10 === 2) {
					return args[2];
				} else {
					return args[3];
				}
			},

			// 15:  Icelandic
			(...args) => {
				return (args[0] !== 11 && args[0] % 10 === 1) ? args[1] : args[2];
			},

			// New additions

			// 16:  Kashubian
			// Note: in https://developer.mozilla.org/en-US/docs/Mozilla/Localization/Localization_and_Plurals#List_of_Plural_Rules
			// Breton is listed as #16 but in the Localization Guide it belongs to the group 2
			(...args) => {
				if (args[0] === 1) {
					return args[1];
				} else if (args[0] % 10 >= 2 && args[0] % 10 <= 4 && (args[0] % 100 < 10 || args[0] % 100 >= 20)) {
					return args[2];
				} else {
					return args[3];
				}
			},

			// 17:  Welsh
			(...args) => {
				if (args[0] === 1) {
					return args[1];
				} else if (args[0] === 2) {
					return args[2];
				} else if (args[0] !== 8 && args[0] !== 11) {
					return args[3];
				} else {
					return args[4];
				}
			},

			// 18:  Javanese
			(...args) => {
				return (args[0] === 0) ? args[1] : args[2];
			},

			// 19:  Cornish
			(...args) => {
				if (args[0] === 1) {
					return args[1];
				} else if (args[0] === 2) {
					return args[2];
				} else if (args[0] === 3) {
					return args[3];
				} else {
					return args[4];
				}
			},

			// 20:  Mandinka
			(...args) => {
				if (args[0] === 0) {
					return args[1];
				} else if (args[0] === 1) {
					return args[2];
				} else {
					return args[3];
				}
			}

		];
	}

	t(message, pluralParam) {

		if (typeof message === 'string' && message.length) {

			let
				str,
				pluralForm
			;

			/**
			 * Modify string using algorithm to detect plural forms.
			 *
			 * @private
			 * @see http://stackoverflow.com/questions/1353408/messageformat-in-javascript-parameters-in-localized-ui-strings
			 * @param {String|String[]} input   - String or array of strings to pick the plural form
			 * @param {Number} number           - Number to determine the proper plural form
			 * @param {Number} form             - Number of language family to apply plural form
			 * @return {String}
			 */
			const plural = (input, number, form) => {

				if (typeof input !== 'object' || typeof number !== 'number' || typeof form !== 'number') {
					return input;
				}

				if (typeof input === 'string') {
					return input;
				}

				// Perform plural form or return original text
				return this.pluralForms_[form].apply(null, [number].concat(input));
			};
			/**
			 *
			 * @param {String} input
			 * @return {String}
			 */
			const escapeHTML = (input) => {
				const map = {
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					'"': '&quot;'
				};

				return input.replace(/[&<>"]/g, (c) => {
					return map[c];
				});
			};

			// Fetch the localized version of the string
			if (this.locale.strings && this.locale.strings[language]) {
				str = this.locale.strings[language][message];
				if (typeof pluralParam === 'number') {
					pluralForm = this.locale.strings[language]['mejs.plural-form'];
					str = plural.apply(null, [str, pluralParam, pluralForm]);
				}
			}

			// Fallback to default language if requested uid is not translated
			if (!str && this.locale.strings && this.locale.strings[this.defaultLang]) {
				str = this.locale.strings[this.defaultLang][message];
				if (typeof pluralParam === 'number') {
					pluralForm = this.locale.strings[this.defaultLang]['mejs.plural-form'];
					str = plural.apply(null, [str, pluralParam, pluralForm]);

				}
			}

			// As a last resort, use the requested uid, to mimic original behavior of i18n utils
			// (in which uid was the english text)
			str = str || message;

			// Replace token
			if (typeof pluralParam === 'number') {
				str = str.replace('%1', pluralParam);
			}

			return escapeHTML(str);

		}

		return message;
	}
}

mejs.i18n = new i18n();

export default mejs.i18n;