const nginxExample = `location ^~ /overseerr {
    set $app 'overseerr';

    # Remove /overseerr path to pass to the app
    rewrite ^/overseerr/?(.*)$ /$1 break;
    proxy_pass http://127.0.0.1:5055; # NO TRAILING SLASH

    # Redirect location headers
    proxy_redirect ^ /$app;
    proxy_redirect /setup /$app/setup;
    proxy_redirect /login /$app/login;

    # Sub filters to replace hardcoded paths
    proxy_set_header Accept-Encoding "";
    sub_filter_once off;
    sub_filter_types *;

    # HREF
    sub_filter 'href="/"' 'href="/$app/"';
    sub_filter 'href="/login"' 'href="/$app/login"';
    sub_filter 'href:"/"' 'href:"/$app/"';

    ## Capture some things which shouldn't change
    sub_filter '.id,"/' '.id,"/';
    sub_filter '"/settings/main' '"/settings/main';
    sub_filter '"/settings/password' '"/settings/password';
    sub_filter '"/settings/permissions' '"/settings/permissions';
    sub_filter '"/settings/notifications/email' '"/settings/notifications/email';
    sub_filter 'webPushEnabled?"/settings/notifications/webpush"' 'webPushEnabled?"/settings/notifications/webpush"';
    sub_filter '"/settings/notifications/webpush' '"/$app/settings/notifications/webpush';
    sub_filter '"/settings/notifications/pushbullet' '"/$app/settings/notifications/pushbullet';
    sub_filter '"/settings/notifications/pushover' '"/$app/settings/notifications/pushover';
    sub_filter '"/settings/notifications' '"/settings/notifications';
    ## Now the remaining settings paths are ok to change
    sub_filter '"/settings' '"/$app/settings';

    ## Default filters:
    sub_filter '\\/_next' '\\/$app\\/_next';
    sub_filter '/_next' '/$app/_next';
    sub_filter '/api/v1' '/$app/api/v1';
    sub_filter '/login/plex/loading' '/$app/login/plex/loading';
    sub_filter '/images/' '/$app/images/';

    ## Route-specific filters:
    sub_filter '"/sw.js"' '"/$app/sw.js"';
    sub_filter '"/offline.html' '"/$app/offline.html';
    sub_filter '"/android-' '"/$app/android-';
    sub_filter '"/apple-' '"/$app/apple-';
    sub_filter '"/favicon' '"/$app/favicon';
    sub_filter '"/logo_' '"/$app/logo_';
    sub_filter '"/profile' '"/$app/profile';
    sub_filter '"/users' '"/$app/users';
    sub_filter '"/movie' '"/$app/movie';
    sub_filter '"/tv' '"/$app/tv';
    sub_filter '/imageproxy' '/$app/imageproxy';
    ### These are needed for request management
    sub_filter '="/".concat' '="/$app/".concat';

    # Fix WebPush action URL:
    sub_filter 'actionUrl: payload' 'actionUrl: \\'/$app\\' + payload';

    sub_filter '"/person' '"/$app/person';
    sub_filter '"/collection' '"/$app/collection';
    sub_filter '"/discover' '"/$app/discover';
    sub_filter '"/requests' '"/$app/requests';
    sub_filter '"/issues' '"/$app/issues';

    # For routes in /profile
    sub_filter 'route:"/settings/password' 'route:"/settings/password';
    sub_filter 'regex:/^\\/settings\\/password' 'regex:/^\\/settings\\/password';
    sub_filter 'route:"/settings/permissions' 'route:"/settings/permissions';
    sub_filter 'regex:/^\\/settings\\/permissions' 'regex:/^\\/settings\\/permissions';
    sub_filter 'route:"/settings/main",regex:/\\/settings(\\/main)?' 'route:"/settings/main",regex:/\\/settings(\\/main)?';
    sub_filter 'route:"/settings/notifications/email",regex:/\\/settings\\/notifications\\/email/,' 'route:"/settings/notifications/email",regex:/\\/settings\\/notifications\\/email/,';
    sub_filter 'route:"/settings/notifications/webpush",regex:/\\/settings\\/notifications\\/webpush/,' 'route:"/settings/notifications/webpush",regex:/\\/settings\\/notifications\\/webpush/,';
    sub_filter 'route:"/settings/notifications/discord",regex:/\\/settings\\/notifications\\/discord/,' 'route:"/settings/notifications/discord",regex:/\\/settings\\/notifications\\/discord/,';
    sub_filter 'route:"/settings/notifications/pushbullet",regex:/\\/settings\\/notifications\\/pushbullet/}' 'route:"/settings/notifications/pushbullet",regex:/\\/settings\\/notifications\\/pushbullet/}';
    sub_filter 'route:"/settings/notifications/pushover",regex:/\\/settings\\/notifications\\/pushover/}' 'route:"/settings/notifications/pushover",regex:/\\/settings\\/notifications\\/pushover/}';
    sub_filter 'route:"/settings/notifications' 'route:"/$app/settings/notifications';
    sub_filter 'regex:/^\\/settings\\/notifications' 'regex:/^\\/$app\\/settings\\/notifications';

    # Generic route and regex replace
    sub_filter 'route:"/' 'route:"/$app/';
    sub_filter 'regex:/^\\/' 'regex:/^\\/$app\\/';
    sub_filter 'regex:/\\/' 'regex:/\\/$app\\/';
}`;

export default nginxExample;
