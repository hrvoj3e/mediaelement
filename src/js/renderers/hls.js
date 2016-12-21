import window from 'global/window';
import document from 'global/document';
import mejs from '../core/mejs';
import {renderer} from '../core/renderer';
import {createEvent} from '../utils/dom';
import {HAS_MSE} from '../utils/constants';
import {typeChecks} from '../utils/media';

/**
 * Native HLS renderer
 *
 * Uses DailyMotion's hls.js, which is a JavaScript library which implements an HTTP Live Streaming client.
 * It relies on HTML5 video and MediaSource Extensions for playback.
 * This renderer integrates new events associated with m3u8 files the same way Flash version of Hls does.
 * @see https://github.com/dailymotion/hls.js
 *
 */
const NativeHls = {
	/**
	 * @type {Boolean}
	 */
	isMediaStarted: false,
	/**
	 * @type {Boolean}
	 */
	isMediaLoaded: false,
	/**
	 * @type {Array}
	 */
	creationQueue: [],

	/**
	 * Create a queue to prepare the loading of an HLS source
	 * @param {Object} settings - an object with settings needed to load an HLS player instance
	 */
	prepareSettings: (settings) => {
		if (NativeHls.isLoaded) {
			NativeHls.createInstance(settings);
		} else {
			NativeHls.loadScript();
			NativeHls.creationQueue.push(settings);
		}
	},

	/**
	 * Load hls.js script on the header of the document
	 *
	 */
	loadScript: () => {
		if (!NativeHls.isMediaStarted) {

			let
				script = document.createElement('script'),
				firstScriptTag = document.getElementsByTagName('script')[0],
				done = false;

			script.src = 'https://cdn.jsdelivr.net/hls.js/latest/hls.min.js';

			// Attach handlers for all browsers
			script.onload = script.onreadystatechange = () => {
				if (!done && (!NativeHls.readyState || NativeHls.readyState === undefined ||
					NativeHls.readyState === 'loaded' || NativeHls.readyState === 'complete')) {
					done = true;
					NativeHls.mediaReady();
					script.onload = script.onreadystatechange = null;
				}
			};

			firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
			NativeHls.isMediaStarted = true;
		}
	},

	/**
	 * Process queue of HLS player creation
	 *
	 */
	mediaReady: () => {
		NativeHls.isLoaded = true;
		NativeHls.isMediaLoaded = true;

		while (NativeHls.creationQueue.length > 0) {
			let settings = NativeHls.creationQueue.pop();
			NativeHls.createInstance(settings);
		}
	},

	/**
	 * Create a new instance of HLS player and trigger a custom event to initialize it
	 *
	 * @param {Object} settings - an object with settings needed to instantiate HLS object
	 */
	createInstance: function (settings) {
		let player = new Hls(settings.options);
		window['__ready__' + settings.id](player);
	}
};

