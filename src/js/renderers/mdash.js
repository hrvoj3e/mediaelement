"use strict";

import window from 'global/window';
import document from 'global/document';
import mejs from '../core/mejs';
import {renderer} from '../core/renderer';
import {createEvent} from '../utils/dom';
import {typeChecks} from '../utils/media';
import {HAS_MSE} from '../utils/constants';

/**
 * Native M-Dash renderer
 *
 * Uses dash.js, a reference client implementation for the playback of MPEG DASH via Javascript and compliant browsers.
 * It relies on HTML5 video and MediaSource Extensions for playback.
 * This renderer integrates new events associated with mpd files.
 * @see https://github.com/Dash-Industry-Forum/dash.js
 *
 */
const NativeDash = {
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
		if (NativeDash.isLoaded) {
			NativeDash.createInstance(settings);
		} else {
			NativeDash.loadScript();
			NativeDash.creationQueue.push(settings);
		}
	},

	/**
	 * Load dash.all.min.js script on the header of the document
	 *
	 */
	loadScript: () => {
		if (!NativeDash.isScriptLoaded) {

			let
				script = document.createElement('script'),
				firstScriptTag = document.getElementsByTagName('script')[0],
				done = false;

			// script.src = 'https://cdn.dashjs.org/latest/dash.all.min.js';
			script.src = 'https://cdn.dashjs.org/latest/dash.mediaplayer.min.js';

			// Attach handlers for all browsers
			script.onload = script.onreadystatechange = () => {
				if (!done && (!NativeDash.readyState || NativeDash.readyState === undefined ||
					NativeDash.readyState === 'loaded' || NativeDash.readyState === 'complete')) {
					done = true;
					NativeDash.mediaReady();
					script.onload = script.onreadystatechange = null;
				}
			};

			firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
			NativeDash.isScriptLoaded = true;
		}
	},

	/**
	 * Process queue of Dash player creation
	 *
	 */
	mediaReady: () => {

		NativeDash.isLoaded = true;
		NativeDash.isScriptLoaded = true;

		while (NativeDash.creationQueue.length > 0) {
			let settings = NativeDash.creationQueue.pop();
			NativeDash.createInstance(settings);
		}
	},

	/**
	 * Create a new instance of Dash player and trigger a custom event to initialize it
	 *
	 * @param {Object} settings - an object with settings needed to instantiate HLS object
	 */
	createInstance: (settings) => {

		let player = dashjs.MediaPlayer().create();
		window['__ready__' + settings.id](player);
	}
};

let DashNativeRenderer = {
	name: 'native_mdash',

	options: {
		prefix: 'native_mdash',
		dash: {}
	},
	/**
	 * Determine if a specific element type can be played with this render
	 *
	 * @param {String} type
	 * @return {Boolean}
	 */
	canPlayType: (type) => HAS_MSE && ['application/dash+xml'].includes(type),

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
			dashPlayer,
			stack = {}
			;

		node = originalNode.cloneNode(true);

		// WRAPPERS for PROPs
		let
			props = mejs.html5media.properties,
			assignGettersSetters = (propName) => {
				const capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`;

				node[`get${capName}`] = () => (dashPlayer !== null) ? node[propName] : null;

				node[`set${capName}`] = (value) => {
					if (dashPlayer !== null) {
						if (propName === 'src') {

							dashPlayer.attachSource(value);

							if (node.getAttribute('autoplay')) {
								node.play();
							}
						}

						node[propName] = value;
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

		// Initial method to register all M-Dash events
		window['__ready__' + id] = (_dashPlayer) => {

			mediaElement.dashPlayer = dashPlayer = _dashPlayer;

			// By default, console log is off
			dashPlayer.getDebug().setLogToBrowserConsole(false);

			// do call stack
			for (i = 0, il = stack.length; i < il; i++) {

				let stackItem = stack[i];

				if (stackItem.type === 'set') {
					let propName = stackItem.propName,
						capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`;

					node[`set${capName}`](stackItem.value);
				} else if (stackItem.type === 'call') {
					node[stackItem.methodName]();
				}
			}

			// BUBBLE EVENTS
			let
				events = mejs.html5media.events, dashEvents = dashjs.MediaPlayer.events,
				assignEvents = (eventName) => {

					if (eventName === 'loadedmetadata') {
						dashPlayer.initialize(node, node.src, false);
					}

					node.addEventListener(eventName, (e) => {
						let event = document.createEvent('HTMLEvents');
						event.initEvent(e.type, e.bubbles, e.cancelable);
						// @todo Check this
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
			 * Custom M(PEG)-DASH events
			 *
			 * These events can be attached to the original node using addEventListener and the name of the event,
			 * not using dashjs.MediaPlayer.events object
			 * @see http://cdn.dashjs.org/latest/jsdoc/MediaPlayerEvents.html
			 */
			let assignMdashEvents = (e, data) => {
				let event = createEvent(e.type, node);
				mediaElement.dispatchEvent(event);

				if (e === 'error') {
					console.error(e, data);
				}
			};

			for (let eventType in dashEvents) {
				if (dashEvents.hasOwnProperty(eventType)) {
 					dashPlayer.on(dashEvents[eventType], assignMdashEvents);
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
					node.setAttribute('src', mediaFiles[i].src);
					break;
				}
			}
		}

		node.className = '';
		if (!originalNode.paused) {
			originalNode.pause();
		}

		originalNode.parentNode.insertBefore(node, originalNode);
		originalNode.removeAttribute('autoplay');
		originalNode.style.display = 'none';

		NativeDash.prepareSettings({
			options: options.dash,
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

		let event = createEvent('rendererready', node);
		mediaElement.dispatchEvent(event);

		return node;
	}
};

/**
 * Register Native M(PEG)-Dash type based on URL structure
 *
 */
typeChecks.push((url) => {
	url = url.toLowerCase();
	return url.includes('.mpd') ? 'application/dash+xml' : null;
});

renderer.add(DashNativeRenderer);