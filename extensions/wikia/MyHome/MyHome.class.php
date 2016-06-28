<?php

/**
 * This class contains hook handlers used to modify and store edit information
 * used by Special:WikiActivity
 */

class MyHome {

	// prefix for our custom data stored in rc_params
	const CUSTOM_DATA_PREFIX = "\x7f\x7f";

	// name of section edited
	private static $editedSectionName = false;
	private static $additionalRcDataBlacklist = [
		'flags'
	];

	/**
	 * Store custom data in rc_params field as JSON encoded table prefixed with extra string.
	 * To pass in extra key-value pairs, pass in 'data' as an associative array.
	 *
	 * @see http://www.mediawiki.org/wiki/Logging_table#log_params
	 *
	 * @author Maciej Brencz <macbre@wikia-inc.com>
	 */
	public static function storeInRecentChanges(RecentChange $rc, $data = array()) {
		wfProfileIn(__METHOD__);

		/* @var $wgParser Parser */
		global $wgParser;

		// If we have existing data packed into rc_params, make sure it is preserved.
		if(isset($rc->mAttribs['rc_params'])){
			$unpackedData = self::unpackData($rc->mAttribs['rc_params']);
			if(is_array($unpackedData)){
				foreach($unpackedData as $key=>$val){
					// Give preference to the data array that was passed into the function.
					if(!isset($data[$key])){
						$data[$key] = $val;
					}
				}
			}
		}

		// summary generated by MW: store auto-summary type
		if (Wikia::isVarSet('AutoSummaryType')) {
			$data['autosummaryType'] = Wikia::getVar('AutoSummaryType');
		}

		switch($rc->getAttribute('rc_type')) {
			// existing article
			case RC_EDIT:
				// rollback: store ID of the revision rollback is made to
				if (Wikia::isVarSet('RollbackedRevId')) {
					$data['rollback'] = true;
					$data['revId'] = Wikia::getVar('RollbackedRevId');
				}

				// edit from view mode
				if (Wikia::isVarSet('EditFromViewMode')) {
					$data['viewMode'] = 1;
					if (Wikia::isVarSet('EditFromViewMode') == 'CategorySelect') {
						$data['CategorySelect'] = 1;
					}
				}

				// section edit: store section name and modified summary
				if (self::$editedSectionName !== false) {
					// store section name
					$data['sectionName'] = self::$editedSectionName;

					// edit summary
					$comment = trim($rc->getAttribute('rc_comment'));

					// summary has changed - store modified summary
					if (!preg_match('#^/\*(.*)\*/$#', $comment)) {
						// remove /* Section title */
						$comment = preg_replace('#/\*(.*)\*/#', '', $comment);

						// remove all wikitext
						$comment = trim($wgParser->stripSectionName($comment));

						if ($comment != '') {
							$data['summary'] = $comment;
						}
					}
				}
				break;

			// new article
			case RC_NEW:
				$content = $wgParser->getOutput()->getText();

				// remove [edit] section links
				$content = preg_replace('#<span class="editsection">(.*)</a>]</span>#', '', $content);

				// remove <script> tags (RT #46350)
				$content = preg_replace('#<script[^>]+>(.*)<\/script>#', '', $content);

				// remove text between tags (RT #141394) and get rid of photo attribution (BugId:23871)
				$content = ActivityFeedHelper::filterTextBetweenTags( $content );

				// remove HTML tags
				$content = trim(strip_tags($content));

				// store first 150 characters of parsed content
				$data['intro'] = mb_substr($content, 0, 150);
				$data['intro'] = strtr($data['intro'], array('&nbsp;' => ' ', '&amp;' => '&'));

				break;
		}

		//allow to alter $data by other extensions (eg. Article Comments)
		wfRunHooks('MyHome:BeforeStoreInRC', array(&$rc, &$data));

		// encode data to be stored in rc_params
		if (!empty($data)) {
			$rc->mAttribs['rc_params'] = self::packData($data);
		}

		Wikia::setVar('rc', $rc);
		Wikia::setVar('rc_data', $data);

		wfProfileOut(__METHOD__);
		return true;
	}

