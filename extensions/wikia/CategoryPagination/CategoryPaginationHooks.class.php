<?php

class CategoryPaginationHooks {
	const PARAMS_DISABLING_PAGINATION = [ 'from', 'pagefrom', 'pageuntil' ];

	/**
	 * @static
	 * @param Title $title
	 * @param Article $article
	 * @return bool
	 */
	public static function onArticleFromTitle( &$title, &$article ) {
		$app = F::app();

		// Only do anything with category pages on Oasis
		if ( !$app->checkSkin( 'oasis' ) || !$title || $title->getNamespace() != NS_CATEGORY ) {
			return true;
		}

		// New pagination doesn't support the from param (yet)
		foreach ( self::PARAMS_DISABLING_PAGINATION as $param ) {
			if ( $app->wg->Request->getVal( $param ) ) {
				return true;
			}
		}

		$article = new CategoryPaginationPage( $title );

		return true;
	}

	public static function onCategoryViewerGetSectionPagingLinks( $catViewer, $type, $position, &$r ) {
		if ( !( $catViewer instanceof CategoryPaginationViewer ) ) {
			return true;
		}
		$r = '';
		if ( $position === 'bottom' ) {
			$r = $catViewer->getPaginator( $type )->getBarHTML();
		}
		return true;
	}
}
