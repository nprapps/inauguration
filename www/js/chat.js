/*
 * A jQuery-ized Scribble Live plugin.
 *
 * Depends on jQuery, Underscore, auth.js,
 * chat.less and the JST chat templates.
 */

(function($) {
    $.fn.livechat = function(options) {
        // Immutable configuration
        var USER_URL = 'apiv1.scribblelive.com/user';
        var NPR_AUTH_URL = 'https://api.npr.org/infinite/v1.0/login/';
        var JANRAIN_INFO_URL = 'https://rpxnow.com/api/v2/auth_info';
        var OAUTH_KEY = 'oauthKey0';
        var SCRIBBLE_AUTH_KEY = 'testAuth4';
        var SCRIBBLE_AUTH_EXPIRATION = 118;

        // Settings
        var defaults = {
            chat_id: null,
            chat_token: null,
            update_interval: 10000,
            alert_interval: 500,
            read_only: false
        };

        var plugin = this;

        // Update options
        options = options || {};
        plugin.settings = $.extend({}, defaults, options);

        chat_url = 'http://apiv1.scribblelive.com/event/'+ plugin.settings.chat_id +'/all/?Token='+ plugin.settings.chat_token +'&format=json';

        // Render
        var $live_chat = this;
        $live_chat.html(JST.chat());

        // Cache element references
        var $chat_title = $live_chat.find('.chat-title');
        var $chat_blurb = $live_chat.find('.chat-blurb');
        var $chat_body = $live_chat.find('.chat-body');
        var $alerts = $live_chat.find('.chat-alerts');

        var $editor = $live_chat.find('.chat-editor');
        var $comment = $editor.find('.chat-content');
        var $comment_button = $editor.find('.chat-post');
        var $logout = $editor.find('.chat-logout');
        var $clear = $editor.find('.chat-clear');

        var $login = $live_chat.find('.chat-login');
        var $anonymous = $login.find('button.anon');
        var $oauth = $login.find('button.oauth');
        var $npr = $login.find('button.npr');

        var $anonymous_login_form = $live_chat.find('.chat-anonymous-login');
        var $anonymous_username = $anonymous_login_form.find('.chat-anonymous-username');
        var $anonymous_login_button = $anonymous_login_form.find('button');

        var $npr_login_form = $live_chat.find('.chat-npr-login');
        var $npr_username = $npr_login_form.find('.chat-npr-username');
        var $npr_password = $npr_login_form.find('.chat-npr-password');
        var $npr_login_button = $npr_login_form.find('button');

        // State
        var post_ids = [];
        var delete_ids = [];
        var edit_ids = [];
        var edit_timestamps = {};
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

        function _send_comment(data) {
            /*
             * Handles comment ajax.
             */
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

        function post_comment(data) {
            /*
            * If auth is good, post comment now. Otherwise, reauthenticate and then post comment.
            */
            if (validate_scribble_auth() === true) {
                _send_comment(data);
            } else {
                scribble_auth_user({
                    auth_route: 'anonymous',
                    username: $.totalStorage(SCRIBBLE_AUTH_KEY).Name })
                .then(_send_comment(data));
            }
        }

        function update_alerts() {
            _.each(alerts, function(alert, index, list) {
                alerts.splice(alert);
                alert_html = JST.alert({ alert: alert });
                $alerts.append(alert_html);
            });
        }

        function render_post(post) {
            /*
            * Called once for each post.
            * Renders appropriate template for this post type.
            */

            // Decide if this post belongs to the logged-in user.
            post.Highlight = '';
            if ($.totalStorage(SCRIBBLE_AUTH_KEY)) {
                if ($.totalStorage(SCRIBBLE_AUTH_KEY).Id) {
                    if (post.Creator.Id === $.totalStorage(SCRIBBLE_AUTH_KEY).Id) {
                        post.Highlight = ' highlighted';
                    }
                }
            }

            post.CreatedJSON = parseInt(moment(post.Created).valueOf());
            post.Created = moment(post.Created).format('dddd, MMMM Do YYYY, h:mm:ss a');

            if (post.Type == "TEXT") {
                return JST.chat_text(post);
            } else if (post.Type == "IMAGE") {
                return JST.chat_image(post);
            } else {
                throw 'Unsupported post type.';
            }
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

                    var scroll_down = false;
                    var new_posts = [];

                    // Handle normal posts
                    _.each(data.Posts, function(post) {
                        // Filter posts we've seen before
                        if (_.contains(post_ids, post.Id)) {
                            return;
                        }

                        try {
                            post.html = render_post(post);
                        } catch(err) {
                            return;
                        }

                        new_posts.push(post);
                        post_ids.push(post.Id);
                    });

                    if (new_posts.length > 0) {
                        new_posts = _.sortBy(new_posts, 'CreatedJSON');
                        $chat_body.append(_.pluck(new_posts, 'html'));

                        scroll_down = true;
                    }

                    // Handle post deletes
                    _.each(data.Deletes, function(post) {
                        if (_.contains(delete_ids, post.Id)) {
                            return;
                        }

                        delete_ids.push(post.Id);

                        $chat_body.find('.chat-post[data-id="' + post.Id + '"]').remove();
                    });

                    // Handle post edits
                    _.each(data.Edits, function(post) {
                        var timestamp = parseInt(moment(post.LastModified).valueOf());

                        if (_.contains(edit_ids, post.Id)) {
                            if (edit_timestamps[post.Id] >= timestamp) {
                                return;
                            }
                        } else {
                            edit_ids.push(post.Id);
                        }

                        edit_timestamps[post.Id] = timestamp;

                        post.html = render_post(post);

                        var $existing = $chat_body.find('.chat-post[data-id="' + post.Id + '"]');

                        // Updating a post already displayed
                        if ($existing.length > 0) {
                            $existing.replaceWith(post.html);
                        // Updating a post never seen before (e.g. on page load)
                        } else {
                            var $posts = $chat_body.find('.chat-post');
                            var $post = null;

                            var comes_before = _.find($posts, function(post_el, i) {
                                $post = $(post_el);

                                if (parseInt($post.data('timestamp')) > post.CreatedJSON) {
                                    $post.before(post.html);

                                    return true;
                                }

                                return false;
                            });

                            // If no place in the order, put at the end
                            if (!comes_before) {
                                $post.after(post.html);
                            }
                        }
                    });

                    if (scroll_down) {
                        $chat_body.scrollTop($chat_body[0].scrollHeight);
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

        function validate_scribble_auth() {
            /*
            * Compares timestamps to validate a Scribble auth token.
            */
            if ($.totalStorage(SCRIBBLE_AUTH_KEY)) {
                if ($.totalStorage(SCRIBBLE_AUTH_KEY).Expires) {
                    if ( $.totalStorage(SCRIBBLE_AUTH_KEY).Expires < moment() ) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
        }

        function toggle_user_context(auth, reauthenticate) {
            /*
             * Show auth if not logged in, hide auth if logged in.
             * If reauthenticate is true, get new credentials from Scribble.
             */
            var visible = (auth !== undefined && auth !== null);

            if (visible) {
                $editor.find('h4 span').text(auth.Name);
                if (reauthenticate === true) {
                    if (validate_scribble_auth() === false) {
                        scribble_auth_user({ auth_route: 'anonymous', username: $.totalStorage(SCRIBBLE_AUTH_KEY).Name });
                    }
                }
            }

            $login.toggle(!visible);
            $editor.toggle(visible);
       }

        function scribble_auth_user(data) {
            /*
             * Login to Scribble with username we got from [Facebook|Google|NPR|etc].
             */
            var auth_url = 'http://'+ USER_URL +'/create?Token='+ plugin.settings.chat_token;

            if ((data.auth_route === 'anonymous' && data.username !== '') || (data.auth_route === 'oauth')) {
                return $.ajax({
                    url: auth_url +'&format=json&Name='+ data.username +'&Avatar='+ data.avatar,
                    dataType: 'jsonp',
                    cache: false,
                    success: function(auth) {
                        auth.Expires = moment().add('minutes', SCRIBBLE_AUTH_EXPIRATION).valueOf();
                        $.totalStorage(SCRIBBLE_AUTH_KEY, auth);
                        clear_fields();
                        toggle_user_context($.totalStorage(SCRIBBLE_AUTH_KEY), false);
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
                    toggle_user_context(OAUTH_KEY, true);
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
                toggle_user_context(OAUTH_KEY, true);
            }
        }

        // Event handlers
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
        if (!plugin.settings.read_only) {
            toggle_user_context($.totalStorage(SCRIBBLE_AUTH_KEY), false);
        }

        update_live_chat();
        setInterval(update_live_chat, plugin.settings.update_interval);
        setInterval(update_alerts, plugin.settings.alert_interval);

        return this;
    };
}(jQuery));
