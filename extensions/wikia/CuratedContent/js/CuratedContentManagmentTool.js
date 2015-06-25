/* global wgNamespaceIds, wgFormattedNamespaces, mw, wgServer, wgScript */
/* jshint maxlen: false */
/* jshint loopfunc: false */
/* jshint camelcase: false */
$(function () {
	'use strict';

	require(['wikia.window', 'jquery', 'wikia.nirvana', 'wikia.tracker', 'JSMessages'], function (window, $, nirvana, tracker, msg) {
		'use strict';

		var d = document,
			item = mw.config.get('itemTemplate'),
			section = mw.config.get('sectionTemplate'),
			duplicateError = msg('wikiacuratedcontent-content-duplicate-entry'),
			requiredError = msg('wikiacuratedcontent-content-required-entry'),
			emptySectionError = msg('wikiacuratedcontent-content-empty-section'),
			orphanError = msg('wikiacuratedcontent-content-orphaned-error'),
			articleNotFoundError = msg('wikiacuratedcontent-content-articlenotfound-error'),
			emptyLabelError = msg('wikiacuratedcontent-content-emptylabel-error'),
			tooLongLabelError = msg('wikiacuratedcontent-content-toolonglabel-error'),
			videoNotSupportedError = msg('wikiacuratedcontent-content-videonotsupported-error'),
			notSupportedType = msg('wikiacuratedcontent-content-notsupportedtype-error'),
			noCategoryInTag = msg('wikiacuratedcontent-content-nocategoryintag-error'),
			addItem = d.getElementById('addItem'),
			addSection = d.getElementById('addSection'),
			$save = $(d.getElementById('save')),
			form = d.getElementById('contentManagmentForm'),
			$form = $(form),
			ul = form.getElementsByTagName('ul')[0],
			$ul = $(ul),
			maxAllowedLength = 48, // it's derived from MAX_LABEL_LENGTH in CuratedContentSpecialController

			setup = function (elem) {
				(elem || $ul.find('.item-input')).autocomplete({
					serviceUrl: wgServer + wgScript,
					params: {
						action: 'ajax',
						rs: 'getLinkSuggest',
						format: 'json'
						//ns: categoryId
					},
					appendTo: form,
					onSelect: function () {
						$ul.find('input:focus').next().focus();
					},
					fnPreprocessResults: function (data) {
						return data;
					},
					deferRequestBy: 50,
					minLength: 3,
					skipBadQueries: true // BugId:4625 - always send the request even if previous one returned no suggestions
				});
				// validate form on init
				checkForm();
			},
			addNew = function (row, elem) {
				var cat;

				if (elem) {
					elem.after(row);
					cat = elem.next().find('.item-input');
				} else {
					$ul.append(row);
					cat = $ul.find('.item-input:last');
				}

				setup(cat);
				cat.focus();

				$ul.sortable('refresh');
			},

			/**
			 * Validate input elements
			 *
			 * @param elements
			 * @param options array consists of ['checkEmpty', 'required', 'limit']
			 */
			checkInputs = function (elements, options) {
				var cachedVals = [],
					optionCheckEmpty, optionRequired, optionLimit;

				options = Array.isArray(options) ? options : [];

				optionCheckEmpty = options.indexOf('checkEmpty') !== -1;
				optionRequired = options.indexOf('required') !== -1;
				optionLimit = options.indexOf('limit') !== -1;

				elements.each(function () {
					var val = this.value,
						$this = $(this);

					// check if filed valuer is empty and it's required
					if (optionRequired && val === '') {
						$this
							.addClass('error')
							.popover('destroy')
							.popover({
								content: requiredError
							});
						return true;
					}
					// check if field value is too long
					if (optionLimit && val.length > maxAllowedLength) {
						$this
							.addClass('error')
							.popover('destroy')
							.popover({
								content: tooLongLabelError
							});
						return true;
					}
					// check if value already exists (in cachedVals variable)
					if (cachedVals.indexOf(val) === -1) {
						// not exists, add it to cachedVals and remove previous errors
						cachedVals.push(val);

						$this
							.removeClass('error')
							.popover('destroy');

						return true;
					} else if (optionCheckEmpty || val !== '') {
						// if it exists and it's not empty it's duplication
						$this
							.addClass('error')
							.popover('destroy')
							.popover({
								content: duplicateError
							});
					}
				});
			},
			checkForm = function () {
				$save.removeClass();

				checkInputs($ul.find('.section-input'), ['required']);
				checkInputs($ul.find('.item-input'), ['required', 'checkEmpty']);

				// validate orphans
				$ul.find('.section ~ .item.error').removeClass('error');

				$ul.find('.item:not(.section ~ .item)').each(function () {
					var $t = $(this);
					$t.addClass('error')
						.popover('destroy')
						.popover({
							content: orphanError
						});
				});

				$ul.find('.section').each(function () {
					var $t = $(this),
						$items = $t.nextUntil('.section');

					if ($items.length === 0 && !$t.hasClass('featured')) {
						$t.find('.section-input')
							.addClass('error')
							.popover('destroy')
							.popover({
								content: emptySectionError
							});
					} else {
						checkInputs($items.find('.name'), ['limit']);
					}
				});

				if (d.getElementsByClassName('error').length > 0) {
					$save.attr('disabled', true);
					return false;
				} else {
					$save.attr('disabled', false);
					return true;
				}
			},
			track = tracker.buildTrackingFunction({
				action: Wikia.Tracker.ACTIONS.CLICK,
				category: 'special-curated-content',
				trackingMethod: 'analytics'
			});

		$form
			.on('focus', 'input', function () {
				checkForm();
			})
			.on('click', '.remove', function () {
				ul.removeChild(this.parentElement);
				checkForm();
			})
			.on('blur', 'input', function () {
				var val = $.trim(this.value);

				if (this.className === 'item-input') {
					val = val.replace(/ /g, '_');
				}
				this.value = val;

				checkForm();
			})
			.on('keypress', '.name', function (ev) {
				if (ev.keyCode === 13) {
					addNew(item, $(this).parent());
				}
			})
			.on('keypress', '.item-input, .section-input', function (ev) {
				if (ev.keyCode === 13) {
					$(this).next().focus();
				}
			}).keyup(function () {
				setTimeout(checkForm, 0);
			});

		$(addItem).on('click', function () {
			addNew(item);
		});

		$(addSection).on('click', function () {
			addNew(section);
		});

		function getItemData(li) {
			var $lia = $(li);
			return {
				title: $lia.find('.item-input').val(),
				label: $lia.find('.name').val(),
				image_id: $lia.find('.image').data('id') || 0
			};
		}

		function getSectionData(li) {
			var $lia = $(li),
				name = $lia.find('.section-input').val() || '',
				imageId = $lia.find('.image').data('id') || 0,
				featured = $lia.hasClass('featured') || false,
				items = [],
				result = {};

			$lia.nextUntil('.section').each(function () {
				items.push(getItemData(this));
			});

			result = {
				title: name,
				image_id: imageId,
				items: items
			};
			if (featured) {
				result.featured = true;
			}
			return result;
		}

		window._gaq.push(['_setSampleRate', '100']);

		$save.on('click', function () {
			var data = [],
				orphans = [];

			if (checkForm()) {
				$ul.find('.item:not(.section ~ .item)').each(function () {
					orphans.push(getItemData(this));
				});

				$ul.find('.section').each(function () {
					var sectionData = getSectionData(this);
					if (orphans.length > 0) {
						// adopts the orphans to the top of topmost section
						// since that what probably orphaned them in the first place
						sectionData.items = sectionData.items.reduce(function (self, item) {
							self.push(item);
							return self;
						}, orphans);
						orphans = [];
					}
					data.push(sectionData);
				});
				nirvana.sendRequest({
					controller: 'CuratedContentSpecial',
					method: 'save',
					data: {
						sections: data
					}
				}).done(
					function (data) {
						function getReasonMessage(errReason) {
							if (errReason === 'articleNotFound') {
								return articleNotFoundError;
							}
							if (errReason === 'emptyLabel') {
								return emptyLabelError;
							}
							if (errReason === 'tooLongLabel') {
								return tooLongLabelError;
							}
							if (errReason === 'videoNotSupportProvider') {
								return videoNotSupportedError;
							}
							if (errReason === 'notSupportedType') {
								return notSupportedType;
							}
							if (errReason === 'noCategoryInTag') {
								return noCategoryInTag;
							}
							return errReason;
						}

						if (data.error) {
							var err = data.error,
								i = err.length,
								items = $form.find('.item-input');
							while (i--) {
								//I cannot use value CSS selector as I want to use current value
								var errTitle = err[i].title;
								var errReason = err[i].reason;
								var reasonMessage = getReasonMessage(errReason);
								items.each(function () {

									if (this.value === errTitle) {
										if (errReason !== 'emptyLabel' && errReason !== 'tooLongLabel') {
											$(this)
												.addClass('error')
												.popover('destroy')
												.popover({
													content: reasonMessage
												});
										} else {
											$(this).next()
												.addClass('error')
												.popover('destroy')
												.popover({
													content: reasonMessage
												});
										}

										return false;
									}
									return true;
								});
							}

							$save.addClass('err');
							$save.attr('disabled', true);
							track({ label: 'save-error' });
						} else if (data.status) {
							$save.addClass('ok');
							track({ label: 'save' });
						}
					}).fail(function () {
						$save.addClass('err');
						track({ label: 'save-error' });
					}).then(function () {
						$form.stopThrobbing();
					});
			}
		});

		//be sure modules are ready to be used
		mw.loader.using(['jquery.autocomplete', 'jquery.ui.sortable', 'wikia.aim', 'wikia.yui'], function () {
			var $currentImage;

			function onFail() {
				$currentImage
					.css('backgroundImage', '')
					.removeAttr('data-id');

				$currentImage.stopThrobbing();
			}

			function loadImage(imgTitle, catImage) {
				$currentImage.startThrobbing();

				nirvana.getJson(
					'CuratedContentSpecial',
					'getImage',
					{
						file: imgTitle
					}
				).done(
					function (data) {
						if (data.url && data.id) {
							$currentImage.css('backgroundImage', 'url(' + data.url + ')');
							$currentImage.data('id', data.id);
							$currentImage.attr('data-id', data.id);

							if (!catImage) {
								$currentImage.siblings().last().addClass('photo-remove');
							}

							$currentImage.stopThrobbing();
						} else {
							onFail();
						}
					}
				).fail(onFail);
			}

			$(window).bind('WMU_addFromSpecialPage', function (event, wmuData) {
				loadImage(wmuData.imageTitle);
			});

			$form.
				on('click', '.photo-remove', function () {
					var $this = $(this),
						$line = $this.parent();

					$currentImage = $line.find('.image');
					$currentImage.removeAttr('data-id');

					$this.removeClass('photo-remove');

					loadImage(wgFormattedNamespaces[wgNamespaceIds.category] + ':' + $line.find('.item-input').val(), true);
				})
				.on('click', '.photo:not(.photo-remove), .image', function () {
					$currentImage = $(this).parent().find('.image');

					window.WMU_skipDetails = true;
					window.WMU_show();
					window.WMU_openedInEditor = false;
				});

			$ul.sortable({
				opacity: 0.5,
				axis: 'y',
				containment: '#contentManagmentForm',
				cursor: 'move',
				handle: '.drag',
				items: 'li:not(.sort-disabled)',
				placeholder: 'drop',
				update: function () {
					checkForm();
				}
			});

			setup();
		});
	});
});
