/*
* Prepare the live chat widget.
*/
$('#live-chat-widget').livechatwidget({
    chat_id: '74796',
    chat_token: 'FtP7wRfX',
});

$('button.live-chat-toggle').on('click', function(){
    /*
    * Toggle the live chat window.
    * Exciting!
    */
    var $livechat = $('#live-chat');
    $livechat.toggle();
    if ($livechat.is(':visible')){
        /*
        * If the chat is visible, load up the module and set up the button.
        */
        $('button.live-chat-toggle').html('Turn off live chat.');
        $('#live-chat').livechat({
            chat_id: '74796',
            chat_token: 'FtP7wRfX',
            update_interval: 10000,
            alert_interval: 500,
            read_only: false
        });
    } else {
        /*
        * Otherwise, kill the module and set up the button.
        */
        $('button.live-chat-toggle').html('Turn on live chat.');
        $('#live-chat').livechat = null;
    }

});
