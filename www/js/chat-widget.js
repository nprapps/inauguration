/*
 * A jQuery-ized Scribble Live plugin.
 * Returns a read-only, single-post object.
 *
 * Depends on jQuery and Underscore.
 */

(function($) {
    $.livechatwidget = function(element, options) {
        /*
        * Contains the functions that write the live chat widget to the page.
        */

        // These will be overwritten in init() with the options passed by the page.
        var defaults = {
            scribble_host: 'apiv1.scribblelive.com',
            chat_id: null,
            chat_token: null,
            update_interval: 1000,
            max_text_length: 80 
        };
        
        var plugin = this;
        plugin.settings = {};
        plugin.$root = $(element);

        var chat_url = null;
        var update_timer = null;
        var last_post_timestamp = null;
        var paused = false;

        plugin.init = function () {
            /*
            * Initializes the live chat widget.
            */
            plugin.$root.html(JST.widget());

            plugin.settings = $.extend({}, defaults, options || {});

            chat_url = 'http://' + plugin.settings.scribble_host + '/event/' + plugin.settings.chat_id +'/all/?Token='+ plugin.settings.chat_token +'&format=json';

            plugin.$post = plugin.$root.find('p'); 

            plugin.update_live_chat();
        };

        plugin.pause = function(new_paused) {
            plugin.paused = new_paused;

            if (plugin.paused) {
                clearInterval(plugin.update_timer);
            } else {
                plugin.update_live_chat();
            }
        };

        plugin.update_live_chat = function() {
            /*
            * Fetches a new page of chat items from Scribble Live.
            * Excludes non-text post types.
            * Calls render_post().
            * Saves no state.
            */
            $.ajax({
                url: chat_url + '&Max=10&Order=desc',
                dataType: 'jsonp',
                cache: false,
                success: function(data) {
                    var posts_length = data.Posts.length;

                    for (i = 0; i < posts_length; i++) {
                        var post = data.Posts[i];

                        if (post.Type === 'TEXT') {
                            var m = moment(post.Created);
                            var timestamp = parseInt(m.valueOf(), 10);

                            if (last_post_timestamp && last_post_timestamp > timestamp) {
                                break;
                            }

                            plugin.render_post(post);

                            last_post_timestamp = timestamp;

                            break;
                        }
                    }
                }
            }).then(function() {
                if (!plugin.paused) {
                    plugin.update_timer = setTimeout(plugin.update_live_chat, plugin.settings.update_interval);
                }
            });
        };

        plugin.render_post = function(post) {
            /*
            * Renders the newest post and writes it to
            * the appropriate element on the page.
            */
            if (post.Content.length > plugin.settings.max_text_length) {
                post.Content = $.trim(post.Content.slice(0, plugin.settings.max_text_length)) + '&hellip;';
            }

            var template = JST.widget_text({ post: post });
            plugin.$post.html(template);
        };

        // Start it up.
        plugin.init();
    };

    $.fn.livechatwidget = function(options) {
        /*
        * Sets up the live chat widget function as a jQuery plugin.
        */
        return this.each(function() {
            if ($(this).data('livechatwidget') === undefined) {
                var plugin = new $.livechatwidget(this, options);
                $(this).data('livechatwidget', plugin);
            }
        });
    };
}(jQuery));
