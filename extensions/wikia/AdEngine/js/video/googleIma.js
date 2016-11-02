/*global define, google*/
define('ext.wikia.adEngine.video.googleIma', [
	'ext.wikia.adEngine.video.vastBuilder',
	'wikia.lazyqueue',
	'ext.wikia.adEngine.utils.scriptLoader'
], function (vastBuilder, lazyQueue, scriptLoader) {
	'use strict';
	var adDisplayContainer,
		adsLoader,
		adsManager,
		imaLibraryUrl = 'http://imasdk.googleapis.com/js/sdkloader/ima3.js',
		isAdsManagerLoaded = false,
		videoMock = {currentTime: 0};

	function initialize() {
		return scriptLoader.loadScript(imaLibraryUrl);
	}

	function onAdsManagerLoaded(adsManagerLoadedEvent) {
		var adsRenderingSettings = new google.ima.AdsRenderingSettings();
		adsManager = adsManagerLoadedEvent.getAdsManager(videoMock, adsRenderingSettings);
		isAdsManagerLoaded = true;
	}

	function createRequest(vastUrl, width, height) {
		var adsRequest = new google.ima.AdsRequest();

		adsRequest.adTagUrl = vastUrl;
		adsRequest.linearAdSlotWidth = width;
		adsRequest.linearAdSlotHeight = height;
		adsRequest.nonLinearAdSlotWidth = width;
		adsRequest.nonLinearAdSlotHeight = height;

		return adsRequest;
	}

	function prepareVideoAdContainer(videoAdContainer) {
		videoAdContainer.style.position = 'relative';
		videoAdContainer.classList.add('hidden');
		return videoAdContainer;
	}

	function setupIma(vastUrl, adContainer, width, height) {
		isAdsManagerLoaded = false;
		adDisplayContainer = new google.ima.AdDisplayContainer(adContainer);
		adsLoader = new google.ima.AdsLoader(adDisplayContainer);
		adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded, false);
		adsLoader.requestAds(createRequest(vastUrl, width, height));

		adDisplayContainer.initialize();

		return prepareVideoAdContainer(adContainer.querySelector('div'));
	}

	function playVideo(width, height, onVideoFinishedCallback) {
		runWhenAdsManagerLoaded(function () {
			adsManager.init(width, height, google.ima.ViewMode.FULLSCREEN);
			adsManager.start();
			adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onVideoFinishedCallback);
		});
	}

	function runWhenAdsManagerLoaded(cb) {
		if (isAdsManagerLoaded) {
			cb();
		} else {
			adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, cb, false);
		}
	}

	return {
		initialize: initialize,
		playVideo: playVideo,
		setupIma: setupIma
	};
});
