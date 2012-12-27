$(document).ready(function(){
    // Things from the DOM, cached for easy access.
    var $liveChat = $('#live-chat');
    var $chatTitle = $('#live-chat-title');
    var $chatBlurb = $('#live-chat-blurb');
    var $anon = $('#live-chat-anonymous');
    var $commentBtn = $('#live-chat-button');
    var $comment = $('#live-chat-content');
    var $alert = $('#live-chat-alerts');
    var $logout = $('#live-chat-logout');
    var $clear = $('#live-chat-clear');
    var $anonymous = $('button.anon');
    var $anonymous_login = $('#live-chat-anonymous-login');
    var $anonymous_username = $('#live-chat-anonymous-username');
    var $oauth = $('button.oauth');
    var $npr = $('button.npr');
    var $npr_login = $('#live-chat-npr-login');
    var $npr_username = $('#live-chat-npr-username');
    var $npr_password = $('#live-chat-npr-password');

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
        $anonymous_username.val('');
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
                    posts.sort().reverse();
                    $liveChat.append(posts);
                    old_posts = old_posts.concat(posts);
                    old_posts.sort();
                }
            }
        });
    }

    function npr_path(direction) {
        if (direction === 'on') {
            $('label.npr').show();
            $npr_login.show();
            $npr.addClass('disabled');
        }
        if (direction === 'off') {
            $('label.npr').hide();
            $npr_login.hide();
            $npr.removeClass('disabled');
        }
    }

    function anonymous_path(direction) {
        if (direction === 'on') {
            $('label.anon').show();
            $anonymous_login.show();
            $anonymous.addClass('disabled');
        }
        if (direction === 'off') {
            $('label.anon').hide();
            $anonymous_login.hide();
            $anonymous.removeClass('disabled');
        }
    }

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

    function oauth_callback(response) {
        /*
         * Authenticate and intialize user.
         */
        if (response.status === 'success') {
            response.user_data.Name = response.user_data.nick_name;
            $.totalStorage(window.SCRIBBLE.janrain_auth_key, response.user_data);
            livechatAuthUser({ auth_route: 'anonymous', username: response.user_data.nick_name });
            livechatInitUser(window.SCRIBBLE.janrain_auth_key);
        }
 
    }

    // EVENT HANDLERS ON THE PAGE.
    $oauth.on('click',function() {
        NPR_AUTH.login($(this).attr('data-service'), oauth_callback);
        anonymous_path('off');
        npr_path('off');
    });
    $anonymous.on('click', function(){
        anonymous_path('on');
        npr_path('off');
    });
    $npr.on('click', function(){
        anonymous_path('off');
        npr_path('on');
    });
    $logout.on('click', function() {
        logout_user();
        anonymous_path('off');
        npr_path('off');
    });
    $anonymous_login.on('click', function(){
        livechatAuthUser({ auth_route: 'anonymous', username: $anonymous_username.val() });
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


