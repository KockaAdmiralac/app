<?php
class ARecoveryUnlockCSS {
	const CSS_FILE_PATH = 'extensions/wikia/ARecoveryEngine/css/recoveryUnlock.scss';
	const API_URL = 'http://cs-api.sp-prod.net/';
	const API_ENDPOINT = 'sp_create_csurl';
	const CACHE_TTL = 3600 * 10; //10h
	const TIMEOUT = 10;

	private $outputPage = null;

	public function __construct(OutputPage $outputPage) {
		$this->outputPage = $outputPage;
	}

	public function getUnlockCSSUrl() {
		global $wgServer, $wgSourcePointAccountId, $wgEnableUsingSourcePointProxyForCSS;
		$wikiaCssUrl = $this->getWikiaUnlockCSSUrl();
		$memcKey = $wikiaCssUrl;
		$memCache = F::app()->wg->Memc;

		if ( $wgEnableUsingSourcePointProxyForCSS ) {
			$jsonData = [
				"account_id" => $wgSourcePointAccountId,
				"is_pub_resource" => false,
				"pub_base" => $wgServer."/__are",
				"resource" => $wikiaCssUrl
			];

			$cachedCriptedUrl = $memCache->get( $memcKey );
			if ( $cachedCriptedUrl ) {
				return $cachedCriptedUrl;
			} else {
				$spQuery = self::postJson(self::API_URL . self::API_ENDPOINT, $jsonData);
				if ( $spQuery['code'] == 200 && $this->verifyContent( $spQuery['response'] ) ) {
					$memCache->set( $memcKey, $spQuery['response'], self::CACHE_TTL) ;
					return $spQuery['response'];
				} else {
					\Wikia\Logger\WikiaLogger::instance()
						->warning( 'Failed to fetch crypted CSS',
							['url' => self::API_URL . self::API_ENDPOINT,
							 'data' => $jsonData]
						);
				}
			}
		}
		return $wikiaCssUrl;
	}

	private function verifyContent($url) {
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_TIMEOUT, self::TIMEOUT);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$content = curl_exec($ch);
		curl_close($ch);

		if (strpos($content, '#WikiaArticle') !== false) {
			return true;
		}
		return false;
	}

	private function getWikiaUnlockCSSUrl() {
		$am = AssetsManager::getInstance();
		$files = [self::CSS_FILE_PATH];
		$cssLink = $am->getSassesUrl($files);
		return $cssLink;
	}

	private function postJson( $url, $jsonString ) {

		if ( is_array( $jsonString ) ) {
			$jsonString = json_encode( $jsonString );
		}
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_TIMEOUT, self::TIMEOUT);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
		curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonString);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(
				'Content-Type: application/json',
				'Content-Length: ' . strlen($jsonString) )
		);
		$result = curl_exec($ch);
		$info = curl_getinfo($ch);
		curl_close($ch);
		return array( 'response' => $result, 'code' => $info['http_code'] );
	}

}