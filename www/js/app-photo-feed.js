$(document).ready(function() {
    var PHOTO_CATEGORIES = ['ivotedforyou', 'ididntvoteforyou', 'idrathernotsayhowivoted', 'ididntvote']

    var MAX_PHOTOS_PER_CATEGORY = 100;
    var PHOTOS_PER_PAGE = 12;

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

    function render_category_feed(category) {
        var start = next_photo_index[category];
        var end = start + PHOTOS_PER_PAGE;

        if (end >= feed_data[category].length) {
            end = feed_data[category].length;
        }

        next_photo_index[category] += PHOTOS_PER_PAGE;

        var $slides = $("#photos-" + category);

        if ($(window).width() <= 480) {
            var $slide = $slides.find('.slide');

            if ($slide.length === 0) {
                $slides.append(JST.photo_slide({
                    'category': category,
                    'slide': start 
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
                'slide': start
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

        for (var j = start; j < end; j++) {
            var post = feed_data[category][j];

            var html = '<a href="javascript:;" class="photo-link" data-category="' + category + '" data-photo="' + j + '">';

            if ($(window).width() > 1200) {
                html += '<div class="tile" style="background-image:url(' + post['photo_url_500'] + ')" />';
            } else {
                html += '<div class="tile" style="background-image:url(' + post['photo_url_250'] + ')" />';
            }
            html += '</a>';
            var $el = $(html);

            new_photos.push($el);
            $el = null;
        }

        $photos.find('.load-more-spinner').remove();

        $photos.append(new_photos);

        resize_photo_feed(category);
    }

    function resize_photo_feed(category) {
        var $photo_feed = $('#photos-' + category).find('.photo-list');
        var photos_width = $photo_feed.find('a').length * 100;
        var spinner = '<img src="img/spinner.gif" class="load-more-spinner" data-category="' + category + '" />';
        var $tumblrlink = $photo_feed.find('.tumblrlink');

        if ($(window).width() <= 480) {
            // Mobile photo view, keep tumblr link within $photos div
            $tumblrlink.hide();

            if (next_photo_index[category] < feed_data[category].length) {
                $photo_feed.append(spinner);
                photos_width += 100; // spinner size
            }

            $photo_feed.css('width', photos_width + 'px');

            if (next_photo_index[category] >= feed_data[category].length) {
                $tumblrlink.show();
            }
        }

        else {
            // Desktop photo grid view, remove tumblr link from $photos div and append it
            $photo_feed.find('.load-more-spinner').remove();

            var width = $('#photo-feed').width();

            $('.photo-section').width(width + 'px');
            $('.slide').width(width + 'px');
        }
    }

    function fetch_next() {
        var spinners = $('.load-more-spinner');
        spinners.each(function (i, spinner) {
            if ($(spinner).offset().left < $(window).width()) {
                var category = $(spinner).attr('data-category');
                render_category_feed(category);
            }
        });
    }

    function render_modal() {
        /*
         * Render the photo modal.
         */
        var category = $(this).data('category');
        var photo_index = $(this).data('photo');

        if (photo_index == null) {
            console.log(photo_index);
            return;
        }

        var photo = feed_data[category][photo_index];
        var photo_url = photo.photo_url_1280;
        if ($(window).width() <= 480) {
            photo_url = photo.photo_url_500;
        }

        var previous = photo_index - 1;

        if (previous < 0) {
            previous = null;
        }

        var next = photo_index + 1;

        if (next >= feed_data[category].length) {
            next = null;
        }

        var data = {
            'category': category,
            'photo': photo,
            'photo_url': photo_url,
            'previous': previous,
            'next': next
        };

        var modal_html = JST.photo_modal(data);
        $photo_modal.html(modal_html);
        $timestamp = $photo_modal.find("abbr.timeago");
        $timestamp.text($.timeago(parseInt($timestamp.attr('data-time'))));
        $photo_modal.modal('show');
    }

    function init() {
        /*
         * Fetch the tumblr feed and render them.
         */
        $.getJSON('live-data/misterpresident.json?t=' + (new Date()).getTime(), {}, function(data) {
            feed_data = data;

            _.each(PHOTO_CATEGORIES, function(category) {
                render_category_feed(category);

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
        $photo_modal.delegate('.navigate.active', 'click', render_modal);
    }

    function update_page_links($slide) {
        var category = $slide.parent().data('category');
        var $next_slide = $slide.next('.slide');
        var $prev_slide = $slide.prev('.slide');
        var $tumblrlink = $slide.find('.tumblrlink').remove();

        $slide.find('.previous-photos').toggle($prev_slide.length > 0);

        // Another slide or more to render?
        if ($next_slide.length > 0 || next_photo_index[category] < feed_data[category].length) {
            $slide.find('.next-photos').show();
        } else {
            $slide.find('.next-photos').hide();
            $slide.append($tumblrlink);
            $tumblrlink.show();
        }
    }

    $photo_container.on('click', '.next-photos', function() {
        var $slide = $(this).parent();
        var $slides = $slide.parent();
        var $section = $slides.parent();
        var category = $slides.data('category');

        var $next_slide = $slide.next('.slide');

        if ($next_slide.length === 0) {
            render_category_feed(category);

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
