<?php

	// remove for production

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

	$url= 'https://api.geoapify.com/v2/places?categories=' . $_REQUEST['category'] . '&filter=circle:' . $_REQUEST['lat'] . ',' . $_REQUEST['lng'] . ',5000&limit=50&apiKey=83ab759a9c7c43d5946566f292a3a436';

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);	

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $decode['features'];

	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>
