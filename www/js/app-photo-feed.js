$(document).ready(function() {
    var POLLING_INTERVAL = 120000;
    var PHOTO_CATEGORIES = ['latest', 'npr-picks', 'i-voted-for-you', 'i-didnt-vote-for-you', 'id-rather-not-say-how-i-voted', 'i-didnt-vote']

    var photos = {};
    var photos_in_categories = {};

    _.each(PHOTO_CATEGORIES, function(category) {
        photos_in_categories[category] = [];
    });

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
        $.getJSON('live-data/misterpresident.json?t=' + (new Date()).getTime(), {}, function(data) {
            for (var i = 0; i < PHOTO_CATEGORIES.length; i++) {
                var category = PHOTO_CATEGORIES[i];
                //var template = JST.tumblr_photo;

                var posts = data[category];
                var posts_length = posts.length;

                var $photos = $("#photos-" + category);

                for (var j = 0; j < posts_length; j++) {
                    var post = posts[j];

                    var html = '<img id="photo-' + post.id + '" src="' + post['photo_url'] + '" />';
                    var $el = $(html);

                    // Old
                    if (_.indexOf(photos_in_categories[category], post.id) >= 0) {
                        // Changed
                        if (photos[post.id] != post) {
                            $photos.show();
                            $photos.find("#photo-" + post.id).replaceWith($el);
                        }

                    // New
                    } else {
                        $photos.prepend($el);

                        $el = null;
                        $el = $photos.find("#photo-" + post.id)

                        if (first_run) {
                            $el.show();
                        } else {
                            $el.slideDown(1000);
                        }

                        $el = null;

                        photos_in_categories[category].push(post.id);
                    }

                    photos[post.id] = post;
                }

                // $posts.find(".post:nth-child(5)").nextAll().remove();
            }
        });
    }

    update_backchannel(true);
    setInterval(update_backchannel, POLLING_INTERVAL);
});
