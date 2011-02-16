package com.wikia.selenium.tests;

import java.io.File;

import static com.thoughtworks.selenium.grid.tools.ThreadSafeSeleniumSessionStorage.session;
import static org.testng.AssertJUnit.assertEquals;
import static org.testng.AssertJUnit.assertTrue;
import static org.testng.AssertJUnit.assertFalse;

import org.testng.annotations.Parameters;
import org.testng.annotations.Test;

public class PhotoGalleryTest extends BaseTest {
	private String uploadFileUrl = "http://www.google.com/logos/chopin10-hp.gif";
	private static final String testArticleName = "WikiaPhotoGalleryTest";

	// let's create an article on which view mode tests will be performed
	private void prepareTestArticle() throws Exception {
		editArticle(PhotoGalleryTest.testArticleName, "Wikia automated test for PhotoGallery\n\n===Gallery===\n\n<gallery>\nchopin10-hp.gif\n</gallery>\n\n===Slideshow===\n\n<gallery type=\"slideshow\">\nWiki.png|'''Caption'''\n</gallery>\n\n[[Category:Wikia tests]]");
		session().waitForPageToLoad(this.getTimeout());
	}

	@Test(groups={"CI"})
	public void testSlideshowPopOut() throws Exception {
		loginAsStaff();
		prepareTestArticle();

		// open slideshow popout
		waitForElement("//img[@class='wikia-slideshow-popout']");
		session().click("//img[@class='wikia-slideshow-popout']");
		waitForElement("//div[@class='wikia-slideshow-popout-images-wrapper']", this.getTimeout());

		// verify existance of image carousel
		assertTrue(session().isElementPresent("//div[@class='wikia-slideshow-popout-carousel']"));

		// stop slideshow
		session().click("//div[@class='wikia-slideshow-popout-start-stop']/a[2]");
		waitForElement("//section[@state='stopped']", this.getTimeout());

		// restart slideshow
		session().click("//div[@class='wikia-slideshow-popout-start-stop']/a[1]");
		waitForElement("//section[@state='playing']", this.getTimeout());

		// check "Add photo" button
		session().click("//a[@class='wikia-button secondary wikia-slideshow-popout-add-image']");
		waitForElement("//section[@id='WikiaPhotoGalleryEditor']", this.getTimeout());

		// slideshow popout should be closed now
		assertFalse(session().isElementPresent("//div[@class='wikia-slideshow-popout-images-wrapper']"));
	}

	@Test(groups={"CI"})
	public void testSlideshowInViewMode() throws Exception {
		loginAsStaff();
		uploadImage();
		prepareTestArticle();

		// open editor's dialog
		waitForElement("link=Add photo");
		session().click("link=Add photo");
		waitForElement("//section[@id='WikiaPhotoGalleryEditor']", this.getTimeout());
		assertFalse(session().isVisible("WikiaPhotoGallerySearchResults"));
		session().click("WikiaPhotoGallerySlideshowAddImage");
		waitForElementVisible("WikiaPhotoGallerySearchResults");

		// let's switch to list of images from current article
		session().click("//p[@id='WikiaPhotoGallerySearchResultsChooser']/span[@class='clickable']");

		// select first image from list of images from current article
		session().click("//div[@id='WikiaPhotoGallerySearchResults']/ul[@type='images']/li/label");
		session().click("WikiaPhotoGallerySearchResultsSelect");

		//add caption, link and linktext
		session().type("WikiaPhotoGalleryEditorCaption", "Test caption");
		session().type("WikiaPhotoSlideshowLink", "Test link");
		session().type("WikiaPhotoSlideshowLinkText", "Go to test link article");
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");
		waitForElementVisible("//div[@id='WikiaPhotoGallerySlideshowEditorPreview']");

		// let's save this slideshow
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");
		session().waitForPageToLoad(this.getTimeout());

		// verify edit from view mode
		assertTrue(session().isElementPresent("//div[@class='wikia-slideshow clearfix floatright']"));

		// check for image added from view mode
		assertTrue(session().isElementPresent("//div[@class='wikia-slideshow clearfix floatright']/div/div/ul/li/span[@class='wikia-slideshow-link-overlay']"));
	}

