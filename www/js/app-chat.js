$(document).ready(function(){

    // Freaking range, seriously javascript?
    function range(a, b, step){
        var A= [];
        if(typeof a== 'number'){
            A[0]= a;
            step= step || 1;
            while(a+step<= b){
                A[A.length]= a+= step;
            }
        }
        else{
            var s= 'abcdefghijklmnopqrstuvwxyz';
            if(a=== a.toUpperCase()){
                b=b.toUpperCase();
                s= s.toUpperCase();
            }
            s= s.substring(s.indexOf(a), s.indexOf(b)+ 1);
            A= s.split('');
        }
        return A;
    }

    var POLLING_INTERVAL = 5000;
    var LIVECHAT = $('#live-chat');
    var LIVECHATPAGES = $('.live-chat-pagination');
    var CHAT_ID = $('#live-chat').attr('data-scribblelive-chat-id');
    var CURRENT_PAGE = 0;
    var TOTAL_PAGES = 0;

    function render_live_chat(data) {
        var new_posts = [];
        var pages = [];

        _.each(data.Posts, function(post, index, list){
            post.CreatedJSON = parseInt(moment(post.Created).valueOf(), 10);
            post.Created = moment(post.Created).format('dddd, MMMM Do YYYY, h:mm:ss a');
            new_posts.push(JST.chat_post({
                post: post
            }));
        });

        new_posts.sort();

        LIVECHAT.empty().append(new_posts);
    }

    function update_live_chat(page, chat_id) {
        $.ajax({
            url: 'http://apiv1.scribblelive.com/event/' + chat_id + '/all/?Token=FtP7wRfX&format=json&Max=10000&Order=desc',
            dataType: 'jsonp',
            jsonpCallback: 'nprlivechat',
            cache: false,
            success: function(data){
                TOTAL_PAGES = data.Pages;
                render_live_chat(data);
            }
        });
    }
    update_live_chat(CURRENT_PAGE, CHAT_ID);


    $('body').on('click', '.live-chat-pagination .page', function(){
        CURRENT_PAGE = $(this).attr('data-page');
        update_live_chat(CURRENT_PAGE, CHAT_ID);
    });
    // setInterval(update_live_chat, POLLING_INTERVAL);
});

// $(document).ready(function() {
//     var POLLING_INTERVAL = 5000;
//     var PAGE_SIZE = 25;

//     $LIVECHAT = $("#live-chat");

//     var polling_timer = null;
//     var chat_data = []

//     function render_chat() {
//         /*
//          * Update the live chat posts.
//          */
//         var data = chat_data;
//         var new_posts = [];

//         $.each(data.news.sticky, function(j, k) {
//             if (k.News.status) {
//                 new_news.push(JST.river_post({
//                     post: k.News,
//                     sticky: "sticky"
//                 }));
//             }
//         });

//         $.each(data.news.regular.slice(0, PAGE_SIZE), function(j, k) {
//             if (k.News.status) {
//                 new_news.push(JST.river_post({
//                     post: k.News,
//                     sticky: ''
//                 }));
//             }
//         });

//         $river.empty().append(new_news);
//         $river.find("p.timeago").timeago();

//         new_news = null;
//     }

//     function update_river() {
//         /*
//          * Fetch the latest river of news.
//          */
//         $.ajax({
//             url: 'http://www-cf.nprdev.org/buckets/agg/series/2012/elections/riverofnews/riverofnews.jsonp',
//             dataType: 'jsonp',
//             jsonpCallback: 'nprriverofnews',
//             success: function(data){
//                 river_data = data;
//                 render_river();
//             }
//         })
//     }

//     update_river();
//     setInterval(update_river, POLLING_INTERVAL);
// });

