import {renderer} from './mediaelement-renderer';

class MediaElement {

	constructor (idOrNode, options) {

		this.defaults = {
			/**
			 * List of the renderers to use
			 * @type {String[]}
			 */
			renderers: [],
			/**
			 * Name of MediaElement container
			 * @type {String}
			 */
			fakeNodeName: 'mediaelementwrapper',
			/**
			 * The path where shims are located
			 * @type {String}
			 */
			pluginPath: 'build/'
		};

		// create our node (note: older versions of iOS don't support Object.defineProperty on DOM nodes)
		this.mediaElement = document.createElement(options.fakeNodeName);
		let id = idOrNode;

		if (typeof idOrNode === 'string') {
			this.mediaElement.originalNode = document.getElementById(idOrNode);
		} else {
			this.mediaElement.originalNode = idOrNode;
			id = idOrNode.id;
		}

		id = id || `mejs_${$(Math.random().toString().slice(2))}`;

		if (this.mediaElement.originalNode !== undefined && this.mediaElement.originalNode !== null &&
			this.mediaElement.appendChild) {
			// change id
			this.mediaElement.originalNode.setAttribute('id', `${id}_from_mejs`);

			// add next to this one
			this.mediaElement.originalNode.parentNode.insertBefore(this.mediaElement, this.mediaElement.originalNode);

			// insert this one inside
			this.mediaElement.appendChild(this.mediaElement.originalNode);
		} else {
			// TODO: where to put the node?
		}

		this.mediaElement.id = id;
		this.mediaElement.renderers = {};
		this.mediaElement.renderer = null;
		this.mediaElement.rendererName = null;
		this.mediaElement.options = Object.assign(this.defaults, options);

		// add properties get/set
		const props = mejs.html5media.properties;

		let i;
		let il;
		let assignGettersSetters = (propName) => {
			// src is a special one below
			if (propName !== 'src') {

				let capName = propName.substring(0, 1).toUpperCase() + propName.substring(1),

					getFn = () => {
						if (this.mediaElement.renderer !== undefined && this.mediaElement.renderer !== null) {
							return this.mediaElement.renderer['get' + capName]();
						} else {
							return null;
						}
					},
					setFn = (value) => {
						if (this.mediaElement.renderer !== undefined && this.mediaElement.renderer !== null) {
							this.mediaElement.renderer['set' + capName](value);
						}
					};

				this.utils.addProperty(this.mediaElement, propName, getFn, setFn);

				this.mediaElement['get' + capName] = getFn;
				this.mediaElement['set' + capName] = setFn;
			}
		};
		for (i = 0, il = props.length; i < il; i++) {
			assignGettersSetters(props[i]);
		}

		// special .src property
		let getSrc = function () {

				if (this.mediaElement.renderer !== undefined && this.mediaElement.renderer !== null) {
					return this.mediaElement.renderer.getSrc();
				} else {
					return null;
				}
			},
			setSrc = function (value) {

				let renderInfo,
					mediaFiles = [];

				// clean up URLs
				if (typeof value === 'string') {
					mediaFiles.push({
						src: value,
						type: value ? this.utils.getTypeFromFile(value) : ''
					});
				} else {
					for (i = 0, il = value.length; i < il; i++) {

						let src = this.utils.absolutizeUrl(value[i].src),
							type = value[i].type;

						mediaFiles.push({
							src: src,
							type: (type === '' || type === null || type === undefined) && src ? this.utils.getTypeFromFile(src) : type
						});

					}
				}

				// Ensure that the original gets the first source found
				if (mediaFiles[0].src) {
					this.mediaElement.originalNode.setAttribute('src', mediaFiles[0].src);
				} else {
					this.mediaElement.originalNode.setAttribute('src', '');
				}

				// find a renderer and URL match
				renderInfo = mejs.Renderers.selectRenderer(mediaFiles,
					(options.renderers.length ? options.renderers : null));

				let event;

				// Ensure that the original gets the first source found
				if (mediaFiles[0].src) {
					this.mediaElement.originalNode.setAttribute('src', mediaFiles[0].src);
				} else {
					this.mediaElement.originalNode.setAttribute('src', '');
				}

				// did we find a renderer?
				if (renderInfo === null) {
					event = document.createEvent("HTMLEvents");
					event.initEvent('error', false, false);
					event.message = 'No renderer found';
					this.mediaElement.dispatchEvent(event);
					return;
				}

				// turn on the renderer (this checks for the existing renderer already)
				this.mediaElement.changeRenderer(renderInfo.rendererName, mediaFiles);

				if (this.mediaElement.renderer === undefined || this.mediaElement.renderer === null) {
					event = document.createEvent("HTMLEvents");
					event.initEvent('error', false, false);
					event.message = 'Error creating renderer';
					this.mediaElement.dispatchEvent(event);
				}
			};

		this.utils.addProperty(this.mediaElement, 'src', getSrc, setSrc);
		this.mediaElement.getSrc = getSrc;
		this.mediaElement.setSrc = setSrc;

		// add methods
		let
			methods = mejs.html5media.methods,
			assignMethods = function (methodName) {
				// run the method on the current renderer
				this.mediaElement[methodName] = function () {
					if (this.mediaElement.renderer !== undefined && this.mediaElement.renderer !== null &&
						this.mediaElement.renderer[methodName]) {
						return this.mediaElement.renderer[methodName](arguments);
					} else {
						return null;
					}
				};

			}
			;
		for (i = 0, il = methods.length; i < il; i++) {
			assignMethods(methods[i]);
		}

		// IE && iOS
		if (!this.mediaElement.addEventListener) {

			this.mediaElement.events = {};

			// start: fake events
			this.mediaElement.addEventListener = function (eventName, callback) {
				// create or find the array of callbacks for this eventName
				this.mediaElement.events[eventName] = this.mediaElement.events[eventName] || [];

				// push the callback into the stack
				this.mediaElement.events[eventName].push(callback);
			};
			this.mediaElement.removeEventListener = function (eventName, callback) {
				// no eventName means remove all listeners
				if (!eventName) {
					this.mediaElement.events = {};
					return true;
				}

				// see if we have any callbacks for this eventName
				let callbacks = this.mediaElement.events[eventName];
				if (!callbacks) {
					return true;
				}

				// check for a specific callback
				if (!callback) {
					this.mediaElement.events[eventName] = [];
					return true;
				}

				// remove the specific callback
				for (let i = 0, il = callbacks.length; i < il; i++) {
					if (callbacks[i] === callback) {
						this.mediaElement.events[eventName].splice(i, 1);
						return true;
					}
				}
				return false;
			};

			/**
			 *
			 * @param {Event} event
			 */
			this.mediaElement.dispatchEvent = function (event) {

				let
					i,
					callbacks = this.mediaElement.events[event.type]
					;

				if (callbacks) {
					//args = Array.prototype.slice.call(arguments, 1);
					for (i = 0, il = callbacks.length; i < il; i++) {
						callbacks[i].apply(null, [event]);
					}
				}
			};
		}

		return this.mediaElement;
	}

