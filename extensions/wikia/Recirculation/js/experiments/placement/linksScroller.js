/*global define*/
define('ext.wikia.recirculation.experiments.placement.LINKS_SCROLLER', [
	'jquery',
	'ext.wikia.recirculation.utils',
	'ext.wikia.recirculation.helpers.contentLinks',
	'ext.wikia.recirculation.views.scroller',
], function ($, utils, LinksHelper, ScrollerView) {

	function run(experimentName) {
		var view = ScrollerView();

		return LinksHelper({
		    count: 6,
		    extra: 6
		}).loadData()
			.then(view.render)
			.then(view.setupTracking(experimentName));
	}

	return {
		run: run
	}

});
