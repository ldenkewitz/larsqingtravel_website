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
		linkName = $(this).attr('data-link');
		referencedPostLink = $(this);

		// WHEN THIS POST IS STILL CLOSED
		if ( referencedPostLink.hasClass(closedPostClass) ) {

			// IF THERE IS SOMEWHERE OPEN CONTENT

			// REMOVE LOADING-MESSAGE
			if ( $('.'+loadingMessageClass).length !== 0 ) {
				closeAndRemovePostContent($('.'+openedPostClass), loadingMessageClass, 400);

			// REMOVE CONTENT
			} else if ( $('.'+openedPostClass).length !== 0 ) {
				closeAndRemovePostContent($('.'+openedPostClass), postContentClass, 600);
			}


			// CHANGE CLASSES
			referencedPostLink.toggleClass(closedPostClass).toggleClass(openedPostClass);
			
			// SHOW LOADING MESSAGE
			referencedPostLink.children("span.open_indicator").text('-').css("background-color", "silver").css("padding", "0px 12px 3px 12px");
			referencedPostLink.after(htmlLoadingMessage);
			$('.'+loadingMessageClass).show(400, function() {

				// LOAD THE CONTENT
//				getPostContentFromDBAsync('hongkong')
				getPostContentFromFilesAsync(linkName)
				.done(function(data) {
					// NOW UNLOAD THE LOADING MESSAGE
					$('.'+loadingMessageClass).hide(400, function() {
						$(this).remove();
						
						// DISPLAY THE CONTENT OF THE POST
						var htmlPostContentDiv = '<div class="post_content"></div>';
						var htmlPostContentFooterDiv = '<div class="post_footer"></div>';

						$(referencedPostLink).after(htmlPostContentDiv);
						$('.post_content').html(data).show(1250, function() {

							// SET BROWSER URL TO THE ACTUAL POST-ADDRESS
							if( referencedPostLink.attr('name') ) {
								cleanReturnUrl('#' + referencedPostLink.attr('name'));
							}
						});

						$('.post_content').append(htmlPostContentFooterDiv);
						//<p><strong>Columbia - November 2015 to February 2016</strong></p>
						$('.post_footer').html('<a href="http://www.google.com"> > Find more pictures from <strong> Colombia </strong> on our flickr album</a>');
					});
				
				}).fail(function(data) {
					alert("sorry :-( ...there is some problem with the DB. Please inform the admin.");
					closeAndRemovePostContent(referencedPostLink, loadingMessageClass, 400);
				});
			});


		// IF THE POST WAS ALREADY OPENED 
		} else if ( referencedPostLink.hasClass(openedPostClass) ) {
			
			// REMOVE LOADING-MESSAGE
			if ( $('.'+loadingMessageClass).length !== 0 ) {
				closeAndRemovePostContent(this, loadingMessageClass, 400);
			
			// REMOVE POST-CONTENT
			} else if($('div.'+postContentClass).length !== 0) {
				closeAndRemovePostContent(this, postContentClass, 600);
			}
		}
		// NOTHING TO RETURN -> NO LINK RESOLUTION
		return false;
	});
});

/**
	Hides and removes the content of a post or the loading message when loading the post-content 

	@parameters: 
	referencedPostLink - the object of the openend "div.post a" element
	classToClose - class of element that has to be hidden and removed
	hideDuration - milliseconds of the hiding effect
*/
function closeAndRemovePostContent(referencedPostLink, classToClose, hideDuration) {
	$(referencedPostLink).toggleClass(openedPostClass).toggleClass(closedPostClass);
	$(referencedPostLink).children('span.open_indicator').text('+').css("background-color", "#e5e5e5").css("padding", "0px 10px 3px 10px");
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
function cleanReturnUrl(innerLink) {
	// SET BROWSER URL TO THE ACTUAL POST-ADDRESS
	var returnLink = window.location.href;
	var position;
	position = returnLink.search('#');
	if (position > -1) {returnLink = returnLink.substring(0, position);}
	if (innerLink) {returnLink += innerLink;}
	window.location.href = returnLink;
}


function getPostContentFromFilesAsync(referencedPostLink) {
	return $.get(linkName)
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
	After this, build up the page by adding alle the HTML-elements, coming via JSON from the DB/PHP.
	Regarding to @metaDataType the page-construction-process differs...
	The right order is already given by the DB via the specific View.

	@parameters:
	metaDataType - string that describes, what metaData and what order are loaded and how the page is going to be build up
*/
function loadAllPosts(metaDataType) {
	getAllPostsAndMetaDataFromDBAsync(metaDataType)
	.done(function(data) {

		// ORDER BY START DATE, GROUP BY COUNTRY
		if(metaDataType == 'start_date') {

			var articleClass = "";
			var start_date, end_date, article_id, post_div_id, post_date, date_range;
			$.each(data ,function( index, value ) {

				if( articleClass != value.country ) {
					start_date = moment(value.start_date_country);
					end_date = moment(value.end_date_country);
					articleClass = value.country;
					article_id = value.country.replace(" ", "_")+"_"+start_date.format("MM-YYYY");

					// building the article

					// if the trip was in beneath the same month of the same year
					if(start_date.year() == end_date.year() && start_date.month() == end_date.month()) {
						date_range = start_date.format("MMM YYYY");
					}else{
						date_range = start_date.format("MMM YYYY")+" - "+end_date.format("MMM YYYY");
					}

					$("<article>", {class: "date_and_country", id: article_id }).append(
						$("<h3>").html(date_range+" <small><i> ("+value.country+")</i></small>")
					).appendTo("div#main");
				}

				// building the section

				post_date = moment(value.post_date);

				$("<section>", {class: "post"}).append(
					$("<div>", {class: "post closed", id: "post_"+value.id_post }).attr("data-post-id", value.id_post).append(
						$("<span>", {class: "open_indicator"}).text("+")).append(
						$("<span>", {class: "post_caption"}).text(value.caption)).append(
						$("<div>", {class: "post_metadata"}).append(
							$("<p>", {class: "post_metadata"}).text(value.author+" | "+post_date.format("LL"))
						)
					)
				).appendTo("#"+article_id); 
			});
			
		// ORDER BY POST DATE, SECOND ORDER BY COUNTRY
		} else if(metaDataType == 'post_date') {

			var post_date;

			$("<article>", {class: "post_date" }).append(
					$("<h3>").text("sorted by date of post...")
				).appendTo("div#main");

			$.each(data ,function( index, value ) {
				
				// building the section

				post_date = moment(value.post_date);

				$("<section>", {class: "post"}).append(
					$("<div>", {class: "post closed", id: "post_"+value.id_post }).attr("data-post-id", value.id_post).append(
						$("<span>", {class: "open_indicator"}).text("+")).append(
						$("<span>", {class: "post_caption"}).text(value.caption)).append(
						$("<div>", {class: "post_metadata"}).append(
							$("<p>", {class: "post_metadata"}).html(value.country+" | "+value.author+" | <strong>"+post_date.format("LL")+"</strong>")
						)
					)
				).appendTo("article.post_date"); 
			});

		}
	
	}).fail(function(data) {
		alert("sorry :-( ...there is some problem with the DB. Please inform the admin.");
	});
}