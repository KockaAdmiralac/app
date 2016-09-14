/*global define*/
define('ext.wikia.recirculation.views.impactFooter', [
	'jquery',
	'wikia.window',
	'ext.wikia.recirculation.tracker',
	'ext.wikia.recirculation.utils'
], function ($, w, tracker, utils) {

	var imageRatio = 9/16,
		options = {};

	function render(data) {
		var renderData = {},
			structuredData = structureData(data.items);

		renderData.title = data.title;
		renderData.items = structuredData.items;

		if (structuredData.discussions) {
			renderData.discussions = {
				posts: structuredData.discussions
			};
		}

		renderData.i18n = {
			discussionsTitle: $.msg('recirculation-discussion-title'),
			discussionsLinkText: $.msg('recirculation-discussion-link-text'),
			discussionsNew: $.msg('recirculation-discussions-new'),
			discussionsPosts: $.msg('recirculation-discussions-posts'),
			discussionsReplies: $.msg('recirculation-discussions-replies'),
			discussionsUpvotes: $.msg('recirculation-discussions-upvotes'),
			featuredFandomSubtitle: $.msg('recirculation-impact-footer-featured-fandom-subtitle'),
			trendingTag: $.msg('recirculation-impact-footer-trending-tag'),
			wikiTag: $.msg('recirculation-impact-footer-wiki-tag')
		};

		return utils.renderTemplate('impactFooter.mustache', renderData).then(function($html) {
			$('#WikiaFooter').html($html).find('.discussion-timestamp').timeago();
			adjustFeatureItem($html);
			renderDiscussionHeaderImage($html);

			return $html;
		});
	}

	function adjustFeatureItem($html) {
		var $firstSet, firstSetHeight, firstSetDifference, $secondSet, secondSetHeight, secondSetDifference,
			$feature, featureHeight, move;

		$firstSet = $html.find('.item:eq(1) h4, .item:eq(2) h4');
		firstSetHeight = $firstSet.outerWidth(true) * imageRatio + $firstSet.outerHeight(true);

		$secondSet = $html.find('.item:eq(3) h4, .item:eq(4) h4');
		secondSetHeight = $secondSet.outerWidth(true) * imageRatio + $secondSet.outerHeight(true);

		$feature = $html.find('.item:eq(5)');
		featureHeight = $feature.outerWidth(true) * imageRatio;

		firstSetDifference = (featureHeight - firstSetHeight);
		secondSetDifference = (featureHeight - secondSetHeight);

		move = firstSetDifference > secondSetDifference ? secondSetDifference : firstSetDifference;

		$feature.css('margin-top', -move);
	}

	function renderDiscussionHeaderImage($html) {
		var $discussionHeader = $html.find('.discussion-header');

		if ($discussionHeader.length > 0) {
			var cityId = mw.config.get('wgCityId'),
				requestUrl = servicesUrl() + '/site-attribute/site/' + cityId + '/attr/heroImage';

			$.ajax({
				type: 'GET',
				url: requestUrl,
				xhrFields: {
					withCredentials: true
				},
			}).done(function (data) {
				if (data.value) {
					$discussionHeader.css('background-image', 'url(' + data.value + ')');
				}
			}).fail(function () {
				// Silent fail. It's alright to show the discussions header without an image
			});
		}
	}

	function servicesUrl() {
		if (mw.config.get('wgDevelEnvironment')) {
			return 'https://services.wikia-dev.com';
		}

		return 'https://services.wikia.com';
	}

	function structureData(items) {
		var fandom = items.filter(function(element) {
			return element.source === 'fandom';
		});

		var wiki = items.filter(function(element) {
			return element.source === 'wiki';
		});

		var discussions = items.filter(function(element) {
			return element.source === 'discussions';
		});

		items = [];

		if (fandom.length > 0) {
			items.push(fandom.shift());
		}

		items = items.concat(wiki.splice(0, 2));
		items = items.concat(fandom);
		items = items.concat(wiki);

		items.forEach(function(item, index) {
			if (items[index]) {
				items[index].index = index;
			}
		});

		return {
			items: items,
			discussions: discussions
		};

	}

	function setupTracking(experimentName) {
		return function($html) {
			tracker.trackVerboseImpression(experimentName, 'impact-footer');

			$html.on('mousedown', '.track-items', function() {
				tracker.trackVerboseClick(experimentName, utils.buildLabel(this, 'impact-footer'));
			});

			if ($html.find('.discussion-module').length) {
				tracker.trackVerboseImpression(experimentName, 'impact-footer-discussions');

				$html.on('mousedown', '.track-discussions', function() {
					tracker.trackVerboseClick(experimentName, utils.buildLabel(this, 'impact-footer-discussions'));
				});
			}
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
