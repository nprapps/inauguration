$(document).ready(function() {
    var POLLING_INTERVAL = 120000;
    var PHOTO_CATEGORIES = ['latest', 'npr-picks', 'i-voted-for-you', 'i-didnt-vote-for-you', 'id-rather-not-say-how-i-voted', 'i-didnt-vote']

    var MAX_POSTS_PER_CATEGORY = 100;
    var INITIAL_NUM_POSTS = 20;

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

    // Paginate: Takes a page number, number of photos per page, and data (array of photos)
    function paginate(page_number, per_page, data) {
        var start = Math.max(page_number-1, 0);
        var end = start + per_page;
        var paginated_photos = [];

        if (end < data.length) {
            paginated_photos = data.splice(start, per_page);
        }

        else {
            end = data.length-1;
            paginated_photos = data.splice(start, per_page);
        }

        return paginated_photos;
    }

    function update_backchannel(first_run) {
        /*
         * Update the backchannel from our tumblr feed.
         */
        $.getJSON('live-data/misterpresident.json?t=' + (new Date()).getTime(), {}, function(data) {
            for (var i = 0; i < PHOTO_CATEGORIES.length; i++) {
                var category = PHOTO_CATEGORIES[i];
                //var template = JST.tumblr_photo;

                var page_num = 1;
                var posts = paginate(page_num, 20, data[category]);
                // var posts = data[category];
                var posts_length = Math.min(posts.length, MAX_POSTS_PER_CATEGORY);

                var $photos = $("#photos-" + category);

                for (var j = 0; j < posts_length; j++) {
                    var post = posts[j];

                    var html = '<img class="photo-' + post.id + '" src="' + post['photo_url'] + '" />';
                    var $el = $(html);

                    // Old
                    if (_.indexOf(photos_in_categories[category], post.id) >= 0) {
                        // Changed
                        if (photos[post.id] != post) {
                            $photos.show();
                            $photos.find(".photo-" + post.id).replaceWith($el);
                        }

                    // New
                    } else {
                        $photos.append($el);

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
