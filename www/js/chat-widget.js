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
            update_interval: 1000
        };
        
        var plugin = this;
        plugin.settings = {};
        plugin.$root = $(element);

        var update_timer = null;

        plugin.init = function () {
            /*
            * Initializes the live chat widget.
            */
            plugin.$root.html(JST.widget());

            plugin.settings = $.extend({}, defaults, options || {});
            plugin.update_live_chat();
            plugin.pause(false);
        };

        plugin.pause = function(paused) {
            if (paused) {
                clearInterval(plugin.update_timer);
            } else {
                plugin.update_timer = setInterval(plugin.update_live_chat, plugin.settings.update_interval);
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
                url: 'http://'+plugin.settings.scribble_host+'/event/'+plugin.settings.chat_id+'/page/0?format=json&Token='+plugin.settings.chat_token+'&Type=TEXT',
                dataType: 'jsonp',
                cache: false,
                success: function(response) {
                    var posts = [];
                    _.each(response.Posts, function(post){
                        if (post.Type === 'TEXT') {
                            posts.push(post);
                        }
                    });
                    plugin.render_post(posts);
                }
            });
        };

        plugin.render_post = function(posts) {
            /*
            * Renders the newest post and writes it to
            * the appropriate element on the page.
            */
            var post = posts[0];
            var template = JST.widget_text({ post:post });
            plugin.$root.find('p').html(template);
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
