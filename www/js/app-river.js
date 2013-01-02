$(document).ready(function() {
    var POLLING_INTERVAL = 60000;
	var PAGE_SIZE = 25;

    var $river = $("#river");

    var polling_timer = null;
	var river_data = [];

    function render_river() {
        /*
         * Update the river of news feed.
         */
        var data = river_data;
		var new_news = [];

		$.each(data.news.sticky, function(j, k) {
			if (k.News.status) {
				new_news.push(JST.river_post({
                    post: k.News,
                    sticky: "sticky"
                }));
			}
		});

		$.each(data.news.regular.slice(0, PAGE_SIZE), function(j, k) {
			if (k.News.status) {
				new_news.push(JST.river_post({
                    post: k.News,
                    sticky: ''
                }));
			}
		});

		$river.empty().append(new_news);
        $river.find("p.timeago").timeago();

        new_news = null;
	}

	function update_river() {
        /*
         * Fetch the latest river of news.
         */
		$.ajax({
	        url: 'http://www-cf.nprdev.org/buckets/agg/series/2012/elections/riverofnews/riverofnews.jsonp',
		    dataType: 'jsonp',
		    jsonpCallback: 'nprriverofnews',
		    success: function(data){
				river_data = data;
				render_river();
		    }
		})
	}

    update_river();
    setInterval(update_river, POLLING_INTERVAL);
});
