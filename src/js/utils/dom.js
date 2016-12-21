"use strict";

import document from 'global/document';
import {escapeHTML} from '../utils/general';

export function createEvent (eventName, target) {

	if (typeof eventName !== 'string') {
		throw new Error('Event name must be a string');
	}

	if (target instanceof HTMLElement === false) {
		throw new Error('Event target must be an HTMLElement');
	}

	let event = null;

	if (document.createEvent) {
		event = document.createEvent('Event');
		event.initEvent(eventName, true, false);
	} else {
		event = {};
		event.type = eventName;
		event.target = target;
	}

	return event;
}

/**
 *
 * @param {String} url
 * @return {String}
 */
export function absolutizeUrl (url) {

	if (typeof url !== 'string') {
		throw new Error('`url` argument must be a string');
	}

	let el = document.createElement('div');
	el.innerHTML = '<a href="' + escapeHTML(url) + '">x</a>';
	return el.firstChild.href;
}

/**
 * Returns true if targetNode appears after sourceNode in the dom.
 * @param {HTMLElement} sourceNode - the source node for comparison
 * @param {HTMLElement} targetNode - the node to compare against sourceNode
 */
export function isNodeAfter (sourceNode, targetNode) {
	return !!(
		sourceNode &&
		targetNode &&
		sourceNode.compareDocumentPosition(targetNode) && Node.DOCUMENT_POSITION_PRECEDING
	);
}