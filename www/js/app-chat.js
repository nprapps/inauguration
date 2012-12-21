$(document).ready(function(){
    function e() {
        janrain.ready = true;
    }
    if (typeof window.janrain !== "object") window.janrain = {};
    if (typeof window.janrain.settings !== "object") window.janrain.settings = {};

    janrain.settings = {};
    janrain.settings.tokenAction = "event";
    janrain.settings.custom = true;
    janrain.settings.tokenUrl = "http://login.npr.org/";
    janrain.settings.appUrl = "https://login.npr.org/";
    janrain.settings.type = "embed";
    janrain.settings.appId = "odgehpicdimjmbgoofdi";
    janrain.settings.providers = ["facebook", "google", "yahoo"];
    if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", e, false);
    } else {
        window.attachEvent("onload", e);
    }
    var t = document.createElement("script");
    t.type = "text/javascript";
    t.id = "janrainAuthWidget";
    if (document.location.protocol === "https:") {
        t.src = "https://rpxnow.com/js/lib/login.npr.org/engage.js";
    } else {
        t.src = "http://widget-cdn.rpxnow.com/js/lib/login.npr.org/engage.js";
    }
    var n = document.getElementsByTagName("script")[0];
    n.parentNode.insertBefore(t, n);

    // Things from the DOM, cached for easy access.
    var $liveChat = $('#live-chat');
    var $chatTitle = $('#live-chat-title');
    var $chatBlurb = $('#live-chat-blurb');
    var $anon = $('#live-chat-anonymous');
    var $commentBtn = $('#live-chat-button');
    var $comment = $('#live-chat-content');
    var $username = $('#live-chat-username');
    var $alert = $('#live-chat-alerts');
    var $logout = $('#live-chat-logout');
    var $login = $('#live-chat-login');
    var $clear = $('#live-chat-clear');
    var $anonymous = $('button.anon');
    var $oauth = $('.oauth');

    // Get some stuff into the global context.
    if (typeof window.SCRIBBLE !== "object") window.SCRIBBLE = {};
    window.SCRIBBLE.chat_id = $liveChat.attr('data-scribblelive-chat-id');
    window.SCRIBBLE.chat_token = $liveChat.attr('data-scribblelive-chat-token');
    window.SCRIBBLE.base_url = 'http://apiv1.scribblelive.com/event/'+ window.SCRIBBLE.chat_id +'/all/?Token='+ window.SCRIBBLE.chat_token +'&format=json';
    window.SCRIBBLE.user_url = 'apiv1.scribblelive.com/user';
    window.SCRIBBLE.scribble_auth_key = 'testAuth4';
    window.SCRIBBLE.janrain_auth_key = 'janrainAuth0';

    // Arrays.
    var old_posts = [];
    var alerts = [];

    // Constants.
    var POLLING_INTERVAL = 10000;

    function clear_html() {
        $username.val('');
        $comment.val('');
        $anon.prop('checked', false);
    }

    function logout_user() {
        $.totalStorage(window.SCRIBBLE.scribble_auth_key, null);
        clear_html();
        livechatInitUser();
    }

    function post_comment(data) {
        var auth = $.totalStorage(window.SCRIBBLE.scribble_auth_key);
        var content_param = '&Content=' + data.content;
        var auth_param = '&Auth=' + auth.Auth;
        $.ajax({
            url: window.SCRIBBLE.base_url + content_param + auth_param,
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

    function update_alerts() {
        _.each(alerts, function(alert, index, list) {
            alerts.splice(alert);
            alert_html = JST.alert({ alert: alert });
            $alert.append(alert_html);
        });
    }

    function update_live_chat() {
        $.ajax({
            url: window.SCRIBBLE.base_url + '&Max=10000&Order=desc',
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
                    if (post.Type == "TEXT") {
                        new_posts.push(JST.chat_text({
                            post: post
                        }));
                    }
                    else if (post.Type == "POLL") {
                        /*{
                        Entities: {
                            Answers: [
                                {
                                    Id: 12345,
                                    Text: "Foo",
                                    Votes: 0
                                }
                            ],
                            Id: 12345,
                            Question: "Foo",
                            TotalVotes: 0,
                        }
                        }*/
                        post.poll_answers = '';
                        _.each(post.Entities.Answers, function(answer) {
                            post.poll_answers += '<label>'+ answer.Text +'<input name="poll-'+ post.Id +'" type="radio"></input></label>';
                        });
                        post.poll_question = post.Entities.Question;
                        new_posts.push(JST.chat_poll({
                            post: post
                        }));
                    }
                    else if (post.Type == "IMAGE") {
                        /*{
                        Media: [
                                {
                                    Type: "IMAGE",
                                    Url: "http://foo.biz/foo.png",
                                }
                            ]
                        }*/
                        _.each(post.Media, function(media) {
                            console.log('.');
                        });
                    }
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

    function anonymous_path(direction, button) {
        if (direction === 'on') {
            $('label.anon').show();
            $login.show();
            $anonymous.addClass('disabled');
        }
        if (direction === 'off') {
            $('label.anon').hide();
            $login.hide();
            $anonymous.removeClass('disabled');
        }
    }

    // EVENT HANDLERS ON THE PAGE.
    $anonymous.on('click', function(){
        anonymous_path('on');
    });
    $oauth.on('click',function() {
        janrain.engage.signin.triggerFlow($(this).attr('data-service'));
    });
    $logout.on('click', function() {
        logout_user();
        anonymous_path('off');
    });
    $login.on('click', function(){
        livechatAuthUser({ auth_route: 'anonymous', username: $username.val() });
    });
    $clear.on('click', function() {
        clear_html();
    });
    $commentBtn.on('click', function() {
        post_comment({ content: $comment.val() });
    });

    // Initialize the user and the chat data.
    livechatInitUser($.totalStorage(window.SCRIBBLE.scribble_auth_key));
    update_live_chat();
    setInterval(update_live_chat, POLLING_INTERVAL);
    setInterval(update_alerts, 500);
});

function livechatInitUser(auth) {
    if (auth === null) {
        $('.login').show();
        $('.logout').hide();
        $('#live-chat-form h4 span').empty().text('!');
    }
    else {
        $('.logout').show();
        $('.login').hide();
        $('#live-chat-form h4 span').empty().text(', ' + auth.Name + '.');
    }
}

function livechatAuthUser(data) {
    var auth_url = 'http://'+ window.SCRIBBLE.user_url +'/create?Token='+ window.SCRIBBLE.chat_token;
    if ((data.auth_route === 'anonymous' && data.username !== '') || (data.auth_route === 'oauth')) {
        $.ajax({
            url: auth_url +'&format=json&Name='+ data.username,
            dataType: 'jsonp',
            cache: false,
            success: function(auth) {
                console.log(auth);
                $.totalStorage(window.SCRIBBLE.scribble_auth_key, auth);
                livechatInitUser($.totalStorage(window.SCRIBBLE.scribble_auth_key));
            }
        });
    }
    else {
        alert('Missing something. Try filling out the form again.');
    }
}

function janrainWidgetOnload() {
    janrain.events.onProviderLoginToken.addHandler(function(response) {
        $.ajax({
            type: 'POST',
            url: 'https://api.npr.org/infinite/v1.0/janrain/',
            dataType: 'json',
            data: { token: response.token, temp_user: null },
            success: function(janrain_auth){
                if (janrain_auth.status === 'success') {
                    janrain_auth.user_data.Name = janrain_auth.user_data.nick_name;
                    $.totalStorage(window.SCRIBBLE.janrain_auth_key, janrain_auth.user_data);
                    livechatAuthUser({ auth_route: 'anonymous', username: janrain_auth.user_data.nick_name });
                    livechatInitUser(window.SCRIBBLE.janrain_auth_key);
                }
            }
        });
    });
}