	/**
	 * Check if it's section edit, then try to get section name
	 *
	 * @see http://www.mediawiki.org/wiki/Manual:Hooks/EditFilter
	 *
	 * @author Maciej Brencz <macbre@wikia-inc.com>
	 */
	public static function getSectionName($editor, $text, $section, &$error) {
		wfProfileIn(__METHOD__);

		/* @var $wgParser Parser */
		global $wgParser;

		// make sure to properly init this variable
		self::$editedSectionName = false;

		// check for section edit
		if (is_numeric($section)) {
			$hasmatch = preg_match( "/^ *([=]{1,6})(.*?)(\\1) *\\n/i", $editor->textbox1, $matches );

			if ( $hasmatch and strlen($matches[2]) > 0 ) {
				// this will be saved in recentchanges table in MyHome::storeInRecentChanges
				self::$editedSectionName = $wgParser->stripSectionName($matches[2]);
			}
		}

		wfProfileOut(__METHOD__);
		return true;
	}

	/**
	 * Return page user is redirected to when title is not specified in URL
	 *
	 * http://muppet.wikia.com -> http://muppet.wikia.com/wiki/Special:WikiActivity (happens for logged-in only)
	 *
	 * @author Maciej Brencz <macbre@wikia-inc.com>
	 */
	public static function getInitialMainPage(Title &$title) {
		wfProfileIn(__METHOD__);

		global $wgUser, $wgTitle, $wgRequest, $wgEnableWikiaHomePageExt, $wgEnableCommunityPageExt;

		// dirty hack to make skin chooser work ($wgTitle is not set at this point yet)
		$wgTitle = Title::newMainPage();

		// do not redirect for skins different then Oasis or logged-in requests driven by RandomWiki (FB#1033)
		if(get_class(RequestContext::getMain()->getSkin()) != 'SkinOasis' || ( $wgUser->isLoggedIn() && $wgRequest->getVal( 'redirect' ) == 'no' ) ) {
			wfProfileOut(__METHOD__);
			return true;
		}

		//user must be logged in and have redirect enabled;
		//this is not used for Corporate Sites where Wikia Visualization is enabled
		if( $wgUser->isLoggedIn() && empty($wgEnableWikiaHomePageExt) ) {
			$value = $wgUser->getGlobalPreference(UserPreferencesV2::LANDING_PAGE_PROP_NAME);
			if ( $value == UserPreferencesV2::LANDING_PAGE_WIKI_ACTIVITY ) {
				$title = SpecialPage::getTitleFor( 'WikiActivity' );
			} elseif ( $value == UserPreferencesV2::LANDING_PAGE_RECENT_CHANGES ) {
				$title = SpecialPage::getTitleFor( 'RecentChanges' );
			} elseif ( $value == UserPreferencesV2::LANDING_PAGE_COMMUNITY_PAGE ) {
				if ( $wgEnableCommunityPageExt == false ) {
					$title = SpecialPage::getTitleFor( 'WikiActivity' );
				} else {
					$title = SpecialPage::getTitleFor( 'Community' );
				}
			}

		}

		wfProfileOut(__METHOD__);
		return true;
	}

	/**
	 * Store list of images, videos and categories added to an article
	 */
	public static function getInserts($linksUpdate) {
		wfProfileIn(__METHOD__);

		$rc_data = array();

		// store list of added images and videos
		$imageInserts = Wikia::getVar('imageInserts');
		if(!empty($imageInserts)) {
			foreach($imageInserts as $one) {
				$rc_data['imageInserts'][] = $one['il_to'];
			}
		}

		// store list of added categories
		$categoryInserts = Wikia::getVar('categoryInserts');
		if (!empty($categoryInserts)) {
			foreach($categoryInserts as $cat => $page) {
				$rc_data['categoryInserts'][] = $cat;
			}
		}

		// update if necessary
		if (count($rc_data) > 0) {
			self::storeAdditionalRcData($rc_data);
		}

		wfProfileOut(__METHOD__);
		return true;
	}

	/**
	 * Given an associative array of data to store, adds this to additional data and updates
	 * the row in recentchanges corresponding to the provided RecentChange (or, if rc is not
	 * provided, then the RecentChange that is stored in Wikia::getVar('rc') will be used);
	 */
	public static function storeAdditionalRcData($additionalData, &$rc = null) {
		wfProfileIn( __METHOD__ );

		$rc_data = Wikia::getVar('rc_data');
		$rc_data = ($rc_data ? $rc_data : array()); // rc_data might not have been set
		$rc_data = array_merge($rc_data, $additionalData); // additionalData overwrites existing keys in rc_data if there are collisions.

		if ( !is_object($rc) ) {
			$rc = Wikia::getVar('rc');
		}
		if ($rc instanceof RecentChange) {
			/* @var $rc RecentChange */
			$rc_id = $rc->getAttribute('rc_id');
			$rc_log_type = $rc->getAttribute('rc_log_type');

			if ( !in_array( $rc_log_type, self::$additionalRcDataBlacklist ) ) {
				$dbw = wfGetDB( DB_MASTER );
				$dbw->update('recentchanges',
					array(
						'rc_params' => MyHome::packData($rc_data)
					),
					array(
						'rc_id' => $rc_id
					),
					__METHOD__
				);
			}
		}

		Wikia::setVar('rc_data', $rc_data);
		wfProfileOut( __METHOD__ );
	}

