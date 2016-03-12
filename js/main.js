(function () {
"use strict";

var closedPostClass = 'closed';
var openedPostClass = 'opened';
var smallScreen = false;

/**
	Handels all the stuff that happens, when a post is clicked:
	- loading the post content or closing it
	- checks like, if there is another currently open post
	- while loading, showing a "page on load"-message
	- unfold the content by calling .show() or .hide() to close it
	- after closing, the post will be removed, not only visibility = hidden

	Approach was, not using jQueryUI ...

	@parameters:
	referencedPost - the "clicked" post
*/
function clickOnPostHandler(referencedPost) {
	var postContentClass = 'post_content';
	var loadingMessageClass = 'loadingMessage';
	
	// WHEN THIS POST IS STILL CLOSED
	if ( referencedPost.hasClass(closedPostClass) ) {
		var htmlLoadingMessage = '<p class="loadingMessage"><img src="images/ajax-loader.gif" alt="ajax-loader">loading the content...</p>';

		// IF THERE IS SOMEWHERE OPEN CONTENT

		// REMOVE LOADING-MESSAGE
		if ( $('div.'+loadingMessageClass).length !== 0 ) {
			closeAndRemovePostContent($('div.'+openedPostClass), loadingMessageClass, 400);

		// REMOVE CONTENT
		} else if ( $('div.'+openedPostClass).length !== 0 ) {
			closeAndRemovePostContent($('div.'+openedPostClass), postContentClass, 600);
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
					$("div.post_content").show(1250, function() {
						scrollToElement(referencedPost);
					});
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
	} // end if / else-if condition hasClass(closedPostClass)
	
	//return false; 
} // end function click on post handler 


function clickOnOrderButtonHandler(event) {
	var clickedButton = event.currentTarget.id;
	var activeOrder = $("body").attr("data-active-order");

	if( activeOrder !== undefined && clickedButton.indexOf(activeOrder) !== -1 ) {
		// do nothing, because the order of the clicked button is already active
	} else {
		$("body").attr("data-active-order", clickedButton.substring(4));
		
		loadAllPosts();
	}
}

/**
	Hides and removes the content of a post or the loading message when loading the post-content 

	@parameters: 
	referencedPost - the object of the openend "post div" element
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
	Just make a call to the DB (via PHP-script)

	@parameters:
	param - parameter for the DB-select
*/
function getPostContentFromDBAsync(param) {
	return $.post( 'php/phpScript.php', { postId: param });
}

/**
	Load all posts with their meta data from the DB/PHP.

	@parameters:
	metaDataType - string that describes, what metaData and what order are loaded and how the page is going to be build up
*/
function getAllPostsAndMetaDataFromDBAsync(metaDataType) {
	var json = $.ajax({
		type: "POST",
		url: 'php/phpScript.php', 
		data: { metaData: metaDataType }, 
		dataType: "json"
	}); 
	return json;
}

/**
	Load all posts with their meta data from the DB.
	Depending on the given parameter @metaDataType, run the specific building function.
	
	@parameters:
	metaDataType - string that describes, what metaData and what order are loaded and how the page is going to be build up
*/
function loadAllPosts() {
	var order = $("body").attr("data-active-order");
	if( order === undefined ) {
		// default
		order = "post_date";
		$("body").attr("data-active-order", order);
	} else {
		// clean up articles because the view is going to be refreshed
		$("#main article").fadeOut();
		$("#main article").attr("class", "to_delete");
	}

	// ORDER BY START DATE, GROUP BY COUNTRY
	if(order === 'start_date') {
		getAllPostsAndMetaDataFromDBAsync(order)
			.done(buildPostContentByStartDate)
			.fail(function() {
				alert("sorry :-( ...there is some problem with the DB. Please inform the admin.");
		});
	// ORDER BY POST DATE, NO GROUPING
	} else if(order === 'post_date') {
		getAllPostsAndMetaDataFromDBAsync(order)
			.done(buildPostContentByPostDate)
			.fail(function() {
				alert("sorry :-( ...there is some problem with the DB. Please inform the admin.");
		});
	}

	
}


/**
	Order by start date build function. (start date = the real date, we were in the specific country)
	Build up the page via mustacheJS with data coming via JSON data from the DB/PHP.
	The correct order of the posts is already defined by the DB.

	@parameters:
	data - JSON data from the DB (PHP)
*/
function buildPostContentByStartDate(data) {
	var country = "";
	var start_date, end_date, article_id, post_date, date_range, articleTemplate, mustacheHtml, selectionTemplate;

	$.each(data ,function( index, value ) {

		// if new article - grouped by country
		if( country !== value.country ) {
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

			// add flag size for responsible design regarding to screen size at page load
			value.flagsize = "32";
			if(smallScreen) {value.flagsize = "24";}

			// mustache template for the article	
			articleTemplate = $('#postArticleStartDateTpl').html();
			mustacheHtml = Mustache.to_html(articleTemplate, value);
				$("div#main").append(mustacheHtml);

				// additional id to add...
				$("div#main article").last().attr('id', article_id);
		} //end if for new country

		// using moment.js to set localized date
		post_date = moment(value.post_date);
		value.post_date = post_date.format("LL");

		// mustache template for the post-section
		selectionTemplate = $('#postSectionStartDateTpl').html();
		mustacheHtml = Mustache.to_html(selectionTemplate, value);
		$('#'+article_id).append(mustacheHtml);

		addPostAttributes(value);
	}); // end of each() loop

	// detach (less expensive remove) the hidden articles
	$(".to_delete").detach();

	// after the DOM is completed, add the event handler
	$('div.post').click(function() {
		clickOnPostHandler($(this));
	});
}

/**
	Order by post date build function.
	Build up the page via mustacheJS with data coming via JSON data from the DB/PHP.
	The correct order of the posts is already defined by the DB.

	@parameters:
	data - JSON data from the DB (PHP)
*/
function buildPostContentByPostDate(data) {
	var post_date, articleTemplate, mustacheHtml, selectionTemplate, prevMonthAgo;

	$.each(data ,function( index, value ) {
		// using moment.js to set localized date
		post_date = moment(value.post_date);
		value.post_date = post_date.format("LL");

		var timeRangeObject = generatePostDateTimeRangeAndLable(post_date);

		// if new article - grouped by country
		if( !prevMonthAgo || timeRangeObject.monthAgo !== prevMonthAgo ) {
			prevMonthAgo = timeRangeObject.monthAgo;

			value.article_header = timeRangeObject.lable;

			// using the mustache template to build the html for the article					
			articleTemplate = $('#postArticlePostDateTpl').html();
			mustacheHtml = Mustache.to_html(articleTemplate, value);
			$("div#main").append(mustacheHtml);

			// additional id to add...
			$("div#main article").last().attr('id', prevMonthAgo+"month");

		}

		// using the mustache template to build the html for the article
		selectionTemplate = $('#postSectionPostDateTpl').html();
		mustacheHtml = Mustache.to_html(selectionTemplate, value);
		$("#"+prevMonthAgo+"month").append(mustacheHtml);

		addPostAttributes(value);
	}); // end of each() loop

	// detach (less expensive remove) the hidden articles
	$(".to_delete").detach();

	// after the DOM is completed, add the event handler
	$("#"+prevMonthAgo+"month div.post").click(function() {
		clickOnPostHandler($(this));
	});
}

/**
	Calculates the range of time from the given date till now, using moment-range library.
	Also groups this date and generates a fitting lable.

	@parameters:
	post_date - a momentJS date 
*/
function generatePostDateTimeRangeAndLable(post_date) {
	var result = {};
	var thisMonth = 0, one_threeMonth = 1, three_sixMonth = 3, six_twelveMonth = 6, oneYearOrMore = 12;

	// difference from date to now in milliseconds
	var diffInMillis = Date.now() - Date.parse(post_date);

	// duration in month, flooring (rounding down)
	var monthAgo = moment.duration(diffInMillis).months();

	if(monthAgo === thisMonth) {
		result.monthAgo = 0;
		result.lable = "Posted in the last month";
	} else if(monthAgo >= oneYearOrMore) {
		result.monthAgo = 12;
		result.lable = "More than a year ago";
	} else if(monthAgo >= six_twelveMonth) {
		result.monthAgo = 6;
		result.lable = "More than six month ago";
	} else if(monthAgo >= three_sixMonth) {
		result.monthAgo = 3;
		result.lable = "More than 3 month ago";
	} else if(monthAgo >= one_threeMonth) {
		result.monthAgo = 1;
		result.lable = "More than one month ago";
	}
	return result;

}

/**
 	Adding id and some html5 data attributes for later on
 */
function addPostAttributes(value) {
	$('div.post').last()
		.attr("id", 'post_'+value.id_post)
		.attr("data-post-id", value.id_post)
		// note: flickr-address may be NULL, but jQuery will handle this by just skipping this attr
		.attr("data-flickr-address", value.flickr_address)
		.attr("data-country", value.country);
}

/**
	Scrolls the window up/down to the given element
	
	@parameters:
	elementSelector - selector of the element to scroll to (example: "#post_26")
*/
function scrollToElement(elementSelector) {
	$('html, body').animate({
      scrollTop: $(elementSelector).offset().top
   }, 300);
}

/**
	After the initial document load, set a boolean whether the screen size is >=625px or higher .
*/
function setInitialScreenSize() {
	smallScreen = window.matchMedia('(max-width: 625px)').matches;
}

/**
	Hander for window-resize.
	If the size of 625px is reached, it sets the correct image-path for the new size.
	The replace is only called, when there is a actual change and not at the initial page load.
*/
function resizeHandler() {
	var isActualScreenSmall = window.matchMedia('(max-width: 625px)').matches;
	// XOR bitoperation: 1, if the values differ
	if( (isActualScreenSmall ^ smallScreen) === 1 ) { 
		smallScreen = isActualScreenSmall ;

		// The correct initial flag size is set in loadAllPosts() with the templating
		if(smallScreen) {
			$("article em img").each(function() {
				$(this).attr("src", $(this).attr("src").replace(/\d+/g, "24") );
			});
		} else {
			$("article em img").each(function() {
				$(this).attr("src", $(this).attr("src").replace(/\d+/g, "32") );
			});
		}
	}
}

/**
	Setting up an email address in a more secure way for SPAM bots according to the method from:
	http://www.the-art-of-web.com/javascript/mailto/
*/
function generateMailTo() {
	var encodedString = "%28%66%75%6e%63%74%69%6f%6e%28%29%20%7b%76%61%72%20%72%6d%6e%79%6b%31%34%3d%5b%27%25%36%63%25%36%31%25%37%32%25%37%33%25%37%31%25%36%39%25%36%65%25%36%37%25%37%34%25%37%32%25%36%31%25%37%36%25%36%35%25%36%63%27%2c%5b%27%25%36%34%25%36%35%27%2c%27%25%36%63%25%36%34%25%36%35%25%36%65%25%36%62%25%36%35%25%37%37%25%36%39%25%32%64%25%36%39%25%37%34%27%5d%2e%72%65%76%65%72%73%65%28%29%2e%6a%6f%69%6e%28%27%2e%27%29%5d%2e%6a%6f%69%6e%28%27%40%27%29%3b%76%61%72%20%65%74%76%75%6b%38%38%3d%75%6e%65%73%63%61%70%65%28%72%6d%6e%79%6b%31%34%29%3b%72%65%74%75%72%6e%20%27%6d%61%69%27%2b%27%6c%74%6f%3a%27%2b%72%6d%6e%79%6b%31%34%3b%7d%28%29%29";

	$("nav a.email_icon").attr("href", eval(decodeURIComponent(encodedString)));
}

/**
	helper function to build the mailto string
*/
function encodeToHex(str) {
	var arr1 = [];  
	if(str !== null) {
		for (var i = 0; i < str.length; i++) {
			var hex = "%"+Number(str.charCodeAt(i)).toString(16);  
			arr1.push(hex);  
		}
	}
	return arr1.join('');  
}

$(document).ready(function(){
	setInitialScreenSize();
	generateMailTo();

	$("nav button").click(clickOnOrderButtonHandler);

	loadAllPosts();

	// set screenSize and handler for exchanging content by resizing to and from small screens.
	$( window ).resize(resizeHandler);
});



}());