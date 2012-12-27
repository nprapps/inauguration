(function($) {
    // Immutable configuration
    var USER_URL = 'apiv1.scribblelive.com/user';
    var NPR_AUTH_URL = 'https://api.npr.org/infinite/v1.0/login/';
    var JANRAIN_INFO_URL = 'https://rpxnow.com/api/v2/auth_info';
    var OAUTH_KEY = 'oauthKey0';
    var SCRIBBLE_AUTH_KEY = 'testAuth4';

    // Settings
    var settings = {
        chat_id: null,
        chat_token: null,
        update_interval: 10000,
        alert_interval: 500,
        read_only: false
    };

    // Imputed configuration
    var chat_url = null;

    // Element references
    var $live_chat = null;
    var $chat_title = null;
    var $chat_blurb = null;
    var $chat_body = null;
    var $alerts = null;

    var $editor = null;
    var $comment = null;
    var $comment_button = null;
    var $logout = null;
    var $clear = null;

    var $login = null;
    var $anonymous = null;
    var $oauth = null;
    var $npr = null;

    var $anonymous_login_form = null;
    var $anonymous_username = null;
    var $anonymous_login_button = null;

    var $npr_login_form = null;
    var $npr_username = null;
    var $npr_password = null;
    var $npr_login_button = null;

    // State
    var post_ids = [];
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
            url: chat_url + content_param + auth_param,
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
        /*
         * Fetch latest posts and render them.
         */
        $.ajax({
            url: chat_url + '&Max=10000&Order=desc',
            dataType: 'jsonp',
            cache: false,
            success: function(data) {
                if (post_ids.length === 0) {
                    $chat_title.text(data.Title);
                    $chat_blurb.text(data.Description);
                }

                var new_posts = [];

                _.each(data.Posts, function(post, index, list) {
                    // Filter posts we've seen before
                    if (_.contains(post_ids, post.Id)) {
                        return;
                    }

                    post.CreatedJSON = parseInt(moment(post.Created).valueOf());
                    post.Created = moment(post.Created).format('dddd, MMMM Do YYYY, h:mm:ss a');

                    if (post.Type == "TEXT") {
                        post.html = JST.chat_text(post);
                    } else if (post.Type == "POLL") {
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
                        
                        post.html = JST.chat_poll(post);
                    } else if (post.Type == "IMAGE") {
                        /*{
                        Media: [
                                {
                                    Type: "IMAGE",
                                    Url: "http://foo.biz/foo.png",
                                }
                            ]
                        }*/

                        post.image_urls = [];

                        _.each(post.Media, function(media) {
                            post.image_urls.push(media.Url);
                        });

                        post.html = JST.chat_image(post);;
                    }

                    new_posts.push(post);
                    post_ids.push(post.Id);
                });

                if (new_posts.length > 0) {
                    new_posts = _.sortBy(new_posts, 'Id').reverse(); 
                    $chat_body.append(_.pluck(new_posts, 'html'));
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
        var auth_url = 'http://'+ USER_URL +'/create?Token='+ settings.chat_token;

        if ((data.auth_route === 'anonymous' && data.username !== '') || (data.auth_route === 'oauth')) {
            $.ajax({
                url: auth_url +'&format=json&Name='+ data.username +'&Avatar='+ data.avatar,
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

    function npr_auth_user() {
        /*
        * From email with John Nelson:
        *   url:
        *        api.npr.org/infinite/v1.0/login/
        *    parameters:
        *        auth - Base64 encoded json string {username:'',password:'',remember:'',temp_user:''}
        *            I believe you will only need the username/password fields.
        *            The other 2 can be passed in null.
        *        platform - Hardcode this to CRMAPP for now.
        */
        var payload = { username: $npr_username.val(), password: $npr_password.val(), remember: null, temp_user: null };
        var b64_payload = window.btoa(JSON.stringify(payload));

        $.ajax({
            url: NPR_AUTH_URL,
            dataType: 'jsonp',
            type: 'POST',
            crossDomain: true,
            cache: false,
            data: { auth: b64_payload, platform: 'CRMAPP' },
            success: function(response) {
                $.totalStorage(OAUTH_KEY, response.user_data);
                scribble_auth_user({ auth_route: 'anonymous', username: response.user_data.nick_name });
                toggle_user_context(OAUTH_KEY);
            }
        });
    }

    function oauth_callback(response) {
        /*
         * Authenticate and intialize user.
         */
        if (response.status === 'success') {
            $.totalStorage(OAUTH_KEY, response.user_data);
            scribble_auth_user({ auth_route: 'anonymous', username: response.user_data.nick_name });
            toggle_user_context(OAUTH_KEY);
        }

    }

    $.fn.livechat = function(options) {
        options = options || {};

        $.each(options, function(k, v) {
            settings[k] = options[k] || settings[k];
        });

        chat_url = 'http://apiv1.scribblelive.com/event/'+ settings.chat_id +'/all/?Token='+ settings.chat_token +'&format=json';

        $live_chat = this;
        $chat_title = this.find('#live-chat-title');
        $chat_blurb = this.find('#live-chat-blurb');
        $chat_body = this.find('#live-chat-body');
        $alerts = this.find('#live-chat-alerts');

        $editor = this.find('#live-chat-editor');
        $comment = this.find('#live-chat-content');
        $comment_button = this.find('#live-chat-button');
        $logout = this.find('#live-chat-logout');
        $clear = this.find('#live-chat-clear');

        $login = this.find('#live-chat-login');
        $anonymous = this.find('button.anon');
        $oauth = this.find('button.oauth');
        $npr = this.find('button.npr');

        $anonymous_login_form = this.find('#live-chat-anonymous-login');
        $anonymous_username = this.find('#live-chat-anonymous-username');
        $anonymous_login_button = this.find('#live-chat-anonymous-login-button');

        $npr_login_form = this.find('#live-chat-npr-login');
        $npr_username = this.find('#live-chat-npr-username');
        $npr_password = this.find('#live-chat-npr-password');
        $npr_login_button = this.find('#live-chat-npr-login-button');


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

		$npr_login_button.on('click', function() {
			npr_auth_user();
		});

        $clear.on('click', function() {
            clear_fields();
        });

        $comment_button.on('click', function() {
            post_comment({ content: $comment.val() });
        });

        // Initialize the user and the chat data.
        if (!options.read_only) {
            toggle_user_context($.totalStorage(SCRIBBLE_AUTH_KEY));
        }

        update_live_chat();
        setInterval(update_live_chat, options.update_interval);
        setInterval(update_alerts, options.alert_interval);

        return this;
    };
}(jQuery));
