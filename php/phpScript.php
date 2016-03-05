<?php
   if( $_SERVER['REQUEST_METHOD'] == "POST" &&  isset($_POST['postId']) ) {
      getPostContentFromSpecificPost($_POST['postId']);
   } elseif ( $_SERVER['REQUEST_METHOD'] == "POST" && isset($_POST['metaData']) ) {
      getAllPostsAndMetaData($_POST['metaData']);
   }

   function getAllPostsAndMetaData($select_view) {
   	try {
	      $conn = connectToDB();
	      if(isset($conn)) {
	         switch ($select_view) {
	            case 'start_date':
	               $sql = "select id_post, author, post_date, start_date_country, end_date_country, locale, caption, country, flickr_address from post 
										JOIN post_i18n using (id_post) 
										JOIN post_en_meta_data using (id_post_i18n)
										ORDER BY post.start_date_country desc, id_post desc;";
	               break;
	            
	            case 'post_date':
	               $sql = "select id_post, author, post_date, start_date_country, end_date_country, locale, caption, country, flickr_address from post 
										JOIN post_i18n using (id_post) 
										JOIN post_en_meta_data using (id_post_i18n)
										ORDER BY post.post_date desc, post_en_meta_data.country;";
	               break;

	            default:
	               $sql = "select id_post, author, post_date, start_date_country, end_date_country, locale, caption, country, flickr_address from post 
										JOIN post_i18n using (id_post) 
										JOIN post_en_meta_data using (id_post_i18n)
										ORDER BY post.start_date_country desc, id_post desc;";
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
	         header('Content-type: application/json');
	         echo json_encode($jsonResult);
	      } else {
	         echo "problem - no connection established!";
	      }
   		
   	} catch (Exception $e) {
   		echo 'Caught exception: ',  $e->getMessage(), "\n";
   	}
   }

   function getPostContentFromSpecificPost($postId) {
      $conn = connectToDB();
      // SANITIZING THE PARAM -> ONLY INTEGER!
      if (!filter_var($postId, FILTER_VALIDATE_INT) === false) {
         //$postId = $conn->real_escape_string($postId);

      	$sql = "select id_post, content from post 
      				JOIN post_i18n using (id_post)
      				JOIN post_en_meta_data using (id_post_i18n)
      				JOIN post_en_content using (id_post_i18n)
      				where id_post = '$postId';";

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
      } else {
         echo "wrong input!";
      }
   }

   function connectToDB() {
      try {
         $fileName = "../../passwds/pw_travel.inc";
         $pwfile = fopen($fileName, "r") or die("Unable to open file!");
         $pw = fgets($pwfile);
         fclose($pwfile);

         $conn = new mysqli('localhost', 'travelSelectUser', $pw, 'travel_db');
         // $conn = new mysqli('ldenkewi-it.de:3306', 'cu-de_read_only', $pw, 'cu-denkewitzlars01_travel_db');
         if($conn->connection_error){
            echo "connection error\n";
            return null;
         }
         return $conn;

      } catch (Exception $e) {
         echo 'Caught exception: ',  $e->getMessage(), "\n";
         return null;
      }
   }

   /* creating a blowfish pw */
   function better_crypt($input, $rounds = 10)
  {
      $crypt_options = array(
         'cost' => $rounds
      );
      return password_hash($input, PASSWORD_BCRYPT, $crypt_options);
  }
?>