	/**
	 * Determine whether the renderer was found or not
	 *
	 * @param {String} rendererName
	 * @param {Object[]} mediaFiles
	 * @return {Boolean}
	 */
	changeRenderer (rendererName, mediaFiles) {

		// check for a match on the current renderer
		if (this.mediaElement.renderer !== undefined && this.mediaElement.renderer !== null &&
			this.mediaElement.renderer.name === rendererName) {
			this.mediaElement.renderer.pause();
			if (this.mediaElement.renderer.stop) {
				this.mediaElement.renderer.stop();
			}
			this.mediaElement.renderer.show();
			this.mediaElement.renderer.setSrc(mediaFiles[0].src);
			return true;
		}

		// if existing renderer is not the right one, then hide it
		if (this.mediaElement.renderer !== undefined && this.mediaElement.renderer !== null) {
			this.mediaElement.renderer.pause();
			if (this.mediaElement.renderer.stop) {
				this.mediaElement.renderer.stop();
			}
			this.mediaElement.renderer.hide();
		}

		// see if we have the renderer already created
		let newRenderer = this.mediaElement.renderers[rendererName],
			newRendererType = null;

		if (newRenderer !== undefined && newRenderer !== null) {
			newRenderer.show();
			newRenderer.setSrc(mediaFiles[0].src);
			this.mediaElement.renderer = newRenderer;
			this.mediaElement.rendererName = rendererName;
			return true;
		}

		let rendererArray = this.mediaElement.options.renderers.length > 0 ? this.mediaElement.options.renderers :
			mejs.Renderers.order;

		// find the desired renderer in the array of possible ones
		for (let index in rendererArray) {

			if (rendererArray[index] === rendererName) {

				// create the renderer
				newRendererType = mejs.Renderers.renderers[rendererArray[index]];

				let renderOptions = this.utils.extend({}, this.mediaElement.options, newRendererType.options);
				newRenderer = newRendererType.create(this.mediaElement, renderOptions, mediaFiles);
				newRenderer.name = rendererName;

				// store for later
				this.mediaElement.renderers[newRendererType.name] = newRenderer;
				this.mediaElement.renderer = newRenderer;
				this.mediaElement.rendererName = rendererName;
				newRenderer.show();


				return true;
			}
		}

		return false;
	}

	/**
	 * Set the element dimensions based on selected renderer's setSize method
	 *
	 * @param {number} width
	 * @param {number} height
	 */
	setSize (width, height) {
		if (this.mediaElement.renderer !== undefined && this.mediaElement.renderer !== null) {
			this.mediaElement.renderer.setSize(width, height);
		}
	}

	/**
	 *
	 * @private
	 */
	findMediaFiles_ () {

		if (this.mediaElement.originalNode !== null) {
			let mediaFiles = [];

			switch (this.mediaElement.originalNode.nodeName.toLowerCase()) {

				case 'iframe':
					mediaFiles.push({
						type: '',
						src: this.mediaElement.originalNode.getAttribute('src')
					});

					break;

				case 'audio':
				case 'video':
					let
						n,
						src,
						type,
						sources = this.mediaElement.originalNode.childNodes.length,
						nodeSource = this.mediaElement.originalNode.getAttribute('src')
						;

					// Consider if node contains the `src` and `type` attributes
					if (nodeSource) {
						let node = this.mediaElement.originalNode;
						mediaFiles.push({
							type: this.utils.formatType(nodeSource, node.getAttribute('type')),
							src: nodeSource
						});
					}

					// test <source> types to see if they are usable
					for (i = 0; i < sources; i++) {
						n = this.mediaElement.originalNode.childNodes[i];
						if (n.nodeType == 1 && n.tagName.toLowerCase() === 'source') {
							src = n.getAttribute('src');
							type = this.utils.formatType(src, n.getAttribute('type'));
							mediaFiles.push({type: type, src: src});
						}
					}
					break;
			}

			if (mediaFiles.length > 0) {
				this.mediaElement.src = mediaFiles;
			}
		}
	}

	create() {
		if (options.success) {
			options.success(this.mediaElement, this.mediaElement.originalNode);
		}

		// @todo: Verify if this is needed
		// if (options.error) {
		// 	options.error(this.mediaElement, this.mediaElement.originalNode);
		// }

		return this.mediaElement;
	}
}

export default MediaElement;