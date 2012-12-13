$(document).ready(function() {
    var POLLING_INTERVAL = 60000;
	var PAGE_SIZE = 25;

    $live_blog = $("#live-blog");

    var polling_timer = null;
	var live_blog_data = []

    function render_live_blog() {
        /*
         * Update the river of news feed.
         */
        var data = live_blog_data;
		var new_news = [];

		$.each(data.news.sticky, function(j, k) {
			if (k.News.status) {
				new_news.push(JST.live_blog_post({
                    post: k.News,
                    sticky: "sticky"
                }));
			}
		});

		$.each(data.news.regular.slice(0, PAGE_SIZE), function(j, k) {
			if (k.News.status) {
				new_news.push(JST.live_blog_post({
                    post: k.News,
                    sticky: ''
                }));
			}
		});

		$live_blog.empty().append(new_news);
        $live_blog.find("p.timeago").timeago();

        new_news = null;
	}

	function update_live_blog() {
        /*
         * Fetch the latest river of news.
         */
		$.ajax({
		    url: 'http://www-cf.nprdev.org/buckets/agg/series/2012/elections/riverofnews/riverofnews.jsonp',
		    dataType: 'jsonp',
		    jsonpCallback: 'nprriverofnews',
		    success: function(data){
				live_blog_data = data;
				render_live_blog();
		    }
		})
	}

    update_live_blog();
    setInterval(update_live_blog, POLLING_INTERVAL);
});

