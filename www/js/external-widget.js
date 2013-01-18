/*
* Prepare the live chat widget.
*/
$(function(){
    $('#live-chat-widget').livechatwidget({
        chat_id: '78919',
        chat_token: 'FtP7wRfX',
        update_interval: 10000
    });
    if($(window).width() < 500) {
        $('body').addClass('skinny');
    }
});
