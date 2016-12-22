"use strict";

import window from 'global/window';
import document from 'global/document';
import {addEvent} from 'utils/dom';
import i18n from 'core/i18n';

/// LIBRARIES
function getMousePosition (e) {
	let x = 0,
		y = 0;

	if (!e) {
		e = window.event;
	}

	if (e.pageX || e.pageY) {
		x = e.pageX;
		y = e.pageY;
	} else if (e.clientX || e.clientY) {
		x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;

		y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}

	return {x: x, y: y};
}

function getNodePosition (obj) {
	let curleft = 0,
		curtop = 0;

	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while ((obj = obj.offsetParent));

		return {x: curleft, y: curtop};
	}
}

function getStyle (idOrObj, styleProp) {
	let obj = typeof idOrObj === 'string' ? document.getElementById(id) : idOrObj,
		val;
	if (obj.currentStyle) {
		val = obj.currentStyle[styleProp];
	} else if (window.getComputedStyle) {
		val = document.defaultView.getComputedStyle(obj, null).getPropertyValue(styleProp);
	}
	return val;
}


// Fade effect from scriptiny.com
let fadeEffect = {
	init: (id, flag, target) => {
		this.elem = document.getElementById(id);
		clearInterval(this.elem.si);
		this.target = target ? target : flag ? 100 : 0;
		this.flag = flag || -1;
		this.alpha = this.elem.style.opacity ? parseFloat(this.elem.style.opacity) * 100 : 0;
		this.elem.si = setInterval(() => {
			fadeEffect.tween();
		}, 5);
	},
	tween: () => {
		if (this.alpha === this.target) {
			clearInterval(this.elem.si);
		} else {
			let value = Math.round(this.alpha + ((this.target - this.alpha) * 0.05)) + (1 * this.flag);
			this.elem.style.opacity = value / 100;
			this.elem.style.filter = 'alpha(opacity=' + value + ')';
			this.alpha = value;
		}
	}
};

mejs.id = 1000;

mejs.MediaElementPlayerSimpleDefaults = {
	classPrefix: 'mejs__',
	playText: i18n.t('Play'),
	pauseText: i18n.t('Pause')
};

function MediaElementPlayerSimple (idOrObj, options) {

	let
		original = typeof(idOrObj) === 'string' ? document.getElementById(idOrObj) : idOrObj,
		id = original && original.id ? original.id : 'mejs_' + mejs.id++,
		autoplay = original && original.autoplay !== undefined && original.autoplay === true,
		tagName = original.tagName.toLowerCase(),
		isVideo = (tagName === 'video' || tagName === 'iframe'),
		container = document.createElement('div'),
		controls = document.createElement('div'),
		originalWidth = isVideo ?
			original.offsetWidth > 0 ? original.offsetWidth : parseInt(original.width) :
			350,
		originalHeight = isVideo ?
			original.offsetHeight > 0 ? original.offsetHeight : parseInt(original.height) :
			50,
		mediaElement = null,
		t = this
	;

	t.id = id;
	t.options = Object.assign(mejs.MediaElementPlayerSimpleDefaults, options);
	t.original = original;
	t.isVideo = isVideo;

	// Container
	container.id = id + '_container';
	container.className =`${ t.options.classPrefix}simple-container ` +
		t.options.classPrefix + 'simple-' + original.tagName.toLowerCase();
	container.style.width = originalWidth + 'px';
	container.style.height = originalHeight + 'px';

	// Create SHIM
	original.parentElement.insertBefore(container, original);
	original.removeAttribute('controls');
	controls.style.opacity = 1.0;
	container.appendChild(original);

	mediaElement = mejs.MediaElement(original, t.options);
	t.mediaElement = mediaElement;

	mediaElement.addEventListener('click', () => {
		if (mediaElement.paused) {
			mediaElement.play();
		} else {
			mediaElement.pause();
		}
	});

	t.container = container;
	t.controls = controls;

	t.createUI();

	t.createPlayPause(mediaElement, controls);
	t.createCurrentTime(mediaElement, controls);
	t.createProgress(mediaElement, controls);
	t.createDuration(mediaElement, controls);
	t.createMute(mediaElement, controls);
	t.createFullscreen(mediaElement, controls);

	t.resizeControls();

	if (autoplay) {
		mediaElement.play();
	}

	return t;
}