	/**
	 * Return encoded (serialized/jsonized) data with extra prefix which can be stored in rc_params
	 *
	 * @author Maciej Brencz <macbre@wikia-inc.com>
	 */
	public static function packData($data) {
		$packed = json_encode($data);

		// store encoded data with our custom prefix
		return self::CUSTOM_DATA_PREFIX . $packed;
	}

	/**
	 * Return decoded (unserialized/unjsonized) data stored in rc_params
	 *
	 * @author Maciej Brencz <macbre@wikia-inc.com>
	 */
	public static function unpackData($field) {
		wfProfileIn(__METHOD__);

		// extra check
		if (!is_string($field) || trim($field) == '') {
			wfProfileOut(__METHOD__);
			return null;
		}

		// try to get our custom prefix
		$prefix = substr($field, 0, strlen(self::CUSTOM_DATA_PREFIX));

		if ($prefix != self::CUSTOM_DATA_PREFIX) {
			wfProfileOut(__METHOD__);
			return null;
		}

		// get encoded data
		$field = substr($field, strlen(self::CUSTOM_DATA_PREFIX));

		// and try to unpack it
		try {
			$data = json_decode($field, true);
		}
		catch(Exception $e) {
			$data = null;
		}

		wfProfileOut(__METHOD__);
		return $data;
	}

	/**
	 * Add "Disable my redirect to My Home" switch to Special:Preferences (Misc tab)
	 *
	 * @author Maciej Brencz <macbre@wikia-inc.com>
	 */
	public static function onGetPreferences($user, &$preferences) {
		//we've changed 'myhomedisableredirect' to 'userlandingpage' during work on fb#51756
		$preferences[UserPreferencesV2::LANDING_PAGE_PROP_NAME] = array(
			'type' => 'toggle',
			'section' => 'misc/myhome',
			'label-message' => 'tog-userlandingpage',
		);

		return true;
	}

	/**
	 * Save default view in user preferences (can be either "watchlist" or "activity")
	 *
	 * @author Maciej Brencz <macbre@wikia-inc.com>
	 */
	public static function setDefaultView($defaultView) {
		wfProfileIn(__METHOD__);

		global $wgUser;

		// correct values
		$values = array('activity', 'watchlist');

		if (in_array($defaultView, $values)) {
			$wgUser->setGlobalPreference('myhomedefaultview', $defaultView);
			$wgUser->saveSettings();

			$dbw = wfGetDB( DB_MASTER );
			$dbw->commit(__METHOD__);

			wfProfileOut(__METHOD__);

			return true;
		}

		wfProfileOut(__METHOD__);
		return false;
	}

	/**
	 * Get default view from user preferences (can be either "watchlist" or "activity")
	 *
	 * @author Maciej Brencz <macbre@wikia-inc.com>
	 */
	public static function getDefaultView() {
		wfProfileIn(__METHOD__);

		global $wgUser;
		$defaultView = $wgUser->getGlobalPreference('myhomedefaultview');

		if (empty($defaultView)) {
			$defaultView = 'activity';
		}

		wfProfileOut(__METHOD__);
		return $defaultView;
	}

