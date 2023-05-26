<?php

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

	function clean($string) {
		$string = str_replace(' ', '-', $string); 	 
		return preg_replace('/[^A-Za-z0-9\-]/', '', $string);
	}
	$country = clean($_REQUEST['country']);
	$url='https://api.opencagedata.com/geocode/v1/json?key=31e9afe46a3341c9a321c68829c3c366&q=' . $country;

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
	$output['data'] = $decode['results'];
	$output['data']['northeast'] = $decode['results'][0]['bounds']['northeast'];
	$output['data']['southwest'] = $decode['results'][0]['bounds']['southwest'];
	$output['data']['flag'] = $decode['results'][0]['annotations']['flag'];

	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>
