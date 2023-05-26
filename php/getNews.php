<?php

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);
	$url= 'https://newsdata.io/api/1/news?apikey=pub_22361b9931eeaf26a4aa5ee8c193ab6d96fd3&language=en&country=' . $_REQUEST['country'] . '&category=' . $_REQUEST['category'];
    $headers= ['X-Api-Key: 1h/rDDDW49K8cWz+sbiGxA==jz5sY7nWJRvXcBeS'];
	$ch = curl_init();
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
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
    $output['data'] = $decode;
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>