	@Test(groups={"CI"})
	public void testGalleryInViewMode() throws Exception {
		loginAsStaff();
		prepareTestArticle();

		// open editor's dialog
		waitForElement("link=Add a photo to this gallery");
		session().click("//a[contains(@class, 'wikia-photogallery-add')]");
		waitForElement("//section[@id='WikiaPhotoGalleryEditor']", this.getTimeout());
		waitForElement("WikiaPhotoGallerySearchResults", this.getTimeout());
		assertFalse(session().isVisible("WikiaPhotoGallerySearchResults"));
		session().click("WikiaPhotoGalleryAddImage");
		waitForElementVisible("WikiaPhotoGallerySearchResults");

		// select first image from "most recent uploads" list
		session().click("//div[@id='WikiaPhotoGallerySearchResults']/ul[@type='uploaded']/li/label");
		session().click("WikiaPhotoGallerySearchResultsSelect");

		//add caption and link
		session().type("WikiaPhotoGalleryEditorCaption", "Test caption");
		session().type("WikiaPhotoGalleryLink", "Test link");
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");
		waitForElementVisible("//div[@id='WikiaPhotoGalleryEditorPreview']");

		// let's save this gallery
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");
		session().waitForPageToLoad(this.getTimeout());

		// verify edit from view mode
		assertTrue(session().isElementPresent("//span[@class='wikia-gallery-item']"));

		// check for image added from view mode
		assertTrue(session().isElementPresent("//span[2 and @class='wikia-gallery-item']//img[contains(@title,'Test link')]"));
	}

	@Test(groups={"CI"})
	public void testImageUpload() throws Exception {
		loginAsStaff();

		// go to edit page
		session().open("index.php?title=" + PhotoGalleryTest.testArticleName + "&action=edit&useeditor=mediawiki");
		session().waitForPageToLoad(this.getTimeout());

		// clear wikitext
		session().type("wpTextbox1", "");

		// check if button in toolbar exists
		assertTrue(session().isElementPresent("//img[@id='mw-editbutton-wpg']"));

		// open slideshow editor
		session().click("//img[@id='mw-editbutton-wpg']");
		waitForElement("//section[@id='WikiaPhotoGalleryEditor']", this.getTimeout());

		// let's use gallery flow
		session().click("//section[@id='WikiaPhotoGalleryEditor']//a[@type='1']");
		waitForElementVisible("//div[@id='WikiaPhotoGalleryEditorPreview']");
		waitForElementVisible("//span[contains(@class,'WikiaPhotoGalleryPreviewItem')]");

		// let's add an image
		session().click("//span[contains(@class,'WikiaPhotoGalleryPreviewItem')]/div/div/a");
		waitForElementVisible("WikiaPhotoGallerySearchResults");

		// upload form
		session().attachFile("WikiaPhotoGalleryImageUpload", uploadFileUrl);
		//session().type("WikiaPhotoGalleryImageUpload", uploadFileName);
		session().submit("WikiaPhotoGalleryImageUploadForm");

		// wait for upload to be completed (either conflict screen or photo options screen)
		session().waitForCondition("window.WikiaPhotoGallery.editor.currentPage > window.WikiaPhotoGallery.UPLOAD_FIND_PAGE", "7500");

		// conflict screen? (if so, reuse existing one)
		if (session().isElementPresent("WikiaPhotoGalleryEditorConflictReuse")) {
			session().click("WikiaPhotoGalleryEditorConflictReuse");
			waitForElementVisible("WikiaPhotoGalleryEditorCaptionImagePreview");
		}

		//add caption and link
		session().type("WikiaPhotoGalleryEditorCaption", "Test caption");
		session().type("WikiaPhotoGalleryLink", "Test link");
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");
		waitForElementVisible("//div[@id='WikiaPhotoGalleryEditorPreview']");

		// let's save this gallery and return to MW editor
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");

		// check wikitext
		String wikitext = session().getValue("wpTextbox1").replace("\r\n", "\n").replace("\r", "\n").trim();
		String pattern = "";

		pattern = "<gallery";
		assertTrue(wikitext.indexOf(pattern) > -1);

		pattern = "|Test caption|link=Test link";
		assertTrue(wikitext.indexOf(pattern) > -1);
	}

