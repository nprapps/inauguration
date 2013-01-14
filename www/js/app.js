/*
* Prepare the live chat widget.
*/
$(function(){

    // Constants for the live chat/widget
    var CHAT_ID = '74796';
    var CHAT_TOKEN = 'FtP7wRfX';
    var CHAT_UPDATE_INTERVAL = 10000;

    // Caching some DOM objects
    var $button = $('button.live-chat-toggle');
    var $live = $('#live-chat');
    var $widget = $('#live-chat-widget');
    var $mrprez = $('#mr-president');

    /*
    * Initializes the live chat widget.
    */
    function init_live_widget(){
        return $widget.livechatwidget({
            chat_id: CHAT_ID,
            chat_token: CHAT_TOKEN,
            update_interval: CHAT_UPDATE_INTERVAL
        });
    }
    init_live_widget();

    /*
    * Toggle all of the things.
    */
    $button.on('click', function(){

        $live.toggle();
        $widget.toggle();
        $mrprez.toggle();

        if ($live.is(':visible')){
            /*
            * If the live chat is alive, set up the live chat JS and unregister the widget.
            */
            $button.html('Turn off live chat.');
            $widget.livechatwidget = null;
            $live.livechat({
                chat_id: CHAT_ID,
                chat_token: CHAT_TOKEN,
                update_interval: CHAT_UPDATE_INTERVAL,
                alert_interval: 500,
                read_only: false
            });
        } else {
            /*
            * Otherwise, kill the live chat module and set up the widget.
            */
            $button.html('Turn on live chat.');
            $live.livechat = null;
            init_live_widget();
        }
    });

});