const HlsNativeRenderer = {
	name: 'native_hls',

	options: {
		prefix: 'native_hls',
		/**
		 * Custom configuration for HLS player
		 *
		 * @see https://github.com/dailymotion/hls.js/blob/master/API.md#user-content-fine-tuning
		 * @type {Object}
		 */
		hls: {
			autoStartLoad: true,
			startPosition: -1,
			capLevelToPlayerSize: false,
			debug: false,
			maxBufferLength: 30,
			maxMaxBufferLength: 600,
			maxBufferSize: 60 * 1000 * 1000,
			maxBufferHole: 0.5,
			maxSeekHole: 2,
			seekHoleNudgeDuration: 0.01,
			maxFragLookUpTolerance: 0.2,
			liveSyncDurationCount: 3,
			liveMaxLatencyDurationCount: 10,
			enableWorker: true,
			enableSoftwareAES: true,
			manifestLoadingTimeOut: 10000,
			manifestLoadingMaxRetry: 6,
			manifestLoadingRetryDelay: 500,
			manifestLoadingMaxRetryTimeout: 64000,
			levelLoadingTimeOut: 10000,
			levelLoadingMaxRetry: 6,
			levelLoadingRetryDelay: 500,
			levelLoadingMaxRetryTimeout: 64000,
			fragLoadingTimeOut: 20000,
			fragLoadingMaxRetry: 6,
			fragLoadingRetryDelay: 500,
			fragLoadingMaxRetryTimeout: 64000,
			startFragPrefech: false,
			appendErrorMaxRetry: 3,
			enableCEA708Captions: true,
			stretchShortVideoTrack: true,
			forceKeyFrameOnDiscontinuity: true,
			abrEwmaFastLive: 5.0,
			abrEwmaSlowLive: 9.0,
			abrEwmaFastVoD: 4.0,
			abrEwmaSlowVoD: 15.0,
			abrEwmaDefaultEstimate: 500000,
			abrBandWidthFactor: 0.8,
			abrBandWidthUpFactor: 0.7
		}
	},
	/**
	 * Determine if a specific element type can be played with this render
	 *
	 * @param {String} type
	 * @return {Boolean}
	 */
	canPlayType: (type) => HAS_MSE && ['application/x-mpegurl', 'vnd.apple.mpegURL',
			'audio/mpegURL', 'audio/hls', 'video/hls'].includes(type.toLowerCase()),

	/**
	 * Create the player instance and add all native events/methods/properties as possible
	 *
	 * @param {MediaElement} mediaElement Instance of mejs.MediaElement already created
	 * @param {Object} options All the player configuration options passed through constructor
	 * @param {Object[]} mediaFiles List of sources with format: {src: url, type: x/y-z}
	 * @return {Object}
	 */
	create: (mediaElement, options, mediaFiles) => {

		let
			node = null,
			originalNode = mediaElement.originalNode,
			i,
			il,
			id = mediaElement.id + '_' + options.prefix,
			hlsPlayer,
			stack = {}
			;

		node = originalNode.cloneNode(true);
		options = Object.assign(options, mediaElement.options);

		// WRAPPERS for PROPs
		let
			props = mejs.html5media.properties,
			assignGettersSetters = function (propName) {
				const capName = propName.substring(0, 1).toUpperCase() + propName.substring(1);

				node['get' + capName] = () => hlsPlayer !== null ?  node[propName] : null;

				node['set' + capName] = (value) => {
					if (hlsPlayer !== null) {
						node[propName] = value;

						if (propName === 'src') {

							hlsPlayer.detachMedia();
							hlsPlayer.attachMedia(node);

							hlsPlayer.on(Hls.Events.MEDIA_ATTACHED, () => {
								hlsPlayer.loadSource(value);
							});
						}
					} else {
						// store for after "READY" event fires
						stack.push({type: 'set', propName: propName, value: value});
					}
				};

			}
			;
		for (i = 0, il = props.length; i < il; i++) {
			assignGettersSetters(props[i]);
		}

		// Initial method to register all HLS events
		window['__ready__' + id] = (_hlsPlayer) => {

			mediaElement.hlsPlayer = hlsPlayer = _hlsPlayer;

			// do call stack
			for (i = 0, il = stack.length; i < il; i++) {

				let stackItem = stack[i];

				if (stackItem.type === 'set') {
					let propName = stackItem.propName,
						capName = propName.substring(0, 1).toUpperCase() + propName.substring(1);

					node['set' + capName](stackItem.value);
				} else if (stackItem.type === 'call') {
					node[stackItem.methodName]();
				}
			}

			// BUBBLE EVENTS
			let
				events = mejs.html5media.events, hlsEvents = Hls.Events,
				assignEvents = (eventName) => {

					if (eventName === 'loadedmetadata') {

						hlsPlayer.detachMedia();

						let url = node.src;

						hlsPlayer.attachMedia(node);
						hlsPlayer.on(hlsEvents.MEDIA_ATTACHED, () => {
							hlsPlayer.loadSource(url);
						});
					}

					node.addEventListener(eventName, (e) => {
						// copy event
						let event = document.createEvent('HTMLEvents');
						event.initEvent(e.type, e.bubbles, e.cancelable);
						// event.srcElement = e.srcElement;
						// event.target = e.srcElement;

						mediaElement.dispatchEvent(event);
					});

				}
				;

			events = events.concat(['click', 'mouseover', 'mouseout']);

			for (i = 0, il = events.length; i < il; i++) {
				assignEvents(events[i]);
			}

			/**
			 * Custom HLS events
			 *
			 * These events can be attached to the original node using addEventListener and the name of the event,
			 * not using Hls.Events object
			 * @see https://github.com/dailymotion/hls.js/blob/master/src/events.js
			 * @see https://github.com/dailymotion/hls.js/blob/master/src/errors.js
			 * @see https://github.com/dailymotion/hls.js/blob/master/API.md#runtime-events
			 * @see https://github.com/dailymotion/hls.js/blob/master/API.md#errors
			 */
			let assignHlsEvents = (e, data) => {
				let event = createEvent(e, node);
				mediaElement.dispatchEvent(event);

				if (e === 'ERROR') {

					// Destroy instance of player if unknown error found
					if (data.fatal && e === Hls.ErrorTypes.OTHER_ERROR) {
						hlsPlayer.destroy();
					}

					console.error(e, data);
				}
			};

			for (let eventType in hlsEvents) {
				if (hlsEvents.hasOwnProperty(eventType)) {
					hlsPlayer.on(hlsEvents[eventType], assignHlsEvents);
				}
			}
		};

		let filteredAttributes = ['id', 'src', 'style'];
		for (let j = 0, total = originalNode.attributes.length; j < total; j++) {
			let attribute = originalNode.attributes[j];
			if (attribute.specified && !filteredAttributes.includes(attribute.name)) {
				node.setAttribute(attribute.name, attribute.value);
			}
		}

		node.setAttribute('id', id);

		if (mediaFiles && mediaFiles.length > 0) {
			for (i = 0, il = mediaFiles.length; i < il; i++) {
				if (renderer.renderers[options.prefix].canPlayType(mediaFiles[i].type)) {
					node.src = mediaFiles[i].src;
					break;
				}
			}
		}

		node.className = '';

		originalNode.parentNode.insertBefore(node, originalNode);
		originalNode.removeAttribute('autoplay');
		originalNode.style.display = 'none';

		NativeHls.prepareSettings({
			options: options.hls,
			id: id
		});

		// HELPER METHODS
		node.setSize = (width, height) => {
			node.style.width = width + 'px';
			node.style.height = height + 'px';

			return node;
		};

		node.hide = () => {
			node.pause();
			node.style.display = 'none';
			return node;
		};

		node.show = () => {
			node.style.display = '';
			return node;
		};

		node.destroy = () => {
			hlsPlayer.destroy();
		};

		let event = createEvent('rendererready', node);
		mediaElement.dispatchEvent(event);

		return node;
	}
};

/**
 * Register Native HLS type based on URL structure
 *
 */
typeChecks.push((url) => {
	url = url.toLowerCase();
	return url.includes('.m3u8') ? 'application/x-mpegURL' : null;
});

renderer.add(HlsNativeRenderer);