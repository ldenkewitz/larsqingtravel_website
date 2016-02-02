<?php
	/*Simple PHP-Script to connect to the MySQL-DB to load all the website content stored in there.*/
	
	if( isset($_GET['postId']) ) {
		getPostContentFromSpecificPost($_GET['postId']);
	} elseif ( isset($_GET['metaData']) ) {
		getAllPostsAndMetaData($_GET['metaData']);
	}

	function getAllPostsAndMetaData($select_view) {
		$conn = connectToDB();
		switch ($select_view) {
			case 'start_date':
				$sql = "select * from view_english_post_meta_data_by_start_date;";
				break;
			
			case 'post_date':
				$sql = "select id_post, author, post_date, start_date_country, end_date_country, locale, caption, country from post 
						JOIN post_i18n using (id_post) 
						join post_en_meta_data using (id_post_i18n)
						ORDER BY post.post_date desc;";
				break;

			default:
				$sql = "select * from view_english_post_meta_data_by_start_date;";
				break;
		}
		$result = $conn->query($sql);
		$jsonResult = array();
		if ($result->num_rows > 0) {
		    while($row = $result->fetch_assoc()) {
		    	$jsonResult[] = $row;
		    }
		}

		echo json_encode($jsonResult);
	}


	function getPostContentFromSpecificPost($postId) {
		$conn = connectToDB();
			$sql = "SELECT content FROM post 
				JOIN post_language USING (id_post)
				JOIN post_meta_data USING (id_post_language)
				JOIN post_text_content USING (id_post_language)
				WHERE id_post = '$postId'";
			
			$result = $conn->query($sql);

			$content = "";

			if ($result->num_rows > 0) {
			    while($row = $result->fetch_assoc()) {
			        $content = $row["content"];
			    }
			}

			echo $content;
	}

	function connectToDB() {
		$conn = new mysqli('localhost', 'travelSelectUser', 'travel', 'travel_db');
		//$conn = new mysqli('ldenkewi-it.de', 'cu-de_test1234', 'Test1234!', 'cu-denkewitzlars01_test');

		if($conn->connection_error){
			echo "connection error!";
			exit();
		}
		return $conn;
	}

	/*
	function getPageData($pageName) {
		$conn = connectToDB();
		//$sql = "SELECT * FROM posts WHERE title = '$pageName'";
		$sql = "SELECT * FROM posts WHERE title = 'hongkong'";
		$result = $conn->query($sql);

		$content = "";

		if ($result->num_rows > 0) {
		    while($row = $result->fetch_assoc()) {
		        $content .= "<p>" . $row["content"] . "</p> \n\n";
		    }
		}

		$html = '<p>' . $pageName . "</p> \n\n";
		$html .= $content;

		$conn->close();
		echo $html;
	}

	function connectToDB() {
		//$conn = new mysqli('localhost', 'travelSelectUser', 'travel', 'test_db');
		$conn = new mysqli('ldenkewi-it.de', 'cu-de_test1234', 'Test1234!', 'cu-denkewitzlars01_test');
		if($conn->connection_error){
			exit();
		}
		return $conn;
	}
	*/
?>