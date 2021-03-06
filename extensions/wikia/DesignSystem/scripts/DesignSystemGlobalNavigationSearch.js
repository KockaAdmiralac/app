$(function ($) {
	'use strict';

	var $globalNav = $('.wds-global-navigation'),
		$searchInput = $globalNav.find('.wds-global-navigation__search-input'),
		$searchSubmit = $globalNav.find('.wds-global-navigation__search-submit'),
		placeholderText = $searchInput.attr('placeholder'),
		activeSearchClass = 'wds-search-is-active';

	function activateSearch() {
		if (!$globalNav.hasClass(activeSearchClass)) {
			$globalNav.addClass(activeSearchClass);
			$searchInput.attr('placeholder', $searchInput.data('active-placeholder'));

			/**
			 * [bug fix]: On Firefox click is not triggered when placeholder text is changed
			 * that is why we have to do it manually
			 */
			$(this).click();
		}
	}

	$searchInput.on('focus', activateSearch);

	$searchInput.on('input', function () {
		var textLength = this.value.length;

		if (textLength > 0 && $searchSubmit.prop('disabled')) {
			$searchSubmit.prop('disabled', false);
		} else if (textLength === 0) {
			$searchSubmit.prop('disabled', true);
		}
	});

	$globalNav.find('.wds-global-navigation__search-close').on('click', function () {
		$globalNav.removeClass(activeSearchClass);
		$searchInput.attr('placeholder', placeholderText);
		$searchSubmit.prop('disabled', true);
	});

	if ($searchInput.is(':focus')) {
		activateSearch();
	}

	if ($searchInput.val().length === 0) {
		$searchSubmit.prop('disabled', true);
	}
});
