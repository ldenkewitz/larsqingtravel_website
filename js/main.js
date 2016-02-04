"use strict";

var htmlLoadingMessage = '<p class="loadingMessage"><img src="images/ajax-loader.gif" alt="ajax-loader">loading the content...</p>';
var loadingMessageClass = 'loadingMessage';
var postContentClass = 'post_content';
var closedPostClass = 'closed';
var openedPostClass = 'opened';

$(document).ready(function(){

	// read URL-data or anything else, default is metaDataType = start_date
	loadAllPosts("start_date");
	//loadAllPosts("post_date");

	/***********************************************
		HANDLER FOR OPENING / CLOSING THE POSTs
	************************************************/
	$('div.post').click(function() {
		clickOnPostHandler($(this));
	});
});


/**
	Handels all the stuff that happens, when a post is clicked:
	- loading the post content or closing it
	- checks like, if there is another currently open post
	- while loading, showing a "page on load"-message
	- unfold the content by calling .show() or .hide() to close it
	- after closing, the post will be removed, not only visibility = hidden

	@parameters:
	referencedPost - the "clicked" post
*/
function clickOnPostHandler(referencedPost) {

	// WHEN THIS POST IS STILL CLOSED
	if ( referencedPost.hasClass(closedPostClass) ) {

		// IF THERE IS SOMEWHERE OPEN CONTENT

		// REMOVE LOADING-MESSAGE
		if ( $('.'+loadingMessageClass).length !== 0 ) {
			closeAndRemovePostContent($('.'+openedPostClass), loadingMessageClass, 400);

		// REMOVE CONTENT
		} else if ( $('.'+openedPostClass).length !== 0 ) {
			closeAndRemovePostContent($('.'+openedPostClass), postContentClass, 600);
		}

		// CHANGE CLASSES
		referencedPost.toggleClass(closedPostClass).toggleClass(openedPostClass);
		
		// SHOW LOADING MESSAGE
		referencedPost.children("span.open_indicator").text('-').toggleClass(closedPostClass).toggleClass(openedPostClass);
		referencedPost.after(htmlLoadingMessage);
		$('.'+loadingMessageClass).show(400, function() {
			getPostContentFromDBAsync(referencedPost.attr("data-post-id")).done(function(data) {
				
				// NOW UNLOAD THE LOADING MESSAGE
				$('.'+loadingMessageClass).hide(400, function() {
					$(this).remove();
					
					// DISPLAY THE CONTENT OF THE POST
					var mustacheParam = {country:referencedPost.attr("data-country")};
					// flickr-address could be missing, in this case nothing towards the template, there is a condition..
					if (referencedPost.attr("data-flickr-address")) {
						mustacheParam.flickr_address = referencedPost.attr("data-flickr-address");
					}
					var contentTemplate = $("#postContentTpl").html();
					var mustacheHtml = Mustache.to_html(contentTemplate, mustacheParam);
					$(referencedPost).after(mustacheHtml);
					$("div.post_content").prepend(data);
					$("div.post_content").show(1250);
				}); // end of hide() - loadingMessage
			}); // end of asynch done() - contentFromDB
		}); // end of show() - loadingMessage

	// IF THE POST WAS ALREADY OPENED 
	} else if ( referencedPost.hasClass(openedPostClass) ) {
		
		// REMOVE LOADING-MESSAGE
		if ( $('.'+loadingMessageClass).length !== 0 ) {
			closeAndRemovePostContent(referencedPost, loadingMessageClass, 400);
		
		// REMOVE POST-CONTENT
		} else if($('div.'+postContentClass).length !== 0) {
			closeAndRemovePostContent(referencedPost, postContentClass, 600);
		}
	}
	// NOTHING TO RETURN -> NO LINK RESOLUTION
	return false;
}


/**
	Hides and removes the content of a post or the loading message when loading the post-content 

	@parameters: 
	referencedPost - the object of the openend "div.post a" element
	classToClose - class of element that has to be hidden and removed
	hideDuration - milliseconds of the hiding effect
*/
function closeAndRemovePostContent(referencedPost, classToClose, hideDuration) {
	$(referencedPost).toggleClass(openedPostClass).toggleClass(closedPostClass);
	$(referencedPost).children('span.open_indicator').text('+').toggleClass(closedPostClass).toggleClass(openedPostClass);
	// DELETE LOADING MESSAGE
	$('.'+classToClose).hide(hideDuration, function() {
		$(this).remove();
	});
	return 'success';
}

/**
	Actualizes the URL with the address of the last visited post 

	@parameters:
	innerLink - Optional: at the original link address can this inner link address be concated
*/

