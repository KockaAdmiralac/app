/*global define*/
define('ext.wikia.adEngine.video.playwire', [
	'ext.wikia.adEngine.video.vastBuilder',
	'wikia.document',
	'wikia.log'
], function (vastBuilder, doc, log) {
	'use strict';
	var logGroup = 'ext.wikia.adEngine.video.playwire',
		playerUrl = '//cdn.playwire.com/bolt/js/zeus/embed.js';

	function getConfigUrl(publisherId, videoId) {
		return '//config.playwire.com/' + publisherId + '/videos/v2/' + videoId + '/zeus.json';
	}

	function inject(configUrl, parent, vastUrl) {
		var script = doc.createElement('script');

		if (!vastUrl) {
			vastUrl = vastBuilder.build();
		}

		script.setAttribute('data-config', configUrl);
		script.setAttribute('data-ad-tag', vastUrl);

		script.setAttribute('type', 'text/javascript');
		script.src = playerUrl;

		parent.appendChild(script);
		log(['inject', configUrl], 'debug', logGroup);
	}

	return {
		getConfigUrl: getConfigUrl,
		inject: inject
	};
});
