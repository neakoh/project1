<?php

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);
	$url= 'https://api.api-ninjas.com/v1/city?country=' . $_REQUEST['countryCode'] . '&limit=20';
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