$(document).ready(function(){

    var POLLING_INTERVAL = 5000;
    var LIVECHAT = $('#live-chat');
    var LIVECHATPAGES = $('.live-chat-pagination');
    var CHAT_ID = $('#live-chat').attr('data-scribblelive-chat-id');
    var CHAT_TITLE = $('#live-chat-title');
    var CHAT_BLURB = $('#live-chat-blurb');
    var CURRENT_PAGE = 0;
    var TOTAL_PAGES = 0;

    function render_live_chat(data) {
        var new_posts = [];
        var pages = [];

        CHAT_TITLE.text(data.Title);
        CHAT_BLURB.text(data.Description);

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

    function update_live_chat() {
        $.ajax({
            url: 'http://apiv1.scribblelive.com/event/' + CHAT_ID + '/all/?Token=FtP7wRfX&format=json&Max=10000&Order=desc',
            dataType: 'jsonp',
            jsonpCallback: 'nprlivechat',
            cache: false,
            success: function(data){
                TOTAL_PAGES = data.Pages;
                render_live_chat(data);
            }
        });
    }
    update_live_chat();

    setInterval(update_live_chat, POLLING_INTERVAL);
});
