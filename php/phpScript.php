<?php
	/*Simple PHP-Script to connect to the MySQL-DB to load all the website content stored in there
	and return the results either as JSON or as plain text(html-content).*/
	
	if( isset($_POST['postId']) ) {
		getPostContentFromSpecificPost($_POST['postId']);
	} elseif ( isset($_POST['metaData']) ) {
		getAllPostsAndMetaData($_POST['metaData']);
	}

	function getAllPostsAndMetaData($select_view) {
		$conn = connectToDB();
		switch ($select_view) {
			case 'start_date':
				$sql = "select * from view_english_post_meta_data_by_start_date;";
				break;
			
			case 'post_date':
				$sql = "select * from view_english_post_meta_data_by_post_date;";
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

		$result->free();
		$conn->close();
		echo json_encode($jsonResult);
	}


	function getPostContentFromSpecificPost($postId) {
		$conn = connectToDB();
			$sql = "select content from view_english_post_content where id_post = '$postId'";

			// in case the server-setting for the client is not set to utf8 charset....bad for chinese :-p
			//mysqli_set_charset($conn,"utf8");
			$result = $conn->query($sql);

			$content = "";

			if ($result->num_rows > 0) {
			    while($row = $result->fetch_assoc()) {
			        $content = $row["content"];
			    }
			}

			$result->free();
			$conn->close();
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

?>