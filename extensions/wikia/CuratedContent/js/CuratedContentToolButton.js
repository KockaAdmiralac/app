require(['jquery', 'curatedContentTool.modal', 'JSMessages'], function ($, curatedContentToolModal, msg) {
		'use strict';
		$('#CuratedContentTool').click(function (event) {
			event.preventDefault();

			var iframe = '<iframe data-url="' + window.wgScriptPath + '/main/edit?useskin=wikiamobile" ' +
					'id="CuratedContentToolIframe" class="curated-content-tool" name="curated-content-tool" ></iframe>',
				title = msg('wikiacuratedcontent-modal-title');

			curatedContentToolModal.open(title, iframe);
		});
	}
);
