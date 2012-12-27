$(document).ready(function() {
    // Global configuration
    var CHAT_ID = '74796';
    var CHAT_TOKEN = 'FtP7wRfX';
    var CHAT_URL = 'http://apiv1.scribblelive.com/event/'+ CHAT_ID +'/all/?Token='+ CHAT_TOKEN +'&format=json';
    var USER_URL = 'apiv1.scribblelive.com/user';
    var SCRIBBLE_AUTH_KEY = 'testAuth4';
    var OAUTH_KEY = 'oauthKey0';
    var UPDATE_POLLING_INTERVAL = 10000;
    var ALERT_POLLING_INTERVAL = 500;
  
    // Element references
    var $live_chat = $('#live-chat');
    var $chat_title = $live_chat.find('#live-chat-title');
    var $chat_blurb = $live_chat.find('#live-chat-blurb');
    var $chat_body = $live_chat.find('#live-chat-body');
    var $alerts = $live_chat.find('#live-chat-alerts');
    
    var $editor = $live_chat.find('#live-chat-editor');
    var $comment = $live_chat.find('#live-chat-content');
    var $comment_button = $live_chat.find('#live-chat-button');
    var $logout = $live_chat.find('#live-chat-logout');
    var $clear = $live_chat.find('#live-chat-clear');

    var $login = $live_chat.find('#live-chat-login');
    var $anonymous = $live_chat.find('button.anon');
    var $oauth = $live_chat.find('button.oauth');
    var $npr = $live_chat.find('button.npr');

    var $anonymous_login_form = $live_chat.find('#live-chat-anonymous-login');
    var $anonymous_username = $live_chat.find('#live-chat-anonymous-username');
    var $anonymous_login_button = $live_chat.find('#live-chat-anonymous-login-button');
    
    var $npr_login_form = $live_chat.find('#live-chat-npr-login');
    var $npr_username = $live_chat.find('#live-chat-npr-username');
    var $npr_password = $live_chat.find('#live-chat-npr-password');
    var $npr_login_button = $live_chat.find('#live-chat-npr-login-button');

    // State
    var old_posts = [];
    var alerts = [];

    function clear_fields() {
        /*
         * Clear text entry fields.
         */
        $anonymous_username.val('');
        $npr_username.val('');
        $npr_password.val('');
        $comment.val('');
    }

    function logout_user() {
        $.totalStorage(SCRIBBLE_AUTH_KEY, null);
        clear_fields();
        toggle_user_context();
    }

    function post_comment(data) {
        var auth = $.totalStorage(SCRIBBLE_AUTH_KEY);
        var content_param = '&Content=' + data.content;
        var auth_param = '&Auth=' + auth.Auth;

        $.ajax({
            url: CHAT_URL + content_param + auth_param,
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
            url: CHAT_URL + '&Max=10000&Order=desc',
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
                    $chat_body.append(posts);
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
        $npr_login_form.toggle(visible);
        $npr.toggleClass('disabled', visible);
    }

    function toggle_anonymous_login(visible) {
        /*
         * Toggle UI elements for anonymous login.
         */
        $anonymous_login_form.toggle(visible);
        $anonymous.toggleClass('disabled', visible);
    }

    function toggle_user_context(auth) {
        /*
         * Show auth if not logged in, hide auth if logged in.
         */
        var visible = (auth !== undefined && auth !== null);

        if (visible) {
            $editor.find('h4 span').text(auth.Name);
        }
  
        $login.toggle(!visible);
        $editor.toggle(visible);
   }

    function scribble_auth_user(data) {
        /*
         * Login to Scribble live with username we got from [Facebook|Google|NPR|etc].
         */
        var auth_url = 'http://'+ USER_URL +'/create?Token='+ CHAT_TOKEN;

        if ((data.auth_route === 'anonymous' && data.username !== '') || (data.auth_route === 'oauth')) {
            $.ajax({
                url: auth_url +'&format=json&Name='+ data.username,
                dataType: 'jsonp',
                cache: false,
                success: function(auth) {
                    $.totalStorage(SCRIBBLE_AUTH_KEY, auth);
                    clear_fields();
                    toggle_user_context($.totalStorage(SCRIBBLE_AUTH_KEY));
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
            $.totalStorage(OAUTH_KEY, response.user_data);
            scribble_auth_user({ auth_route: 'anonymous', username: response.user_data.nick_name });
            toggle_user_context(OAUTH_KEY);
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

    $anonymous_login_button.on('click', function(){
        scribble_auth_user({ auth_route: 'anonymous', username: $anonymous_username.val() });
    });

    $clear.on('click', function() {
        clear_fields();
    });

    $comment_button.on('click', function() {
        post_comment({ content: $comment.val() });
    });

    // Initialize the user and the chat data.
    toggle_user_context($.totalStorage(SCRIBBLE_AUTH_KEY));
    update_live_chat();
    setInterval(update_live_chat, UPDATE_POLLING_INTERVAL);
    setInterval(update_alerts, ALERT_POLLING_INTERVAL);
});