	@Test(groups={"CI"})
	public void testImageSearch() throws Exception {
		loginAsStaff();

		// go to edit page
		session().open("index.php?title=" + PhotoGalleryTest.testArticleName + "&action=edit&useeditor=mediawiki");
		session().waitForPageToLoad(this.getTimeout());

		// clear wikitext
		session().type("wpTextbox1", "");

		// check if button in toolbar exists
		assertTrue(session().isElementPresent("//img[@id='mw-editbutton-wpg']"));

		// open slideshow editor
		session().click("//img[@id='mw-editbutton-wpg']");
		waitForElement("//section[@id='WikiaPhotoGalleryEditor']", this.getTimeout());

		// let's use gallery flow
		session().click("//section[@id='WikiaPhotoGalleryEditor']//a[@type='1']");
		waitForElementVisible("//div[@id='WikiaPhotoGalleryEditorPreview']");
		waitForElementVisible("//span[contains(@class,'WikiaPhotoGalleryPreviewItem')]");

		// add new image
		session().click("WikiaPhotoGalleryAddImage");
		waitForElementVisible("WikiaPhotoGallerySearchResults");

		// search for images on wiki's main page
		session().type("//form[@id='WikiaPhotoGallerySearch']//input[@type='text']", "logo");
		session().click("//form[@id='WikiaPhotoGallerySearch']//button");
		waitForElement("//ul[@type='results']//li");

		// select first image
		session().click("//ul[@type='results']//li//label");
		session().click("WikiaPhotoGallerySearchResultsSelect");

		// add caption and link
		session().type("WikiaPhotoGalleryEditorCaption", "Test caption");
		session().type("WikiaPhotoGalleryLink", "Image search test");
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");
		waitForElementVisible("//div[@id='WikiaPhotoGalleryEditorPreview']");

		// let's save this gallery
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");

		// let's save edit page
		session().click("wpSave");
		session().waitForPageToLoad(this.getTimeout());

		// verify edit from view mode
		assertTrue(session().isElementPresent("//span[@class='wikia-gallery-item']"));

		// check for image added from view mode
		assertTrue(session().isElementPresent("//span[@class='wikia-gallery-item']//img[contains(@title,'Image search test')]"));
	}

	@Test(groups={"CI"})
	public void testEditInRTE() throws Exception {
		loginAsStaff();

		// go to edit page (RTE, but start in source mode)
		session().open("index.php?title=" + PhotoGalleryTest.testArticleName + "&action=edit&useeditor=source");
		session().waitForPageToLoad(this.getTimeout());

		// clear wikitext
		session().runScript("window.RTE.instance.setData('');");

		// switch to wysiwyg mode
		session().runScript("window.RTE.instance.switchMode('wysiwyg')");
		session().waitForCondition("window.RTE.instance.mode == 'wysiwyg'", "7500");

		// check if button in toolbar exists
		assertTrue(session().isElementPresent("//a[contains(@class, 'RTEGalleryButton')]"));

		// invoke dialog
		session().click("//a[contains(@class, 'RTEGalleryButton')]");
		waitForElement("//section[@id='WikiaPhotoGalleryEditor']", this.getTimeout());

		// let's use slideshow flow
		session().click("//section[@id='WikiaPhotoGalleryEditor']//a[@type='2']");
		assertFalse(session().isVisible("WikiaPhotoGallerySearchResults"));
		session().click("WikiaPhotoGallerySlideshowAddImage");
		waitForElementVisible("WikiaPhotoGallerySearchResults");

		// select first image from "most recent uploads" list
		session().click("//div[@id='WikiaPhotoGallerySearchResults']/ul[@type='uploaded']/li/label");
		session().click("WikiaPhotoGallerySearchResultsSelect");

		//add caption, link and linktext
		session().type("WikiaPhotoGalleryEditorCaption", "Test caption");
		session().type("WikiaPhotoSlideshowLink", "Test link");
		session().type("WikiaPhotoSlideshowLinkText", "Go to test link article");
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");
		waitForElementVisible("//div[@id='WikiaPhotoGallerySlideshowEditorPreview']");

		// use "cropping"
		session().click("WikiaPhotoGallerySlideshowCrop");

		// let's save this slideshow
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");
		waitForElementNotVisible("WikiaPhotoGallerySearchResults");
		session().click("wpSave");
		session().waitForPageToLoad(this.getTimeout());

		// verify edit from view mode
		assertTrue(session().isElementPresent("//div[@class='wikia-slideshow clearfix floatright']"));

		// check for image added from view mode
		assertTrue(session().isElementPresent("//div[@class='wikia-slideshow clearfix floatright']/div/div/ul/li/span[@class='wikia-slideshow-link-overlay']"));
	}

