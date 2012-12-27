$(document).ready(function(){
    var UPDATE_POLLING_INTERVAL = 10000;
    var ALERT_POLLING_INTERVAL = 500;
  
    var $live_chat = $('#live-chat');
    var $chat_title = $('#live-chat-title');
    var $chat_blurb = $('#live-chat-blurb');
    var $anon = $('#live-chat-anonymous');
    var $comment_button = $('#live-chat-button');
    var $comment = $('#live-chat-content');
    var $alerts = $('#live-chat-alerts');
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

    var chat_id = $live_chat.attr('data-scribblelive-chat-id');
    var chat_token = $live_chat.attr('data-scribblelive-chat-token');
    var base_url = 'http://apiv1.scribblelive.com/event/'+ chat_id +'/all/?Token='+ chat_token +'&format=json';
    var user_url = 'apiv1.scribblelive.com/user';
    var scribble_auth_key = 'testAuth4';
    var oauth_key = 'oauthKey0';

    // Arrays.
    var old_posts = [];
    var alerts = [];

    function clear_html() {
        $anonymous_username.val('');
        $comment.val('');
        $anon.prop('checked', false);
    }

    function logout_user() {
        $.totalStorage(scribble_auth_key, null);
        clear_html();
        toggle_user_context();
    }

    function post_comment(data) {
        var auth = $.totalStorage(scribble_auth_key);
        var content_param = '&Content=' + data.content;
        var auth_param = '&Auth=' + auth.Auth;

        $.ajax({
            url: base_url + content_param + auth_param,
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
            $alerts.append(alert_html);
        });
    }

    function update_live_chat() {
        $.ajax({
            url: base_url + '&Max=10000&Order=desc',
            dataType: 'jsonp',
            cache: false,
            success: function(data) {
                if (old_posts.length === 0) {
                    $chat_title.text(data.Title);
                    $chat_blurb.text(data.Description);
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
                    $live_chat.append(posts);
                    old_posts = old_posts.concat(posts);
                    old_posts.sort();
                }
            }
        });
    }

    function toggle_npr_login(visible) {
        /*
         * Toggle UI elements for NPR login.
         */
        $('label.npr').toggle(visible);
        $npr_login.toggle(visible);
        $npr.toggleClass('disabled', visible);
    }

    function toggle_anonymous_login(visible) {
        /*
         * Toggle UI elements for anonymous login.
         */
        $('label.anon').toggle(visible);
        $anonymous_login.toggle(visible);
        $anonymous.toggleClass('disabled', visible);
    }

    function toggle_user_context(auth) {
        /*
         * Show auth if not logged in, hide auth if logged in.
         */
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

    function scribble_auth_user(data) {
        /*
         * Login to Scribble live with username we got from [Facebook|Google|NPR|etc].
         */
        var auth_url = 'http://'+ user_url +'/create?Token='+ chat_token;

        if ((data.auth_route === 'anonymous' && data.username !== '') || (data.auth_route === 'oauth')) {
            $.ajax({
                url: auth_url +'&format=json&Name='+ data.username,
                dataType: 'jsonp',
                cache: false,
                success: function(auth) {
                    $.totalStorage(scribble_auth_key, auth);
                    toggle_user_context($.totalStorage(scribble_auth_key));
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
            $.totalStorage(oauth_key, response.user_data);
            scribble_auth_user({ auth_route: 'anonymous', username: response.user_data.nick_name });
            toggle_user_context(oauth_key);
        }
 
    }

    // EVENT HANDLERS ON THE PAGE.
    $oauth.on('click',function() {
        NPR_AUTH.login($(this).attr('data-service'), oauth_callback);
        toggle_anonymous_login(false);
        toggle_npr_login(false);
    });

    $anonymous.on('click', function(){
        toggle_anonymous_login(true);
        toggle_npr_login(false);
    });

    $npr.on('click', function(){
        toggle_anonymous_login(false);
        toggle_npr_login(true);
    });

    $logout.on('click', function() {
        logout_user();
        toggle_anonymous_login(false);
        toggle_npr_login(false);
    });

    $anonymous_login.on('click', function(){
        scribble_auth_user({ auth_route: 'anonymous', username: $anonymous_username.val() });
    });

    $clear.on('click', function() {
        clear_html();
    });

    $comment_button.on('click', function() {
        post_comment({ content: $comment.val() });
    });

    // Initialize the user and the chat data.
    toggle_user_context($.totalStorage(scribble_auth_key));
    update_live_chat();
    setInterval(update_live_chat, UPDATE_POLLING_INTERVAL);
    setInterval(update_alerts, ALERT_POLLING_INTERVAL);
});


