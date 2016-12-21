const NAV = window.navigator;
const UA = NAV.userAgent.toLowerCase();

export const IS_IPAD = (UA.match(/ipad/i) !== null);
export const IS_IPHONE = (UA.match(/iphone/i) !== null);
export const IS_IOS = IS_IPHONE || IS_IPAD;
export const IS_ANDROID = (UA.match(/android/i) !== null);
export const IS_IE = (NAV.appName.toLowerCase().indexOf('microsoft') > -1 || NAV.appName.toLowerCase().match(/trident/gi) !== null);
export const IS_CHROME = (UA.match(/chrome/gi) !== null);
export const IS_FIREFOX = (UA.match(/firefox/gi) !== null);
export const HAS_TOUCH = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);
export const HAS_MSE = ('MediaSource' in window);
export const SUPPORT_POINTER_EVENTS = (() => {
	let
		element = document.createElement('x'),
		documentElement = document.documentElement,
		getComputedStyle = window.getComputedStyle,
		supports
	;

	if (!('pointerEvents' in element.style)) {
		return false;
	}

	element.style.pointerEvents = 'auto';
	element.style.pointerEvents = 'x';
	documentElement.appendChild(element);
	supports = getComputedStyle && getComputedStyle(element, '').pointerEvents === 'auto';
	documentElement.removeChild(element);
	return !!supports;
})();

// for IE
let html5Elements = ['source', 'track', 'audio', 'video'];

for (let i = 0, il = html5Elements.length; i < il; i++) {
	video = doc.createElement(html5Elements[i]);
}

// Test if Media Source Extensions are supported by browser
export const SUPPORTS_MEDIA_TAG = (video.canPlayType !== undefined || HAS_MSE);

// Detect native JavaScript fullscreen (Safari/Firefox only, Chrome still fails)

// iOS
let hasiOSFullScreen = (video.webkitEnterFullscreen !== undefined);

// W3C
let hasNativeFullscreen = (video.requestFullscreen !== undefined);

// OS X 10.5 can't do this even if it says it can :(
if (hasiOSFullScreen && UA.match(/mac os x 10_5/i)) {
	hasNativeFullScreen = false;
	hasiOSFullScreen = false;
}

// webkit/firefox/IE11+
let hasWebkitNativeFullScreen = (video.webkitRequestFullScreen !== undefined);
let hasMozNativeFullScreen = (video.mozRequestFullScreen !== undefined);
let hasMsNativeFullScreen = (video.msRequestFullscreen !== undefined);

let hasTrueNativeFullScreen = (hasWebkitNativeFullScreen || hasMozNativeFullScreen || hasMsNativeFullScreen);
let nativeFullScreenEnabled = hasTrueNativeFullScreen;

let fullScreenEventName = '';
let isFullScreen, requestFullScreen, cancelFullScreen;

// Enabled?
if (hasMozNativeFullScreen) {
	nativeFullScreenEnabled = document.mozFullScreenEnabled;
} else if (hasMsNativeFullScreen) {
	nativeFullScreenEnabled = document.msFullscreenEnabled;
}

if (IS_CHROME) {
	hasiOSFullScreen = false;
}

if (hasTrueNativeFullScreen) {

	if (hasWebkitNativeFullScreen) {
		fullScreenEventName = 'webkitfullscreenchange';

	} else if (hasMozNativeFullScreen) {
		fullScreenEventName = 'mozfullscreenchange';

	} else if (hasMsNativeFullScreen) {
		fullScreenEventName = 'MSFullscreenChange';
	}

	isFullScreen = (() =>  {
		if (hasMozNativeFullScreen) {
			return document.mozFullScreen;

		} else if (hasWebkitNativeFullScreen) {
			return document.webkitIsFullScreen;

		} else if (hasMsNativeFullScreen) {
			return document.msFullscreenElement !== null;
		}
	})();

	requestFullScreen = (el) => {

		if (hasWebkitNativeFullScreen) {
			el.webkitRequestFullScreen();
		} else if (hasMozNativeFullScreen) {
			el.mozRequestFullScreen();
		} else if (hasMsNativeFullScreen) {
			el.msRequestFullscreen();
		}
	};

	cancelFullScreen = () => {
		if (hasWebkitNativeFullScreen) {
			document.webkitCancelFullScreen();

		} else if (hasMozNativeFullScreen) {
			document.mozCancelFullScreen();

		} else if (hasMsNativeFullScreen) {
			document.msExitFullscreen();

		}
	};
}

export const HAS_WEBKIT_NATIVE_FULLSCREEN = hasWebkitNativeFullScreen;
export const HAS_MOZ_NATIVE_FULLSCREEN = hasMozNativeFullScreen;
export const HAS_MS_NATIVE_FULLSCREEN = hasMsNativeFullScreen;
export const HAS_IOS_FULLSCREEN = hasiOSFullScreen;

export const HAS_TRUE_NATIVE_FULLSCREEN = hasTrueNativeFullScreen;
export const NATIVE_FULLSCREEN_ENABLED = nativeFullScreenEnabled;

export const FULLSCREEN_EVENT_NAME = fullScreenEventName;
export const IS_FULLSCREEN = isFullScreen;
export {requestFullScreen, cancelFullScreen};