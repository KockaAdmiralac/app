/*global define*/
define('ext.wikia.recirculation.views.rail', [
	'jquery',
	'wikia.window',
	'wikia.abTest',
	'ext.wikia.recirculation.tracker',
	'ext.wikia.recirculation.utils',
	'ext.wikia.recirculation.helpers.curatedContent'
], function ($, w, abTest, tracker, utils, CuratedHelper) {

	var options = {};

	function render(data) {
		var curated = CuratedHelper();

		return curated.injectContent(data)
			.then(renderTemplate('rail.mustache'))
			.then(utils.waitForRail)
			.then(function($html) {
				if (options.before) {
					$html = options.before($html);
				}

				$('#RECIRCULATION_RAIL').html($html);
				curated.setupTracking($html);

				return $html;
			});
	}

	function renderTemplate(templateName) {
		return function(data) {
			data.items = data.items.slice(0, 5);
			return utils.renderTemplate(templateName, data);
		}
	}

	function setupTracking(experimentName) {
		return function($html) {
			tracker.trackVerboseImpression(experimentName, 'rail');

			$html.on('mousedown', 'a', function() {
				tracker.trackVerboseClick(experimentName, utils.buildLabel(this, 'rail'));
			});

			return $html;
		};
	}

	return function(config) {
		$.extend(options, config);

		return {
			render: render,
			setupTracking: setupTracking
		};
	};
});
