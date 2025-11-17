<?php

return [

    /*
     * You can enable or disable CORS for your API.
     */
    'enabled' => true,

    /*
     * The paths that should be allowed to use CORS.
     * You can use wildcards here, e.g. "api/*" or "app/*".
     */
    'paths' => ['api/*'],

    /*
     * The origins that are allowed to access the resource.
     * You can use "*" to allow all origins, or an array of specific origins.
     */
    'allowed_origins' => ['http://localhost:5173'], // Your React development server

    /*
     * The HTTP methods that are allowed.
     * You can use "*" to allow all methods, or an array of specific methods.
     */
    'allowed_methods' => ['*'], // Allow all methods (GET, POST, PUT, DELETE, OPTIONS, etc.)

    /*
     * The HTTP headers that are allowed.
     * You can use "*" to allow all headers, or an array of specific headers.
     */
    'allowed_headers' => ['*'], // Allow all headers

    /*
     * The maximum age for the preflight request, in seconds.
     * This is the time for which the preflight request's results can be cached.
     */
    'max_age' => 0,

    /*
     * Whether or not to send the Access-Control-Allow-Credentials header.
     * Set to true if you are handling cookies, HTTP authentication, or client-side SSL certificates.
     */
    'supports_credentials' => true,

];