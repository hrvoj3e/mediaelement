'use strict';

import {utility} from '../../src/js/utils/utility';
import {expect} from 'chai';

describe('Utility', () => {

	function* entries(obj) {
		for (let key of Object.keys(obj)) {
			yield [key, obj[key]];
		}
	}

	describe('#construct', () => {

		it('accepts an array of methods for `typeCheck`', () => {
			let typeChecks = [
				() => true,
				() => true,
				() => true
			];

			expect(() => {
				utility.typeChecks = typeChecks;
				expect(utility.typeChecks.length).to.equal(3);
			}).to.not.throw(Error);
		});

		it('can only have an array of methods', () => {
			let typeChecks = [
				'dummy',
				() => true,
				() => true
			];

			expect(() => {
				utility.typeChecks = typeChecks;
			}).to.throw(Error);
		});

		it('can only accepts arrays', () => {
			let test = () => {
				utility.typeChecks = {};
			};

			expect(test).to.throw(Error);
		});
	});

	describe('#addProperty', () => {

	});

	describe('#formatType', () => {

		it('returns the format of a specific media using ONLY a URL', () => {

			const url = 'http://example.com/media.mp4';
			utility.typeChecks = [
				(url) => {
					if (url.match(/.mp4/)) {
						return 'video/mp4';
					}
				},
				(url) => {
					if (url.match(/.mp3/)) {
						return 'audio/mp3';
					}
				}

			];

			expect(utility.formatType(url)).to.equal('video/mp4');

		});

		it('returns the format of a specific media, using URL and MIME type', () => {

			const
				url = 'http://example.com/media.mp4',
				type = 'audio/mp3; codecs="avc1.42E01E, mp3a.40.2'
			;

			expect(utility.formatType(url, type)).to.equal('audio/mp3');
		});
	});

	describe('#getMimeFromType', () => {

		it('returns the proper MIME type part in case the attribute contains codec specification', () => {

			const type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
			expect(utility.getMimeFromType(type)).to.equal('video/mp4');

		});

		it('returns the proper MIME type part in case the attribute DOES NOT contains codec specification', () => {

			const type = 'video/mp4';
			expect(utility.getMimeFromType(type)).to.equal('video/mp4');
		});

		it('can only accept strings', () => {

			const
				type = [],
				test = () => {
					utility.getMimeFromType(type);
				};
			expect(test).to.throw(Error);
		});
	});

	describe('#getTypeFromFile', () => {

		it('returns the type of media based on URL structure', () => {

			const typeChecks = [
				(url) => {
					if (url.match(/.mp4/)) {
						return 'video/mp4';
					}
				},
				(url) => {
					if (url.match(/.mp3/)) {
						return 'audio/mp3';
					}
				}

			];
			utility.typeChecks = typeChecks;

			expect(utility.getTypeFromFile('http://example.com/media.mp4')).to.equal('video/mp4');
			expect(utility.getTypeFromFile('http://example.com/media.mp3')).to.equal('audio/mp3');

		});

		it('can only accept strings', () => {

			const
				type = {},
				test = () => {
					utility.getTypeFromFile(type);
				};
			expect(test).to.throw(Error);
		});
	});

	describe('#getExtension', () => {

		it('returns the media file extension from a URL', () => {

			const media = {
				'mp4': 'http://example.com/media.mp4',
				'm3u8': 'http://example.com/media.m3u8?string=dummy&manifest=123',
				'html': 'http://example.com/media.html',
				'': 'lorem ipsum'
			};

			for (let[ext, url] of entries(media)) {
				expect(utility.getExtension(url)).to.equal(ext);
			}
		});

		it('can only accept strings', () => {

			let
				type = {},
				test = () => {
					utility.getExtension(type);
				};
			expect(test).to.throw(Error);
		});
	});

	describe('#normalizeExtension', () => {

		// beforeEach(() => {
		// 	utilityObj = new utility();
		// });

		it('returns the standard extension of a media file', () => {

			let extensions = {
				'm4v': 'mp4',
				'webma': 'webm',
				'webm': 'webm',
				'm3u8': 'm3u8',
				'oga': 'ogg',
				'ogg': 'ogg'
			};

			for (let[ext, normal] of entries(extensions)) {
				expect(utility.normalizeExtension(ext)).to.equal(normal);
			}
		});

		it('can only accept strings', () => {

			let
				type = {},
				test = () => {
					utility.normalizeExtension(type);
				};
			expect(test).to.throw(Error);
		});
	});

	describe('#escapeHTML', () => {

		it('can escape `<`, `"`, `&` symbols', () => {

			const html = '<p>Hello, "world" & welcome!</p>';
			expect(utility.escapeHTML(html)).to.equal('&lt;p>Hello, &quot;world&quot; &amp; welcome!&lt;/p>');
		});

		it('can only accept strings', () => {

			let
				type = {},
				test = () => {
					utility.escapeHTML(type);
				};
			expect(test).to.throw(Error);
		});
	});

	describe('#secondsToTimeCode', () => {

		it('can format a numeric time in format `00:00:00`', () => {

			expect(utility.secondsToTimeCode(36)).to.equal('00:36');
			expect(utility.secondsToTimeCode(70)).to.equal('01:10');
			expect(utility.secondsToTimeCode(3600)).to.equal('01:00:00');
			expect(utility.secondsToTimeCode(3660)).to.equal('01:01:00');
		});

		it('can force hours to be displayed', () => {

			expect(utility.secondsToTimeCode(36, true)).to.equal('00:00:36');
			expect(utility.secondsToTimeCode(70, true)).to.equal('00:01:10');
			expect(utility.secondsToTimeCode(3600, true)).to.equal('01:00:00');
		});

		it('can show the number of frames multiplying the decimal portion of time by the frames per second indicated', () => {

			expect(utility.secondsToTimeCode(36.45, false, true, 32)).to.equal('00:36:14');
			expect(utility.secondsToTimeCode(70.89, true, true, 40)).to.equal('00:01:10:35');
			expect(utility.secondsToTimeCode(3600.234, true, true)).to.equal('01:00:00:05');
		});

		it('can only accept numeric values for the time', () => {

			let
				type = {},
				test = () => {
					utility.secondsToTimeCode(type);
				};
			expect(test).to.throw(Error);
		});
	});

	describe('#timeCodeToSeconds', () => {

		it('returns a numeric value from a string with format `00:00:00` ', () => {

			expect(utility.timeCodeToSeconds('20')).to.equal(20);
			expect(utility.timeCodeToSeconds('00:36')).to.equal(36);
			expect(utility.timeCodeToSeconds('01:10')).to.equal(70);
			expect(utility.timeCodeToSeconds('01:00:00')).to.equal(3600);
		});

		it('can show the numeric value with decimals of time when frames per second are indicated', () => {

			expect(utility.timeCodeToSeconds('00:00:36:14', true, 32)).to.equal(36.438);
			expect(utility.timeCodeToSeconds('00:01:10:35', true, 40)).to.equal(70.875);
			expect(utility.timeCodeToSeconds('01:00:00:05', true)).to.equal(3600.2);
		});

		it('can only accept a string for the time', () => {

			let
				type = {},
				test = () => {
					utility.timeCodeToSeconds(type);
				};
			expect(test).to.throw(Error);
		});

		it('can only accept a string with format `00:00:00`', () => {

			let
				type = 'dummy',
				test = () => {
					utility.timeCodeToSeconds(type);
				};
			expect(test).to.throw(Error);
		});

	});

	describe('#calculateTimeFormat', () => {

		let options = {
			timeFormat: 'mm:ss',
			currentTimeFormat: '',
		};

		it('attempts to fix time format (i.e., `hh:mm:ss:ff`)', () => {
			utility.calculateTimeFormat(36, options);
			expect(options.currentTimeFormat).to.equal('mm:ss');

			utility.calculateTimeFormat(3600, options);
			expect(options.currentTimeFormat).to.equal('hh:mm:ss');

			utility.calculateTimeFormat(36.432, options, 32);
			expect(options.currentTimeFormat).to.equal('mm:ss');
		});

		it('can only accept numeric values for the time', () => {

			let
				type = {},
				test = () => {
					utility.calculateTimeFormat(type);
				};
			expect(test).to.throw(Error);
		});

	});

	describe('#convertSMPTEtoSeconds', () => {

		it('returns a number when passing a `00:00:00.00` formatted string', () => {
			expect(utility.convertSMPTEtoSeconds('00:12.34')).to.equal(12.34);
		});

		it('can only accept a string value for time', () => {

			let
				type = {},
				test = () => {
					utility.convertSMPTEtoSeconds(type);
				};
			expect(test).to.throw(Error);
		});

	});

	describe('#debounce', function() {

		it('executes a method in an specific interval of time', () => {

			let
				hasHappened = false,
				fn = utility.debounce(() => {
					hasHappened = true;
				}, 100, true)
			;

			expect(hasHappened).to.be.false

			fn();

			expect(hasHappened).to.be.true

			setTimeout(() => {

				utility.debounce(() => {
					hasHappened = true;
				}, 100);

				expect(hasHappened).to.be.true
			}, 100);
		});

		it('can only accept a method as a first argument', () => {

			let
				type = {},
				test = () => {
					utility.debounce(type, 100);
				};
			expect(test).to.throw(Error);
		});

		it('can only accept a numeric value as a asecond argument', () => {

			let
				test = () => {
					utility.debounce(() => {
						return;
					}, 'dummy');
				};
			expect(test).to.throw(Error);
		});

	});

	describe('#isObjectEmpty', () => {

		it('checks effectively that an object is empty', () => {
			let
				empty = {},
				nonEmpty = {name: 'aaa', alias: 'bbbb'}
			;

			expect(utility.isObjectEmpty(empty)).to.equal(true);
			expect(utility.isObjectEmpty(nonEmpty)).to.equal(false);
		});

	});

});
