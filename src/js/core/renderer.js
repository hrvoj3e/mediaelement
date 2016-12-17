'use strict';

/**
 * Handle workflow when player looks for proper render to play current media.
 *
 * @class Renderer
 */
class Renderer {

	constructor () {
		this.renderers = {};
		this.order = [];
	}

	set order(order) {

		if (!Array.isArray(order)) {
			throw new Error('order must be an array of strings.');
		}

		this._order = order;
	}

	set renderers(renderers) {

		if (renderers !== null && typeof renderers !== 'object') {
			throw new Error('renderers must be an array of objects.');
		}

		this._renderers = renderers;
	}

	get renderers() {
		return this._renderers;
	}

	get order() {
		return this._order;
	}

	/**
	 * Register a new renderer.
	 *
	 * @param {Object} renderer - An object with all the rendered information (name REQUIRED)
	 * @method add
	 */
	add (renderer) {

		if (renderer.name === undefined) {
			throw new Error('renderer must contain at least `name` property');
		}

		this.renderers[renderer.name] = renderer;
		this.order.push(renderer.name);
	}

	/**
	 * Iterate a list of renderers to determine which one should the player use.
	 *
	 * @param {Object[]} mediaFiles - A list of source and type obtained from video/audio/source tags: [{src:'',type:''}]
	 * @param {?String[]} renderers - Optional list of pre-selected renderers
	 * @return {?Object} The renderer's name and source selected
	 * @method select
	 */
	select (mediaFiles, renderers = []) {
		let
			t = this,
			renderer,
			rendererList = renderers.length ? renderers : t.order
		;

		for (let index of rendererList) {
			renderer = t.renderers[index];

			if (renderer !== null && renderer !== undefined) {

				for (let file of mediaFiles) {
					if (typeof renderer.canPlayType === 'function' && typeof file.type === 'string' &&
						renderer.canPlayType(file.type)) {
						return {
							rendererName: renderer.name,
							src: file.src
						};
					}
				}
			}
		}

		return null;
	}
}

export let renderer = new Renderer();