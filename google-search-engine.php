<?php

$serpAddress    =   "https://www.google.com/search?q=%22getting+clients+roadmap%22+%22uploaded%22";

//your anti-captcha.com key:
$anticaptchaKey =   "";

//we use a proxy which is banned in google serp
$failingProxy   =   "";

$cookiefile     =   "cookies.txt";

//cleaning cookie jar
file_put_contents($cookiefile, "");

echo "\nrequesing $serpAddress ... \n";
$response = request($serpAddress,
                  NULL,
                  NULL,
                  $cookiefile,
                  $failingProxy,
                  NULL,
                  true);


preg_match('~ocation: (.*?)\n~', $response, $output);
if (count($output) == 0) {
    echo "response from $serpAddress: \n\n";
    echo $response."\n\n";
    echo "no redirected detected, proxy should be fine\n";
    exit;
}
$redirect = trim($output[1]);
echo "redirected to $redirect\n";

$submitPageContent = request($redirect,
                  NULL,
                  NULL,
                  $cookiefile,
                  "172.93.142.32:3128",
                  NULL,
                  true);


//echo $submitPageContent;

preg_match('~data-s="(.*?)"~', $submitPageContent, $sdatamatch);
if (count($sdatamatch) == 0) {
    echo "could not find data-s\n";
}
preg_match("~'q' value='(.*?)'~", $submitPageContent, $qmatch);
if (count($qmatch) == 0) {
    echo "could not find q\n";
}

echo "data-s: ".$sdatamatch[1]."\n";
echo "q: ".$qmatch[1]."\n\n";


$createTaskResponse = request("https://api.anti-captcha.com/createTask",
                              NULL,
                              [
                                  "clientKey"   =>  $anticaptchaKey,
                                  "task"        =>  [
                                      "type"                =>  "NoCaptchaTaskProxyless",
                                      "websiteURL"          =>  $redirect,
                                      "websiteKey"          =>  "6LfwuyUTAAAAAOAmoS0fdqijC2PbbdH4kjq62Y1b",
                                      "recaptchaDataSValue" =>  $sdatamatch[1]
                                  ]
                              ],
                              NULL,
                              NULL,
                              NULL,
                              false);

$createTaskResponseDecoded  =   json_decode($createTaskResponse, true);
if ($createTaskResponseDecoded["errorId"] > 0) {
    echo "could not create task\n";
    print_r($createTaskResponseDecoded);
    exit;
}

$taskId = $createTaskResponseDecoded["taskId"];
echo "Anti-Captcha task ID: $taskId, solving...\n";

sleep(10);
while (true) {
    echo "requesting task status ... ";
    $checkTaskResponse = request("https://api.anti-captcha.com/getTaskResult",
                              NULL,
                              [
                                  "clientKey"   =>  $anticaptchaKey,
                                  "taskId"      =>  $taskId
                              ],
                              NULL,
                              NULL,
                              NULL,
                              false);
    $checkTaskResponseDecoded  =   json_decode($checkTaskResponse, true);
    if ($checkTaskResponseDecoded["errorId"] > 0) {
        echo "could not finish task\n";
        print_r($checkTaskResponseDecoded);
        exit;
    }
    if ($checkTaskResponseDecoded["status"] == "ready") {
        echo "recaptcha solved\n";
        break;
    }
    echo "not yet solved\n";
    sleep(1);
}
echo "getTaskResult output:\n";
print_r($checkTaskResponseDecoded);
$gresponse = $checkTaskResponseDecoded["solution"]["gRecaptchaResponse"];
$cookies   = $checkTaskResponseDecoded["solution"]["cookies"];

echo "\ng-response: $gresponse\n";
echo "cookies: ".count($cookies)." records\n";

echo "adding cookie to file $cookiefile .. \n";
$fp = fopen($cookiefile, "a");
foreach ($cookies as $name => $value) {
    fputs($fp, ".google.com	TRUE	/	TRUE	" . (time() + (3600 * 100500)) . "	$name	$value\n");
}
fclose($fp);


echo "\nsubmitting form with g-response, continue, q, cookies, blackjack and strippers ...\n";

$postdata = "q=".urlencode($qmatch[1])."&g-recaptcha-response=".urlencode($gresponse)."&continue=".urlencode($serpAddress);

$submitResponse = request("https://www.google.com/sorry/index",
                          $postdata,
                          NULL,
                          $cookiefile,
                          $failingProxy,
                          NULL,
                          true);

preg_match('~ocation: (.*?)\n~', $submitResponse, $output);
if (count($output) == 0) {
    echo "no redirected detected, something went wrong\n";
    exit;
}
$redirect = trim($output[1]);
echo "redirected to $redirect\n";
if (strpos($redirect, "https://www.google.com/search") !== false) {
    echo "\nconcept proved, have fun!\n";
} else {
    echo "\nredirected to unexpected location :(\n";
}


function request($url,
                 $postdata = NULL,
                 $jsonPOSTData = NULL,
                 $cookieFile = NULL,
                 $proxy = NULL,
                 $proxyAuth = NULL,
                 $returnHeaders = false) {
    
    $additionalHeaders = [
        "Accept-Encoding: gzip, deflate, br",
        "Accept-Language: en-US,en;q=0.5",
        "Accept: text/html,application/xhtml+xml;q=0.9,image/webp,*/*;q=0.8",
        "Upgrade-Insecure-Requests: 1"
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_ENCODING, "gzip, deflate, br");
    curl_setopt($ch, CURLOPT_HTTPHEADER, $additionalHeaders);
    curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:72.0) Gecko/20100101 Firefox/72.0");
    curl_setopt($ch, CURLOPT_REFERER, $url);
    if ($postdata !== NULL)
    {
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
    }
    if ($jsonPOSTData != NULL) {
        $jsonPOSTData = json_encode($jsonPOSTData);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPOSTData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($additionalHeaders,array(
            'Content-Type: application/json; charset=utf-8',
            'Accept: application/json',
            'Content-Length: ' . strlen($jsonPOSTData)
        )));
    }
    if ($proxy != NULL) {
        curl_setopt($ch, CURLOPT_PROXY, $proxy);
        if ($proxyAuth != NULL) {
            curl_setopt($ch, CURLOPT_PROXYUSERPWD, $proxyAuth);
        }
    }
    
    if ($returnHeaders == true) curl_setopt($ch, CURLOPT_HEADER, 1);
    else curl_setopt($ch, CURLOPT_HEADER, 0);
    
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    
    if ($cookieFile != NULL) {
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
    }
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    if (curl_error($ch) != "") {
        echo "CURL error: ".curl_error($ch)."\n";
        exit;
    }
    return curl_exec($ch);
}