MediaElementPlayerSimple.prototype = {

	createUI: () => {

		let
			t = this,
			id = this.id,
			controls = t.controls,
			container = t.container,
			mediaElement = t.mediaElement,
			isVideo = t.isVideo,
			isPlaying = false
			;

		// CONTROLS
		controls.className =`${ t.options.classPrefix}simple-controls`;
		controls.id = id + '_controls';
		container.appendChild(controls);

		addEvent(controls, 'mouseover', () => {
			clearControlsTimeout();
		});

		mediaElement.addEventListener('play', () => {
			isPlaying = true;
		});
		mediaElement.addEventListener('playing', () => {
			isPlaying = true;
		});
		mediaElement.addEventListener('pause', () => {
			isPlaying = false;
		});
		mediaElement.addEventListener('ended', () => {
			isPlaying = false;
		});
		mediaElement.addEventListener('seeked', () => {
			isPlaying = true;
		});

		mediaElement.addEventListener('mouseover', () => {
			clearControlsTimeout();
			showControls();
		});

		mediaElement.addEventListener('mouseout', mouseLeave);
		mediaElement.addEventListener('mouseleave', mouseLeave);

		function mouseLeave () {
			if (isVideo && isPlaying) {
				startControlsTimeout();
			}
		}

		let controlsTimeout = null;

		function startControlsTimeout () {
			clearControlsTimeout();

			controlsTimeout = setTimeout(() => {
				hideControls();
			}, 200);
		}

		function clearControlsTimeout () {
			if (controlsTimeout !== null) {
				clearTimeout(controlsTimeout);
				controlsTimeout = null;
			}
		}

		function showControls () {
			fadeEffect.init(id + '_controls', 1);
		}

		function hideControls () {
			fadeEffect.init(id + '_controls', 0);
		}

		addEvent(window, 'resize', () => {
			t.resizeControls();
		});

	},

	resizeControls: () => {

		let
			t = this,
			controls = t.controls,
			progress = null,
			combinedControlsWidth = 0,
			controlsBoundaryWidth = controls.offsetWidth;

		for (let i = 0, il = controls.childNodes.length; i < il; i++) {
			let control = controls.childNodes[i], horizontalSize;

			if (control.className.indexOf('ui-time-total') > -1) {
				progress = control;

				horizontalSize =
					parseInt(getStyle(control, 'margin-left'), 10) +
					parseInt(getStyle(control, 'margin-right'), 10);

				combinedControlsWidth += horizontalSize;

			} else {
				horizontalSize =
					parseInt(getStyle(control, 'width'), 10) +
					parseInt(getStyle(control, 'margin-left'), 10) +
					parseInt(getStyle(control, 'margin-right'), 10);

				combinedControlsWidth += horizontalSize;
			}
		}

		if (progress !== null && !isNaN(controlsBoundaryWidth) && !isNaN(combinedControlsWidth)) {
			progress.style.width = (controlsBoundaryWidth - combinedControlsWidth) + 'px';
		}
	},

	createPlayPause: (mediaElement, controls) => {
		let
			t = this,
			uiPlayBtn = document.createElement('input'),
			options = t.options
		;

		uiPlayBtn.className = 'ui-button ui-button-play';
		uiPlayBtn.type = 'button';

		uiPlayBtn.title = options.playText;
		uiPlayBtn.setAttribute('aria-label', options.playText);
		uiPlayBtn.setAttribute('aria-controls', mediaElement.id);
		controls.appendChild(uiPlayBtn);

		addEvent(uiPlayBtn, 'click', () => {
			if (mediaElement.getPaused()) {
				mediaElement.play();
			} else {
				mediaElement.pause();
			}
		});

		// events
		mediaElement.addEventListener('play', () => {
			uiPlayBtn.className = uiPlayBtn.className.replace(/\s*ui-button-play\s*/gi, '') + ' ui-button-pause';
			uiPlayBtn.title = options.pauseText;
			uiPlayBtn.setAttribute('aria-label', options.pauseText);
		}, false);

		mediaElement.addEventListener('pause', () => {
			uiPlayBtn.className = uiPlayBtn.className.replace(/\s*ui-button-pause\s*/gi, '') + ' ui-button-play';
			uiPlayBtn.title = options.playText;
			uiPlayBtn.setAttribute('aria-label', options.playText);
		}, false);

		mediaElement.addEventListener('loadstart', () => {
			uiPlayBtn.className = uiPlayBtn.className.replace(/\s*ui-button-pause\s*/gi, '') + ' ui-button-play';
			uiPlayBtn.title = options.playText;
			uiPlayBtn.setAttribute('aria-label', options.playText);
		});
	},

	createMute: (mediaElement, controls) => {
		let uiMuteBtn = document.createElement('input');

		uiMuteBtn.className = 'ui-button ui-button-unmuted';
		uiMuteBtn.type = 'button';
		controls.appendChild(uiMuteBtn);

		addEvent(uiMuteBtn, 'click', () => {
			mediaElement.muted = !mediaElement.muted;
		});

		mediaElement.addEventListener('volumechange', () => {
			if (mediaElement.muted) {
				uiMuteBtn.className = uiMuteBtn.className.replace(/ui-button-unmuted/gi, '') + ' ui-button-muted';
			} else {
				uiMuteBtn.className = uiMuteBtn.className.replace(/ui-button-muted/gi, '') + ' ui-button-unmuted';
			}
		}, false);
	},

	createCurrentTime: (mediaElement, controls) => {
		let uiCurrentTime = document.createElement('span');

		uiCurrentTime.className = 'ui-time';
		uiCurrentTime.innerHTML = '00:00';
		controls.appendChild(uiCurrentTime);

		mediaElement.addEventListener('timeupdate', () => {

			let currentTime = mediaElement.currentTime;
			if (!isNaN(currentTime)) {
				uiCurrentTime.innerHTML = mejs.Utils.secondsToTimeCode(currentTime);
			}
		}, false);

		mediaElement.addEventListener('loadedmetadata', () => {
			uiCurrentTime.innerHTML = mejs.Utils.secondsToTimeCode(0);
		}, false);

	},

	createProgress: (mediaElement, controls) => {
		let uiTimeBarTotal = document.createElement('div'),
			uiTimeBarLoaded = document.createElement('div'),
			uiTimeBarCurrent = document.createElement('div');

		// time bar!
		uiTimeBarTotal.className = 'ui-time-total';
		controls.appendChild(uiTimeBarTotal);

		uiTimeBarLoaded.className = 'ui-time-loaded';
		uiTimeBarTotal.appendChild(uiTimeBarLoaded);

		uiTimeBarCurrent.className = 'ui-time-current';
		uiTimeBarTotal.appendChild(uiTimeBarCurrent);

		mediaElement.addEventListener('timeupdate', () => {
			let outsideWidth = uiTimeBarTotal.offsetWidth,
				percent = mediaElement.currentTime / mediaElement.duration;

			uiTimeBarCurrent.style.width = (outsideWidth * percent) + 'px';
		});
		mediaElement.addEventListener('loadstart', () => {
			uiTimeBarCurrent.style.width = '0px';
			uiTimeBarLoaded.style.width = '0px';
		});
		mediaElement.addEventListener('loadedmetadata', () => {
			uiTimeBarCurrent.style.width = '0px';
			uiTimeBarLoaded.style.width = '0px';
		});

		mediaElement.addEventListener('progress', () => {

			let buffered = mediaElement.buffered,
				duration = mediaElement.duration,
				outsideWidth = uiTimeBarTotal.offsetWidth,
				percent = 0;

			if (buffered && buffered.length > 0 && buffered.end && duration) {
				// TODO: account for a real array with multiple values (only Firefox 4 has this so far)
				percent = buffered.end(0) / duration;

				uiTimeBarLoaded.style.width = (outsideWidth * percent) + 'px';
			}
		});

		addEvent(uiTimeBarTotal, 'click', (e) => {

			let
				paused = mediaElement.paused,
				mousePos = getMousePosition(e),
				barPos = getNodePosition(uiTimeBarTotal),
				clickWidth = mousePos.x - barPos.x,
				width = uiTimeBarTotal.offsetWidth,
				percentage = clickWidth / width,
				newTime = percentage * mediaElement.duration
			;

			if (!paused) {
				mediaElement.pause();
			}

			mediaElement.currentTime = newTime;

			if (!paused) {
				mediaElement.play();
			}

		});
	},

	createDuration: (mediaElement, controls) => {
		let uiDuration = document.createElement('span');

		uiDuration.className = 'ui-time';
		uiDuration.innerHTML = '00:00';
		controls.appendChild(uiDuration);

		function setDuration () {
			let duration = mediaElement.duration;
			if (isNaN(duration) || duration === Infinity) {
				duration = 0;
			}
			uiDuration.innerHTML = mejs.Utils.secondsToTimeCode(duration);
		}

		mediaElement.addEventListener('timeupdate', setDuration, false);
		mediaElement.addEventListener('loadedmetadata', setDuration, false);
	},

	createFullscreen: (mediaElement, controls) => {

		if (!this.isVideo) {
			return;
		}

		let t = this,
			uiFullscreenBtn = document.createElement('input'),
			isFullscreen = false,
			container = t.container,
			oldWidth = container.offsetWidth,
			oldHeight = container.offsetHeight;

		uiFullscreenBtn.className = 'ui-button ui-button-fullscreen';
		uiFullscreenBtn.type = 'button';
		controls.appendChild(uiFullscreenBtn);

		addEvent(uiFullscreenBtn, 'click', () => {

			if (isFullscreen) {

				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if (document.cancelFullScreen) {
					document.cancelFullScreen();
				} else if (document.webkitCancelFullScreen) {
					document.webkitCancelFullScreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else {
					// full window code for old browsers
				}

			} else {

				// store for later!
				oldWidth = container.offsetWidth;
				oldHeight = container.offsetHeight;

				if (container.requestFullscreen) {
					container.requestFullscreen();
				} else if (container.webkitRequestFullScreen) {
					container.webkitRequestFullScreen();
				} else if (container.mozRequestFullScreen) {
					container.mozRequestFullScreen();
				} else {
					// full window code for old browsers
				}
			}
		});

		// EVENTS
		if (document.webkitCancelFullScreen) {
			document.addEventListener('webkitfullscreenchange', (e) => {
				isFullscreen = document.webkitIsFullScreen;
				adjustForFullscreen();

			});
		} else if (document.mozCancelFullScreen) {
			document.addEventListener('mozfullscreenchange', (e) => {
				isFullscreen = document.mozFullScreen;
				adjustForFullscreen();
			});
		}

		function adjustForFullscreen () {

			if (isFullscreen) {

				uiFullscreenBtn.className = uiFullscreenBtn.className.replace(/ui-button-fullscreen/gi, '') + ' ui-button-exitfullscreen';

				container.style.width = '100%';
				container.style.height = '100%';

				mediaElement.setSize(container.offsetWidth, container.offsetHeight);
			} else {

				uiFullscreenBtn.className = uiFullscreenBtn.className.replace(/ui-button-exitfullscreen/gi, '') + ' ui-button-fullscreen';

				container.style.width = oldWidth + 'px';
				container.style.height = oldHeight + 'px';

				mediaElement.setSize(oldWidth, oldHeight);
			}

			t.resizeControls();
		}
	}
};

window.MediaElementPlayerSimple = mejs.MediaElementPlayerSimple = MediaElementPlayerSimple;