	//@author Marooned
	@Test(groups={"CI"})
	public void testFeedGallery() throws Exception {
		loginAsStaff();

		// go to edit page (RTE, but start in source mode)
		session().open("index.php?title=" + PhotoGalleryTest.testArticleName + "&action=edit&useeditor=source");

		// clear wikitext
		session().runScript("window.RTE.instance.setData('');");

		// switch to wysiwyg mode
		session().runScript("window.RTE.instance.switchMode('wysiwyg')");
		session().waitForCondition("window.RTE.instance.mode == 'wysiwyg'", "7500");

		// check if button in toolbar exists
		assertTrue(session().isElementPresent("//a[contains(@class, 'RTEGalleryButton')]"));

		// invoke dialog
		session().click("//a[contains(@class, 'RTEGalleryButton')]");
		waitForElement("//section[@id='WikiaPhotoGalleryEditor']", this.getTimeout());

		// let's use slideshow flow
		session().click("//section[@id='WikiaPhotoGalleryEditor']//a[@type='1']");
		waitForElementVisible("WikiaPhotoGalleryEditorPreview");

		//add feed link (little cheating here - fill readonly field and then click on checbox to invoke preview - so we don't have to fire up onblur event for the field)
		session().type("WikiaPhotoGalleryFeedUrl", "http://feeds.feedburner.com/bingimages");
		session().click("WikiaPhotoGalleryFeedInUse");
		//wait for filling up wrapper
		waitForElementVisible("//div[@id='WikiaPhotoGalleryEditorPreview']/*");

		// let's save this slideshow
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");

		//save the article
		session().click("wpSave");
		session().waitForPageToLoad(this.getTimeout());

		// verify edit from view mode
		assertTrue(session().isElementPresent("//div[contains(@class, 'wikia-gallery')]"));

		// check for image added from view mode
		assertTrue(session().isElementPresent("//div[contains(@class, 'wikia-gallery')]//img[contains(@class, 'image') and contains(@class, 'link-external') and contains(@class, 'lightbox')]"));
	}

	//@author Marooned
	@Test(groups={"CI"})
	public void testFeedSlideshow() throws Exception {
		loginAsStaff();

		// go to edit page (RTE, but start in source mode)
		session().open("index.php?title=" + PhotoGalleryTest.testArticleName + "&action=edit&useeditor=source");

		// clear wikitext
		session().runScript("window.RTE.instance.setData('');");

		// switch to wysiwyg mode
		session().runScript("window.RTE.instance.switchMode('wysiwyg')");
		session().waitForCondition("window.RTE.instance.mode == 'wysiwyg'", "7500");

		// check if button in toolbar exists
		assertTrue(session().isElementPresent("//a[contains(@class, 'RTEGalleryButton')]"));

		// invoke dialog
		session().click("//a[contains(@class, 'RTEGalleryButton')]");
		waitForElement("//section[@id='WikiaPhotoGalleryEditor']", this.getTimeout());

		// let's use slideshow flow
		session().click("//section[@id='WikiaPhotoGalleryEditor']//a[@type='2']");
		waitForElementVisible("WikiaPhotoGallerySlideshowEditorPreview");

		//add feed link (little cheating here - fill readonly field and then click on checbox to invoke preview - so we don't have to fire up onblur event for the field)
		session().type("WikiaPhotoGallerySlideshowFeedUrl", "http://feeds.feedburner.com/bingimages");
		session().click("WikiaPhotoGallerySlideshowFeedInUse");
		//wait for filling up wrapper
		waitForElementVisible("//div[@id='WikiaPhotoGallerySlideshowEditorPreview']/*");

		// let's save this slideshow
		session().click("//a[@id='WikiaPhotoGalleryEditorSave']");

		//save the article
		session().click("wpSave");
		session().waitForPageToLoad(this.getTimeout());

		// verify edit from view mode
		assertTrue(session().isElementPresent("//div[contains(@class, 'wikia-slideshow')]"));

		// check for image added from view mode
		assertTrue(session().isElementPresent("//div[contains(@class, 'wikia-slideshow')]/div/div/ul/li/span[@class='wikia-slideshow-link-overlay']"));
	}
}
