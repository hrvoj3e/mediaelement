import window from 'global/window';
import document from 'global/document';
import mejs from '../core/mejs';
import {renderer} from '../core/renderer';
import {createEvent} from '../utils/dom';
import {HAS_MSE} from '../utils/constants';
import {typeChecks} from '../utils/media';

/**
 * Native FLV renderer
 *
 * Uses flv.js, which is a JavaScript library which implements mechanisms to play flv files inspired by flv.js.
 * It relies on HTML5 video and MediaSource Extensions for playback.
 * Currently, it can only play files with the same origin.
 *
 * @see https://github.com/Bilibili/flv.js
 *
 */
const NativeFlv = {
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
	 * Create a queue to prepare the loading of an FLV source
	 * @param {Object} settings - an object with settings needed to load an FLV player instance
	 */
	prepareSettings: function (settings) {
		if (NativeFlv.isLoaded) {
			NativeFlv.createInstance(settings);
		} else {
			NativeFlv.loadScript();
			NativeFlv.creationQueue.push(settings);
		}
	},

	/**
	 * Load flv.js script on the header of the document
	 *
	 */
	loadScript: () => {
		if (!NativeFlv.isMediaStarted) {

			let
				script = document.createElement('script'),
				firstScriptTag = document.getElementsByTagName('script')[0],
				done = false;

			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/flv.js/1.1.0/flv.min.js';

			// Attach handlers for all browsers
			script.onload = script.onreadystatechange = () => {
				if (!done && (!NativeFlv.readyState || NativeFlv.readyState === undefined ||
					NativeFlv.readyState === 'loaded' || NativeFlv.readyState === 'complete')) {
					done = true;
					NativeFlv.mediaReady();
					script.onload = script.onreadystatechange = null;
				}
			};

			firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
			NativeFlv.isMediaStarted = true;
		}
	},

	/**
	 * Process queue of FLV player creation
	 *
	 */
	mediaReady: () => {
		NativeFlv.isLoaded = true;
		NativeFlv.isMediaLoaded = true;

		while (NativeFlv.creationQueue.length > 0) {
			let settings = NativeFlv.creationQueue.pop();
			NativeFlv.createInstance(settings);
		}
	},

	/**
	 * Create a new instance of FLV player and trigger a custom event to initialize it
	 *
	 * @param {Object} settings - an object with settings needed to instantiate FLV object
	 */
	createInstance: function (settings) {
		let player = flvjs.createPlayer(settings.options);
		window['__ready__' + settings.id](player);
	}
};

const FlvNativeRenderer = {
	name: 'native_flv',

	options: {
		prefix: 'native_flv',
		/**
		 * Custom configuration for FLV player
		 *
		 * @see https://github.com/Bilibili/flv.js/blob/master/docs/api.md#config
		 * @type {Object}
		 */
		flv: {
			cors: true,
			enableWorker: false,
			enableStashBuffer: true,
			stashInitialSize: undefined,
			isLive: false,
			lazyLoad: true,
			lazyLoadMaxDuration: 3 * 60,
			deferLoadAfterSourceOpen: true,
			statisticsInfoReportInterval: 600,
			accurateSeek: false,
			seekType: 'range',  // [range, param, custom]
			seekParamStart: 'bstart',
			seekParamEnd: 'bend',
			rangeLoadZeroStart: false,
			customSeekHandler: undefined
		}
	},
	/**
	 * Determine if a specific element type can be played with this render
	 *
	 * @param {String} type
	 * @return {Boolean}
	 */
	canPlayType: (type) => HAS_MSE && ['video/x-flv', 'video/flv'].includes(type),

	/**
	 * Create the player instance and add all native events/methods/properties as possible
	 *
	 * @param {MediaElement} mediaElement Instance of mejs.MediaElement already created
	 * @param {Object} options All the player configuration options passed through constructor
	 * @param {Object[]} mediaFiles List of sources with format: {src: url, type: x/y-z}
	 * @return {Object}
	 */
	create: function (mediaElement, options, mediaFiles) {

		let
			node = null,
			originalNode = mediaElement.originalNode,
			i,
			il,
			id = mediaElement.id + '_' + options.prefix,
			flvPlayer,
			stack = {}
		;

		node = originalNode.cloneNode(true);
		options = Object.assign(options, mediaElement.options);

		// WRAPPERS for PROPs
		let
			props = mejs.html5media.properties,
			assignGettersSetters = (propName) => {
				let capName = propName.substring(0, 1).toUpperCase() + propName.substring(1);

				node['get' + capName] = () => flvPlayer !== null ?  node[propName] : null;

				node['set' + capName] = (value) => {
					if (flvPlayer !== null) {
						node[propName] = value;

						if (propName === 'src') {
							flvPlayer.detachMediaElement();
							flvPlayer.attachMediaElement(node);
							flvPlayer.load();
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

		// Initial method to register all FLV events
		window['__ready__' + id] = (_flvPlayer) => {

			mediaElement.flvPlayer = flvPlayer = _flvPlayer;

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
				events = mejs.html5media.events,
				assignEvents = (eventName) => {

					if (eventName === 'loadedmetadata') {

						flvPlayer.detachMediaElement();
						flvPlayer.attachMediaElement(node);
						flvPlayer.load();
					}

					node.addEventListener(eventName, (e) => {
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

		// Options that cannot be overridden
		options.flv.type = 'flv';
		options.flv.url = node.getAttribute('src');

		NativeFlv.prepareSettings({
			options: options.flv,
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
			flvPlayer.destroy();
		};

		let event = createEvent('rendererready', node);
		mediaElement.dispatchEvent(event);

		return node;
	}
};

/**
 * Register Native FLV type based on URL structure
 *
 */
typeChecks.push((url) => {
	url = url.toLowerCase();
	return url.includes('.flv') ? 'video/flv' : null;
});

renderer.add(FlvNativeRenderer);
