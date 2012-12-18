$(document).ready(function(){

    // Things from the DOM, cached for easy access.
    var $liveChat = $('#live-chat');
    var $chatTitle = $('#live-chat-title');
    var $chatBlurb = $('#live-chat-blurb');
    var $chatUsername = $('#live-chat-form h4 span');
    var $anon = $('#live-chat-anonymous');
    var $commentBtn = $('#live-chat-button');
    var $comment = $('#live-chat-content');
    var $username = $('#live-chat-username');
    var $alert = $('#live-chat-alerts');
    var $logout = $('#live-chat-logout');
    var $login = $('#live-chat-login');
    var $clear = $('#live-chat-clear');

    var CHAT_ID = $liveChat.attr('data-scribblelive-chat-id');
    var CHAT_TOKEN = $liveChat.attr('data-scribblelive-chat-token');

    // Constants.
    var POLLING_INTERVAL = 1000;
    var AUTH_KEY = 'testAuth4';

    // URLs.
    var BASE_URL = 'http://apiv1.scribblelive.com/event/'+ CHAT_ID +'/all/?Token='+ CHAT_TOKEN +'&format=json';
    var USER_URL = 'apiv1.scribblelive.com/user';

    // Arrays.
    var old_posts = [];
    var alerts = [];

    function clear_html() {
        $username.val('');
        $comment.val('');
        $anon.prop('checked', false);
    }

    function logout_user() {
        $.totalStorage(AUTH_KEY, null);
        clear_html();
        initialize_user();
    }

    function initialize_user() {
        var auth = $.totalStorage(AUTH_KEY);
        if (auth === null) {
            $('.login').show();
            $('.logout').hide();
            $chatUsername.empty().text('!');
        }
        else {
            $('.logout').show();
            $('.login').hide();
            $chatUsername.empty().text(', ' + auth.Name + '.');
        }
    }

    function post_comment(data) {
        var auth = $.totalStorage(AUTH_KEY);
        var content_param = '&Content=' + data.content;
        var auth_param = '&Auth=' + auth.Auth;
        $.ajax({
            url: BASE_URL + content_param + auth_param,
            dataType: 'jsonp',
            cache: false,
            success: function(response) {
                $comment.val('');
                if (response.Code === 202) {
                    alerts.push({
                        klass: 'alert-info',
                        title: 'Awaiting moderation!',
                        text: 'Your comment is awaiting moderation.<br/>You said, "'+ data.content +'"'
                    });
                }
            }
        });
    }

    function auth_handler(url) {
        $.ajax({
            url: url,
            dataType: 'jsonp',
            cache: false,
            success: function(auth) {
                $.totalStorage(AUTH_KEY, auth);
                initialize_user();
            }
        });
    }

    function auth_user(data) {
        if (data.anonymous === true && data.username !== '') {
            auth_handler('http://'+ USER_URL +'/create?Token='+ CHAT_TOKEN +'&format=json&Name='+ data.username);
        }
        else {
            alert('Missing something. Try filling out the form again.');
        }
    }

    function update_alerts() {
        _.each(alerts, function(alert, index, list) {
            alerts.splice(alert);
            alert_html = JST.alert({ alert: alert });
            $alert.append(alert_html);
        });
    }

    function update_live_chat() {
        $.ajax({
            url: BASE_URL + '&Max=10000&Order=desc',
            dataType: 'jsonp',
            cache: false,
            success: function(data) {
                if (old_posts.length === 0) {
                    $chatTitle.text(data.Title);
                    $chatBlurb.text(data.Description);
                }
                var new_posts = [];

                _.each(data.Posts, function(post, index, list){
                    post.CreatedJSON = parseInt(moment(post.Created).valueOf(), 10);
                    post.Created = moment(post.Created).format('dddd, MMMM Do YYYY, h:mm:ss a');
                    new_posts.push(JST.chat_post({
                        post: post
                    }));
                });

                var posts = _.difference(new_posts, old_posts);

                if (posts.length > 0) {
                    posts.sort();
                    $liveChat.append(posts);
                    old_posts = old_posts.concat(posts);
                    old_posts.sort();
                }
            }
        });
    }

    // EVENT HANDLERS ON THE PAGE.
    $logout.on('click', function() {
        logout_user();
    });
    $login.on('click', function(){
        auth_user({ anonymous: true, username: $username.val() });
    });
    $clear.on('click', function() {
        clear_html();
    });
    $commentBtn.on('click', function() {
        post_comment({ content: $comment.val() });
    });

    // Initialize the user and the chat data.
    initialize_user();
    update_live_chat();
    setInterval(update_live_chat, POLLING_INTERVAL);
    setInterval(update_alerts, 500);
});
