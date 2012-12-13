$(document).ready(function() {
    var POLLING_INTERVAL = 120000;

    var posts_el = $("#backchannel .posts");
    var posts_html = {};

    function ISODateString(d) {
        function pad(n) {
            return n < 10 ? '0' + n : n
        }

        return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z'
    }

    function update_backchannel(first_run) {
        /*
         * Update the backchannel from our tumblr feed.
         */
        $.getJSON('backchannel.json?t=' + (new Date()).getTime(), {}, function(posts) {
            var posts_length = posts.length;
            var has_tweets = false;

            for (var i = 0; i < posts_length; i++) {
                var post = posts[i];
                var template = null;

                if (post.type === "photo") {
                    template = JST.backchannel_photo;
                } else if (post.type === "quote") {
                    template = JST.backchannel_quote;
                } else if (post.type === "video") {
                    template = JST.backchanel_video;
                } else if (post.type === "regular") {
                    template = JST.backchannel_regular;

                    post["regular-body"] = post["regular-body"]
                        // Prevent multiple requests for twitter widget js.
                        .replace('<script charset="utf-8" src="//platform.twitter.com/widgets.js" type="text/javascript"></script>', "")
                        // Fix malformed tweet markup.
                        .replace('</blockquote>\n<blockquote class="twitter-tweet">', "");
                }

                if (!template) {
                    return;
                }

                var html = template({
                    post: post,
                    isodate: ISODateString(new Date(post["unix-timestamp"] * 1000))
                });
                var el = $(html);

                // Old
                if (post.id in posts_html) {
                    // Changed
                    if (html != posts_html[post.id]) {
                        el.show();
                        posts_el.find("#post-" + post.id).replaceWith(el);

                        if (post.type === "regular") {
                           has_tweets = true;
                        }
                    }
                // New
                } else {
                    posts_el.prepend(el);

                    el = null;
                    el = posts_el.find("#post-" + post.id)

                    if (first_run) {
                        el.show();
                    } else {
                        el.slideDown(1000);
                    }

                    el.find(".tstamp").timeago();
                    el = null;

                    if (post.type === "regular") {
                        has_tweets = true;
                    }
                }

                posts_html[post.id] = html;
            }

            posts_el.find(".post:nth-child(5)").nextAll().remove();

            // Render incoming tweets
            if (has_tweets && !$.browser.msie) {
                if ('widgets' in twttr ) {
                    twttr.widgets.load(posts_el[0]);
                };
            }
        });
    }

    update_backchannel(true);
    setInterval(update_backchannel, POLLING_INTERVAL);
});
