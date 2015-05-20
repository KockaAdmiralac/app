require(['jquery'], function($) {
	'use strict';

	var init,
		modal = null,
		$flagsEditForm;

	init = function init() {
		$('#ca-flags').on('click', showModal);
	};

	function showModal(event) {
		event.preventDefault();
		$.when(getTemplate('modal')).done(function(template) {
			require(['wikia.ui.factory'], function(uiFactory) {

				//getModalContent();
				// initialize the modal component
				uiFactory.init(['modal']).then(function(uiModal) {
					// modal component configuration
					var modalConfig = {
						vars: {
							id: 'FlagsModal',
							size: 'small', // size of the modal
							content: template.content.html, // content
							title: 'Flags', // title
							buttons: [  // buttons in the footer
								{
									vars: {
										value: 'Done',
										data: [
											{
												key: 'event',
												value: 'save'
											}
										]
									}
								},
								{
									vars: {
										value: 'Cancel',
										data: [
											{
												key: 'event',
												value: 'close'
											}
										]
									}
								}
							]
						}
					};

					// create the wrapping JS Object using the modalConfig
					uiModal.createComponent(modalConfig, function(sampleModal) {
						modal = sampleModal;
						$flagsEditForm = $('#flagsEditForm');

						// bind the Save button to this anon. function
						sampleModal.bind('save', function() {
							$flagsEditForm.trigger('submit');
						});

						// show the modal
						sampleModal.show();
					});
				});
			});
		});
	}


	function getTemplate( name ) {
		//var template = cached.templates[ name ];
		var template = {};

		//if ( !template ) {
		//	this.error( 'Template "' + name + '" is not defined' );
		//}

		//return template.content && template || $.Deferred(function( dfd ) {
		return $.Deferred(function( dfd ) {
			Wikia.getMultiTypePackage({
				templates: [{
					controller: 'Flags',
					method: 'modal',
					params: {
						'wikiId': window.wgCityId,
						'pageId': window.wgArticleId
					}
				}],
				styles: '/extensions/wikia/Flags/styles/Modal.scss',
				callback: function( pkg ) {
					require(['wikia.ui.factory', 'wikia.loader'], function (uiFactory, loader) {
						loader.processStyle(pkg.styles);
					});
					template.content = $.parseJSON(pkg.templates.Flags_modal);
					dfd.resolve( template );
				}
			});

			return dfd.promise();
		});
	}

	// Run initialization
	init();
});