/*function cleanReturnUrl(innerLink) {
	// SET BROWSER URL TO THE ACTUAL POST-ADDRESS
	var returnLink = window.location.href;
	var position;
	position = returnLink.search('#');
	if (position > -1) {returnLink = returnLink.substring(0, position);}
	if (innerLink) {returnLink += innerLink;}
	window.location.href = returnLink;
}
*/

function getPostContentFromFilesAsync(referencedPost) {
	return $.get(linkName);
}

/**
	Just make a call to the DB (via PHP-script)

	@parameters:
	param - parameter for the DB-select
*/
function getPostContentFromDBAsync(param) {
	return $.get( 'php/phpScript.php', { postId: param });
}

/**
	Load all posts with their meta data from the DB/PHP.

	@parameters:
	metaDataType - string that describes, what metaData and what order are loaded and how the page is going to be build up
*/
function getAllPostsAndMetaDataFromDBAsync(metaDataType) {
	var json = $.getJSON( 'php/phpScript.php', { metaData: metaDataType } );
	return json;
}

/**
	Load all posts with their meta data from the DB.
	After this, build up the page via mustacheJS with data coming via JSON from the DB/PHP.
	Regarding to @metaDataType the page-construction-process differs...
	The right order is already given by the DB via the specific View.

	@parameters:
	metaDataType - string that describes, what metaData and what order are loaded and how the page is going to be build up
*/
function loadAllPosts(metaDataType) {
	getAllPostsAndMetaDataFromDBAsync(metaDataType).done(function(data) {

		

		// ORDER BY START DATE, GROUP BY COUNTRY
		if(metaDataType === 'start_date') {

			var country = "";
			var start_date, end_date, article_id, post_div_id, post_date, date_range, articleTemplate, mustacheHtml, selectionTemplate;

			$.each(data ,function( index, value ) {

				// if new article - grounped by country
				if( country != value.country ) {
					start_date = moment(value.start_date_country);
					end_date = moment(value.end_date_country);
					country = value.country;
					article_id = value.country.replace(" ", "_")+"_"+start_date.format("MM-YYYY");

					// if the trip was in beneath the same month of the same year
					if(start_date.year() === end_date.year() && start_date.month() === end_date.month()) {
						date_range = start_date.format("MMM YYYY");
					}else{
						date_range = start_date.format("MMM YYYY")+" - "+end_date.format("MMM YYYY");
					}

					// add the attribute to the object that is used by the template
					value.date_range = date_range;

					// using the mustache template to build the html for the article					
					articleTemplate = $('#postArticleTpl').html();
					mustacheHtml = Mustache.to_html(articleTemplate, value);
    				$("div#main").append(mustacheHtml);

    				// additional id to add...
    				$("div#main article").last().attr('id', article_id);
				} //end if for new country

				// using the mustache template to build the html for the article
				post_date = moment(value.post_date);
				value.post_date = post_date.format("LL");

				selectionTemplate = $('#postSectionTpl').html();
				mustacheHtml = Mustache.to_html(selectionTemplate, value);
				$('#'+article_id).append(mustacheHtml);

				// adding id and some html5 data attributes for later on
				$('#'+article_id+' section div.post').last()
					.attr("id", 'post_'+value.id_post)
					.attr("data-post-id", value.id_post)
					// note: flickr-address may be NULL, but jQuery will handle this by just skipping this attr
					.attr("data-flickr-address", value.flickr_address)
					.attr("data-country", value.country);
			}); // end of each() loop
			
		// ORDER BY POST DATE, SECOND ORDER BY COUNTRY
		} else if(metaDataType === 'post_date') {

			// using the mustache template to build the html for the article					
			articleTemplate = $('#postArticleByPostDateTpl').html();
			mustacheHtml = Mustache.to_html(articleTemplate, data);
			$("div#main").append(mustacheHtml);

			$.each(data ,function( index, value ) {
				
				// using the mustache template to build the html for the article
				post_date = moment(value.post_date);
				value.post_date = post_date.format("LL");

				selectionTemplate = $('#postSectionByPostDateTpl').html();
				mustacheHtml = Mustache.to_html(selectionTemplate, value);
				$("div#main article").append(mustacheHtml);

				// adding id and some html5 data attributes for later on
				$('div.post').last()
					.attr("id", 'post_'+value.id_post)
					.attr("data-post-id", value.id_post)
					// note: flickr-address may be NULL, but jQuery will handle this by just skipping this attr
					.attr("data-flickr-address", value.flickr_address)
					.attr("data-country", value.country);
			}); // end of each() loop
		} // end else if for metaDataTyp === 'post_date'
	
		//after the elements are added, bind the handler again
		$('div.post').click(function() {
			clickOnPostHandler($(this));
		});

	}).fail(function(data) {
		alert("sorry :-( ...there is some problem with the DB. Please inform the admin.");
	}); // end of asynch done() - contentDataFromDB
}