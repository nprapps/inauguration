$(document).ready(function() {
    var PHOTO_CATEGORIES = ['latest', 'nprpicks', 'ivotedforyou', 'ididntvoteforyou', 'idrathernotsayhowivoted', 'ididntvote']

    var MAX_PHOTOS_PER_CATEGORY = 100;
    var PHOTOS_PER_PAGE = 1;

    var photos = {};
    var photos_in_categories = {};
    var page_state = {};

    _.each(PHOTO_CATEGORIES, function(category) {
        photos_in_categories[category] = [];
        page_state[category] = 1;
    });

    function ISODateString(d) {
        function pad(n) {
            return n < 10 ? '0' + n : n
        }

        return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z'
    }

    // Paginate: Takes a page number, number of photos per page, and data (array of photos)
    // paginate() takes care of dealing with array indices.
    function paginate(page_number, per_page, data) {
        var start = Math.max(page_number-1, 0);
        var end = start + per_page;
        var paginated_photos = [];

        paginated_photos = data.splice(start, per_page);

        if (end > data.length) {
            return false;
        }

        else {
            return paginated_photos;
        }
    }


    function update_category_feed(category, posts, first_run) {
        var posts_length = Math.min(posts.length, MAX_PHOTOS_PER_CATEGORY);
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
    }

    function update_backchannel(first_run) {
        /*
         * Update the backchannel from our tumblr feed.
         */
        $.getJSON('live-data/misterpresident.json?t=' + (new Date()).getTime(), {}, function(data) {
            for (var i = 0; i < PHOTO_CATEGORIES.length; i++) {
                var category = PHOTO_CATEGORIES[i];
                //var template = JST.tumblr_photo;

                // var posts = paginate(page_state[category], PHOTOS_PER_PAGE, data[category]);
                var posts = data[category];

                var $photos = $("#photos-" + category);
                update_category_feed(category, posts, true);
            }
        });
    }

    var $photo_container = $("#photo-feed");
    $photo_container.on('click', 'button', function(){
        var tmp_category = $(this).attr('id').replace('button-', '');
        var new_posts = paginate(page_state[tmp_category], PHOTOS_PER_PAGE, global_data[tmp_category]);
        if (new_posts) {
          update_category_feed(tmp_category, new_posts, false);
        }
        else {
          $(this).append('link to tumblr at the end');
        }
        page_state[tmp_category] += 1;
    });

    update_backchannel(true);
});
