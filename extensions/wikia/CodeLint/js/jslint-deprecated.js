/**
 * This file contains functions and variables deprecated in MediaWiki 1.19
 *
 * @see http://www.mediawiki.org/wiki/ResourceLoader/JavaScript_Deprecations
 */

var deprecated = [
	"sajax_debug_mode",
	"sajax_request_type",
	"sajax_debug",
	"sajax_init_object",
	"wfSupportsAjax",
	"sajax_do_call",
	"wgAjaxWatch",
	"considerChangingExpiryFocus",
	"updateBlockOptions",
	"onNameChange",
	"onNameChangeHook",
	"currentFocused",
	"addButton",
	"mwInsertEditButton",
	"mwSetupToolbar",
	"insertTags",
	"scrollEditBox",
	"mwEditButtons",
	"toggleVisibility",
	"historyRadios",
	"diffcheck",
	"histrowinit",
	"htmlforms",
	"doneIETransform",
	"doneIEAlphaFix",
	"expandedURLs",
	"hookit",
	"fixalpha",
	"relativeforfloats",
	"setrelative",
	"onbeforeprint",
	"onafterprint",
	"attachMetadataToggle",
	"os_map",
	"os_cache",
	"os_cur_keypressed",
	"os_keypressed_count",
	"os_timer",
	"os_mouse_pressed",
	"os_mouse_num",
	"os_mouse_moved",
	"os_search_timeout",
	"os_autoload_inputs",
	"os_autoload_forms",
	"os_is_stopped",
	"os_max_lines_per_suggest",
	"os_animation_steps",
	"os_animation_min_step",
	"os_animation_delay",
	"os_container_max_width",
	"os_animation_timer",
	"os_use_datalist",
	"os_Timer",
	"os_Results",
	"os_AnimationTimer",
	"os_MWSuggestInit",
	"os_initHandlers",
	"os_hookEvent",
	"os_eventKeyup",
	"os_processKey",
	"os_eventKeypress",
	"os_eventKeydown",
	"os_eventOnsubmit",
	"os_hideResults",
	"os_decodeValue",
	"os_encodeQuery",
	"os_updateResults",
	"os_setupDatalist",
	"os_getNamespaces",
	"os_updateIfRelevant",
	"os_delayedFetch",
	"os_fetchResults",
	"os_getTarget",
	"os_isNumber",
	"os_enableSuggestionsOn",
	"os_disableSuggestionsOn",
	"os_eventBlur",
	"os_eventFocus",
	"os_setupDiv",
	"os_createResultTable",
	"os_showResults",
	"os_operaWidthFix",
	"f_clientWidth",
	"f_clientHeight",
	"f_scrollLeft",
	"f_scrollTop",
	"f_filterResults",
	"os_availableHeight",
	"os_getElementPosition",
	"os_createContainer",
	"os_fitContainer",
	"os_trimResultText",
	"os_animateChangeWidth",
	"os_changeHighlight",
	"os_HighlightClass",
	"os_updateSearchQuery",
	"os_eventMouseover",
	"os_getNumberSuffix",
	"os_eventMousemove",
	"os_eventMousedown",
	"os_eventMouseup",
	"os_createToggle",
	"os_toggle",
	"tabbedprefs",
	"uncoversection",
	"checkTimezone",
	"timezoneSetup",
	"fetchTimezone",
	"guessTimezone",
	"updateTimezoneSelection",
	"doLivePreview",
	"ProtectionForm",
	"setupRightClickEdit",
	"addRightClickEditHandler",
	"mwSearchHeaderClick",
	"mwToggleSearchCheckboxes",
	"wgUploadWarningObj",
	"wgUploadLicenseObj",
	"licenseSelectorCheck",
	"wgUploadSetup",
	"toggleUploadInputs",
	"fillDestFilename",
	"toggleFilenameFiller",
	"clientPC",
	"is_gecko",
	"is_safari",
	"is_safari_win",
	"is_chrome",
	"is_chrome_mac",
	"is_ff2",
	"is_ff2_win",
	"is_ff2_x11",
	"webkit_match",
	"ff2_bugs",
	"ie6_bugs",
	"doneOnloadHook",
	"onloadFuncts",
	"addOnloadHook",
	"runOnloadHook",
	"killEvt",
	"loadedScripts",
	"importScript",
	"importStylesheet",
	"importScriptURI",
	"importStylesheetURI",
	"appendCSS",
	"addHandler",
	"addClickHandler",
	"removeHandler",
	"hookEvent",
	"mwEditButtons",
	"mwCustomEditButtons",
	"tooltipAccessKeyPrefix",
	"tooltipAccessKeyRegexp",
	"updateTooltipAccessKeys",
	"ta",
	"akeytt",
	"checkboxes",
	"lastCheckbox",
	"setupCheckboxShiftClick",
	"addCheckboxClickHandlers",
	"checkboxClickHandler",
	"showTocToggle",
	"toggleToc",
	"ts_image_path",
	"ts_image_up",
	"ts_image_down",
	"ts_image_none",
	"ts_europeandate",
	"ts_alternate_row_colors",
	"ts_number_transform_table",
	"ts_number_regex",
	"sortables_init",
	"ts_makeSortable",
	"ts_getInnerText",
	"ts_resortTable",
	"ts_initTransformTable",
	"ts_toLowerCase",
	"ts_dateToSortKey",
	"ts_parseFloat",
	"ts_currencyToSortKey",
	"ts_sort_generic",
	"ts_alternate",
	"changeText",
	"getInnerText",
	"escapeQuotes",
	"escapeQuotesHTML",
	"addPortletLink",
	"jsMsg",
	"injectSpinner",
	"removeSpinner",
	"getElementsByClassName",
	"redirectToFragment"
];

exports.deprecated = deprecated;
exports.regexp = new RegExp("(^|\\s|\\()(" + deprecated.join('|') + ")[^\\w]");
