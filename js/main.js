var htmlLoadingMessage = '<p class="loadingMessage"><img src="images/ajax-loader.gif" alt="ajax-loader">loading the content...</p>';
var loadingMessageClass = 'loadingMessage';
var htmlPostContentDiv = '<div class="post_content"></div>';
var postContentClass = 'post_content';
var closedPostClass = 'closed';
var openedPostClass = 'opened';

$(document).ready(function(){


	$('#main section div.post a').click(function() {
		linkName = $(this).attr('href');
		
		// ---------- HIDE OLD OPENED POST
		// http://api.jquery.com/hide/
		// ok here -> .hide() of post_content, if there is a post with class == "opened_post"
		// but first check, if THIS() is the opened_post itself
			// if it is itself: just .hide() THIS without opening another one
			// if it is not itself: .hide() the opened_post and .show() THIS
			// and in both cases, don't forget to change the "+" to "-" visa versa in the "div.post a"

		if ( $(this).hasClass(closedPostClass) ) {
			// IF THERE IS SOMEWHERE OPEN CONTENT
			if ( $('.'+openedPostClass).length != 0 ) {
				closeAndRemoveLoadingMessage($('.'+openedPostClass), postContentClass, 750);
			}

			$(this).removeClass(closedPostClass);
			$(this).addClass(openedPostClass);
			// SHOW LOADING MESSAGE
			$(this).children("span").html('-');
			$(this).after(htmlLoadingMessage);
			var actualObjectA = $(this);
			$('.'+loadingMessageClass).show(500, function() {
				$.get(linkName, function(data, success){
					if(success == 'success') {
						//alert('data loaded from: '+linkName+ '<br>'+data);

						//var data = '<p>Cartagena welcomed us with its heat, its festival and its safety challenges.</p>'
						// NOW UNLOAD THE LOADING MESSAGE
						$('.'+loadingMessageClass).hide(500, function() {
							$(this).remove();
							
							// DISPLAY THE CONTENT OF THE POST
							$(actualObjectA).after(htmlPostContentDiv);
							$('.post_content').html(data);
							$('.post_content').show(1500, function() {

								// SET BROWSER URL TO THE ACTUAL POST-ADDRESS
								if( actualObjectA.attr('name') ) {
									cleanReturnUrl('#' + actualObjectA.attr('name'));
								}
							});
						})
					}
				}).error(function(){
					alert('You are trying to open a page that apparently does not exist.');
					closeAndRemoveLoadingMessage($('.'+openedPostClass), loadingMessageClass, 500);
				});
			});

			// LOAD CONTENT FOR NEW POST

		// IF THE POST IS ALREADY OPENED 
		} else if ( $(this).hasClass(openedPostClass) ) {
			
			// REMOVE LOADING-MESSAGE
			if ( $('.'+loadingMessageClass).length != 0 ) {
				closeAndRemoveLoadingMessage(this, loadingMessageClass, 500);
			
			// REMOVE POST-CONTENT
			}else if($('div.'+postContentClass).length != 0){
				closeAndRemoveLoadingMessage(this, postContentClass, 750);
			};

		};

		return false;
	})
})

/**
	@parameters: 
	openPostA - the object of the openend "div.post a" element
	classToClose - class of element that has to be hidden and removed
	hideDuration - milliseconds of the hiding effect
*/
function closeAndRemoveLoadingMessage(openPostA, classToClose, hideDuration) {
	$(openPostA).removeClass(openedPostClass);
	$(openPostA).addClass(closedPostClass);
	$(openPostA).children('span').html('+');
	// DELETE LOADING MESSAGE
	$('.'+classToClose).hide(hideDuration, function() {
		$(this).remove();
	});
	return 'success';
}

/**
	@parameters:
	innerLink - Optional: at the original link address can this inner link address be concated
*/
function cleanReturnUrl(innerLink) {
	// SET BROWSER URL TO THE ACTUAL POST-ADDRESS
	var returnLink = window.location.href;
	var position;
	position = returnLink.search('#');
	if (position > -1) {returnLink = returnLink.substring(0, position)};
	if (innerLink) {returnLink += innerLink};
	window.location.href = returnLink;
}