	/**
	 * When the notification to the user is called (at the bottom of the page), attach the
	 * achievement-earning to our best guess at what the associated RecentChange is.
	 *
	 * To account for race-conditions between RecentChanges and Achievements: currently, this
	 * is done by recording when an RC is saved. If it happens on this page before this
	 * function is called, then this function will load that RC by id.  If this function gets
	 * called before any RCs have been recorded, then a serialized copy of the badge is stored
	 * and can be inserted later (when the RC actually does get saved).
	 *
	 * @param User $user
	 * @param AchBadge $badge
	 */
	public static function attachAchievementToRc($user, $badge ){
		global $wgWikiaForceAIAFdebug;
		wfProfileIn( __METHOD__ );

		// If user has 'hidepersonalachievements' set, then they probably don't want to play.
		// Also, other users may see that someone won, then click the username and look around for a way to see what achievements a user has...
		// then when they can't find it (since users with this option won't have theirs displayed), they might assume that there is no way to see
		// achievements.  It would be better to do this check at display-time rather than save-time, but we don't have access to the badge's user
		// at that point.
		Wikia::log(__METHOD__, "", "Noticed an achievement", $wgWikiaForceAIAFdebug);
		if( ($badge->getTypeId() != BADGE_WELCOME) && (!$user->getGlobalPreference('hidepersonalachievements')) ){
			Wikia::log(__METHOD__, "", "Attaching badge to recent change...", $wgWikiaForceAIAFdebug);

			// Make sure this Achievement gets added to its corresponding RecentChange (whether that has
			// been saved already during this pageload or is still pending).
			global $wgARecentChangeHasBeenSaved, $wgAchievementToAddToRc;
			Wikia::log(__METHOD__, "", "About to see if there is an existing RC. RC: ".print_r($wgARecentChangeHasBeenSaved, true), $wgWikiaForceAIAFdebug);
			if(!empty($wgARecentChangeHasBeenSaved)){
				// Due to slave-lag, instead of storing the rc_id and looking it up (which didn't always work, even with a retry-loop), store entire RC.
				Wikia::log(__METHOD__, "", "Attaching badge to existing RecentChange from earlier in pageload.", $wgWikiaForceAIAFdebug);
				$rc = $wgARecentChangeHasBeenSaved;
				if($rc){
					Wikia::log(__METHOD__, "", "Found recent change to attach to.", $wgWikiaForceAIAFdebug);
					// Add the (serialized) badge into the rc_params field.
					$rc_data = array();
					$rc_data['Badge'] = serialize($badge);
					MyHome::storeAdditionalRcData($rc_data, $rc);
				}
			} else {
				// Spool this achievement for when its corresponding RecentChange shows up (later in this pageload).
				$wgAchievementToAddToRc = serialize($badge);
				Wikia::log(__METHOD__, "", "RecentChange hasn't been saved yet, storing the badge for later.", $wgWikiaForceAIAFdebug);
			}
		}

		wfProfileOut( __METHOD__ );
		return true;
	} // end attachAchievementToRc()

	/**
	 * Hook that's called when a RecentChange is saved.  This prevents any problems from race-conditions between
	 * the creation of a RecentChange and the awarding of its corresponding Achievement (they occur on the same
	 * page-load, but one isn't guaranteed to be before the other).
	 */
	public static function savingAnRc(&$rc){
		global $wgAchievementToAddToRc, $wgWikiaForceAIAFdebug;
		wfProfileIn( __METHOD__ );

		// If an achievement is spooled from earlier in the pageload, stuff it into this RecentChange.
		Wikia::log(__METHOD__, "", "RecentChange has arrived.", $wgWikiaForceAIAFdebug);
		if(!empty($wgAchievementToAddToRc)){
			Wikia::log(__METHOD__, "", "RecentChange arrived. Storing achievement that we've already seen.", $wgWikiaForceAIAFdebug);
			$additionalData = array('Badge' => $wgAchievementToAddToRc);
			MyHome::storeInRecentChanges($rc, $additionalData);
			unset($wgAchievementToAddToRc);
		}

		wfProfileOut( __METHOD__ );
		return true;
	} // end savingAnRc()

	/**
	 * Called upon the successful save of a RecentChange.
	 */
	public static function savedAnRc(&$rc){
		global $wgARecentChangeHasBeenSaved, $wgWikiaForceAIAFdebug;
		wfProfileIn( __METHOD__ );

		// Mark the global indicating that an RC has been saved on this pageload (and which RC it was).
		// Due to slave-lag, instead of storing the rc_id and looking it up (which didn't always work, even with a retry-loop), store entire RC.
		$wgARecentChangeHasBeenSaved = $rc;
		wfDebugLog( "activityfeed", __METHOD__ . ": RecentChange has been saved (presumably no achievement yet). RC: ".print_r($wgARecentChangeHasBeenSaved, true), $wgWikiaForceAIAFdebug );

		wfProfileOut( __METHOD__ );
		return true;
	}

	public static function getWikiActivitySurrogateKey() {
		return Wikia::surrogateKey( 'special-wiki-activity' );
	}

	public static function onRevisionInsertComplete() {
		Wikia::purgeSurrogateKey( self::getWikiActivitySurrogateKey() );

		return true;
	}

}
