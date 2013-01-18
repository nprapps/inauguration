$(document).ready(function() {
    var PHOTO_CATEGORIES = ['latest', 'nprpicks', 'ivotedforyou', 'ididntvoteforyou', 'idrathernotsayhowivoted', 'ididntvote']

    var MAX_PHOTOS_PER_CATEGORY = 100;
    var PHOTOS_PER_PAGE = 20;

    var photos = {};
    var feed_data = null;
    var next_photo_index = {};

    var $photo_container = $('#photo-feed');
    var $photo_modal = $('#photo-modal');

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
        var $slides = $("#photos-" + category);

        if ($(window).width() <= 480) {
            var $slide = $slides.find('.slide');
            
            if ($slide.length === 0) {
                $slides.append(JST.photo_slide({
                    'category': category,
                    'slide': posts[0].id
                }));
            
                var $slide = $slides.find('.slide');
                
                var lazy_fetch_next = _.debounce(fetch_next, 300);
                $slide.scroll(lazy_fetch_next);
            }

            var $photos = $slide.find(".photo-list");
        } else {
            var width = $('#photo-feed').width();

            $slides.css({
                'z-index': '999',
                'width': '10000px',
                'overflow': 'hidden'
            });

            $slides.append(JST.photo_slide({
                'category': category,
                'slide': posts[0].id
            }));
            var $slide = $slides.find('.slide').last();

            $slide.css({
                'position': 'relative',
                'overflow': 'hidden',
                'float': 'left',
                'width': width + 'px'
            });

            var $photos = $slide.find(".photo-list");
        }

        var new_photos = [];

        for (var j = 0; j < posts_length; j++) {
            var post = posts[j];

            var html = '<a href="javascript:;" class="photo-link" data-photo="' + post.id + '">';
            html += '<div class="tile" style="background:url(' + post['photo_url_250'] + ') center center no-repeat" />';
            html += '</a>';
            var $el = $(html);

            new_photos.push($el);
            $el = null;

            photos[post.id] = post;
        }

        $photos.find('.load-more-spinner').remove();

        $photos.append(new_photos);

        resize_photo_feed(category);
    }

    function resize_photo_feed(category) {
        var $photo_feed = $('#photos-' + category).find('.photo-list');
        var photos_width = $photo_feed.find('a').length * 122;
        var spinner = '<img src="img/spinner.gif" class="load-more-spinner" data-category="' + category + '" />';
        var $tumblrlink = $photo_feed.find('.tumblrlink');

        if ($(window).width() <= 480) {
            // Mobile photo view, keep tumblr link within $photos div

            $tumblrlink.hide();

            if (next_photo_index[category] < feed_data[category].length) {
                $photo_feed.append(spinner);
                photos_width += 122; // spinner size
            }

            $photo_feed.css('width', photos_width + 'px');

            if (next_photo_index[category] >= feed_data[category].length) {
                $tumblrlink.show();
            }
        }

        else {
            // Desktop photo grid view, remove tumblr link from $photos div and append it
            $tumblrlink.remove();
            $photo_feed.append($tumblrlink);
            $tumblrlink.show();

            $photo_feed.find('.load-more-spinner').remove();
            //$photo_feed.css('width', "100%");

            var width = $('#photo-feed').width();

            $('.photo-section').width(width + 'px');
            //$('.slides').width(width + 'px');
            $('.slide').width(width + 'px');
        }
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

    function update_category(category) {
        var posts = get_next_photos(category, feed_data[category]);

        render_category_feed(category, posts);
    }

    function render_modal() {
        /*
         * Render the photo modal.
         */
        var photo_id = $(this).data('photo');
        var data = {
            'photo': photos[photo_id],
            'previous': $(this).prev('.photo-link').data('photo'),
            'next': $(this).next('.photo-link').data('photo')
        };

        var modal_html = JST.photo_modal(data);
        $photo_modal.html(modal_html);

        $photo_modal.modal('show');
    }

    function modal_link_clicked() {
        var photo_id = $(this).data('photo');

        render_modal.call($('.photo-link[data-photo="' + photo_id + '"]'));
    }

    function init() {
        /*
         * Fetch the tumblr feed and render them.
         */
        $.getJSON('live-data/misterpresident.json?t=' + (new Date()).getTime(), {}, function(data) {
            feed_data = data;

            _.each(PHOTO_CATEGORIES, function(category) {
                update_category(category);
        
                var $slides = $("#photos-" + category);
                var $slide = $slides.find('.slide');

                update_page_links($slide);
            });

        }).then(function() {
            _.each(PHOTO_CATEGORIES, function(category) {
              var lazy_resize_photo_feed = _.debounce(function () { resize_photo_feed(category) }, 300);
              $(window).resize(lazy_resize_photo_feed);
            });
        });

        $photo_container.delegate('.photo-link', 'click', render_modal);
        $photo_modal.delegate('.navigate', 'click', modal_link_clicked);
    }

    function update_page_links($slide) {
        var category = $slide.parent().data('category');
        var $next_slide = $slide.next('.slide');
        var $prev_slide = $slide.prev('.slide');

        $slide.find('.previous-photos').toggle($prev_slide.length > 0);
        
        // Another slide or more to render?
        if ($next_slide.length > 0 || next_photo_index[category] < feed_data[category].length) {
            $slide.find('.next-photos').show();
        } else {
            $slide.find('.next-photos').hide();
        }
    }

    $photo_container.on('click', '.next-photos', function() {
        var $slide = $(this).parent();
        var $slides = $slide.parent();
        var $section = $slides.parent();
        var category = $slides.data('category');
        
        var $next_slide = $slide.next('.slide');

        if ($next_slide.length === 0) {
            update_category(category);

            $next_slide = $slide.next('.slide');
        }

        $.smoothScroll({
            direction: 'left',
            scrollElement: $section,
            scrollTarget: '#' + $next_slide.attr('id')
        });

        update_page_links($next_slide);

        return false;
    });

    $photo_container.on('click', '.previous-photos', function() {
        var $slide = $(this).parent();
        var $slides = $slide.parent();
        var $section = $slides.parent();
        var category = $slides.data('category');
        
        var $prev_slide = $slide.prev('.slide');

        $.smoothScroll({
            direction: 'left',
            scrollElement: $section,
            scrollTarget: '#' + $prev_slide.attr('id')
        });

        update_page_links($prev_slide);

        return false;
    });

    init();
});
