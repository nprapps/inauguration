$(document).ready(function() {
    var PHOTO_CATEGORIES = ['latest', 'nprpicks', 'ivotedforyou', 'ididntvoteforyou', 'idrathernotsayhowivoted', 'ididntvote']

    var MAX_PHOTOS_PER_CATEGORY = 100;
    var PHOTOS_PER_PAGE = 20;

    var photos = {};
    var feed_data = null;
    var next_photo_index = {};

    var $photo_container = $("#photo-feed");

    _.each(PHOTO_CATEGORIES, function(category) {
        next_photo_index[category] = 0;
    });

    function ISODateString(d) {
        function pad(n) {
            return n < 10 ? '0' + n : n
        }

        return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z'
    }

    function get_next_photos(category, data) {
        var start = next_photo_index[category];
        var end = start + PHOTOS_PER_PAGE;
        var paginated_photos = data.slice(start, end);

        next_photo_index[category] += PHOTOS_PER_PAGE;
        return paginated_photos;
    }


    function render_category_feed(category, posts) {
        var posts_length = Math.min(posts.length, MAX_PHOTOS_PER_CATEGORY);
        var $photos = $("#photos-" + category);
        var new_photos = [];

        for (var j = 0; j < posts_length; j++) {
            var post = posts[j];
            init_modal(post);

            var html = '<a href="#imgmodal-' + post.id +'" data-toggle="modal"><img class="photo-' + post.id + '" src="' + post['photo_url'] + '" /></a>';
            var $el = $(html);

            new_photos.push($el);
            $el = null;

            photos[post.id] = post;
        }

        var spinner = '<img class="load-more-spinner" data-category="' + category + '" style="width:100px; height:100px; background-color:pink;" />';
        $photos.find('.load-more-spinner').remove();
        
        $photos.append(new_photos);
        var photos_width = $photos.find('a').length * 122;

        if (next_photo_index[category] < feed_data[category].length) {
            $photos.append(spinner);
            photos_width += 122; // spinner size
        }

        $photos.css('width', photos_width + 'px');
    }

    function fetch_next() {
        var spinners = $('.load-more-spinner');
        spinners.each(function (i, spinner) {
            if ($(spinner).offset().left < $(window).width()) {
                var category = $(spinner).attr('data-category');
                update_category(category);
            }
        });
    }

    // init_modal(photo) : takes photo object and initializes modal with appropriate id and photo details
    function init_modal(photo) {
      var modal_html = JST.photo_modal({photo: photo});
      $('body').append(modal_html);
    }

    function update_category(category) {
        var posts = get_next_photos(category, feed_data[category]);

        var $photos = $("#photos-" + category);
        render_category_feed(category, posts);

        if (next_photo_index[category] >= feed_data[category].length) {
            $('#tumblrlink-' + category).show();
        }

        $photos = null;
    }

    function update_backchannel() {
        /*
         * Update the backchannel from our tumblr feed.
         */
        $.getJSON('live-data/misterpresident.json?t=' + (new Date()).getTime(), {}, function(data) {
            feed_data = data;

            _.each(PHOTO_CATEGORIES, function(category) {
                update_category(category);
            });
        });
    }

    var lazy_fetch_next = _.debounce(fetch_next, 300);
    $('#photo-feed .wrapper').scroll(lazy_fetch_next);

    update_backchannel();
});
