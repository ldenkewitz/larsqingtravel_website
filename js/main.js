var htmlLoadingMessage = '<p class="loadingMessage"><img src="images/ajax-loader.gif" alt="ajax-loader">loading the content...</p>';
var loadingMessageClass = 'loadingMessage';
var htmlPostContentDiv = '<div class="post_content"></div>';
var postContentClass = 'post_content';
var closedPostClass = 'closed';
var openedPostClass = 'opened';

$(document).ready(function(){

	/***********************************************
		HANDLER FOR OPENING / CLOSING THE POSTs
	************************************************/
	$('a.post').click(function() {
		linkName = $(this).attr('href');
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
			referencedPostLink.children("span").text('-');
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
						$(referencedPostLink).after(htmlPostContentDiv);
						$('.post_content').html(data).show(1250, function() {

							// SET BROWSER URL TO THE ACTUAL POST-ADDRESS
							if( referencedPostLink.attr('name') ) {
								cleanReturnUrl('#' + referencedPostLink.attr('name'));
							}
						});
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
	$(referencedPostLink).children('span').text('+');
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
/*		if(success == 'success') {

			// NOW UNLOAD THE LOADING MESSAGE
			$('.'+loadingMessageClass).hide(400, function() {
				$(this).remove();
				
				// DISPLAY THE CONTENT OF THE POST
				$(referencedPostLink).after(htmlPostContentDiv);
				$('.post_content').html(data).show(1250, function() {

					// SET BROWSER URL TO THE ACTUAL POST-ADDRESS
					if( referencedPostLink.attr('name') ) {
						cleanReturnUrl('#' + referencedPostLink.attr('name'));
					}
				});
			});
		}
	}).error(function(){
		alert('You are trying to open a page that apparently does not exist.');
		closeAndRemovePostContent($('.'+openedPostClass), loadingMessageClass, 400);
	});*/
}

/**
	Just make a call to the DB (via PHP-script)

	@parameters:
	param - parameter for the DB-select
*/
function getPostContentFromDBAsync(param) {
	return $.get( 'php/phpScript.php', { page_name: param });
}
	/**
		To handle the result in JSON

		$.get( "test.php", function( data ) {
		  $( "body" )
	    	.append( "Name: " + data.name ) // John
	    	.append( "Time: " + data.time ); //  2pm
		}, "json" );
	*/

