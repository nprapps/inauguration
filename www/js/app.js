$(function(){
    // Constants for the live chat/widget
    var CHAT_ID = '78919';
    var CHAT_TOKEN = 'FtP7wRfX';
    var CHAT_UPDATE_INTERVAL = 5000;

    // Caching some DOM objects
    var $live = $('#live-chat');
    var $live_tab = $('#chat-toggle');
    var $widget = $('#live-chat-widget');
    var $mrprez = $('#mr-president');
    var $mrpres_tab = $('#mr-president-toggle');

    var livechat = null;
    var livechatwidget = null;

    $mrpres_tab.on('click', function() {
        $live.hide();
        $widget.show();
        $mrprez.show();

        $(this).addClass('selected');
        $live_tab.removeClass('selected');

        if (livechat) {
            livechat.pause(true);
        }

        if (livechatwidget) {
            livechatwidget.pause(false);
        } else {
            $widget.livechatwidget({
                chat_id: CHAT_ID,
                chat_token: CHAT_TOKEN,
                update_interval: CHAT_UPDATE_INTERVAL,
                max_text_length: 200
            });

            livechatwidget = $widget.data('livechatwidget');
        }

        window.location.hash = '';
    });

    $live_tab.on('click', function() {
        $live.show();
        $widget.hide();
        $mrprez.hide();

        $(this).addClass('selected');
        $mrpres_tab.removeClass('selected');

        if (livechatwidget) {
            livechatwidget.pause(true);
        }

        if (livechat) {
            livechat.pause(false);
        } else {
            $live.livechat({
                chat_id: CHAT_ID,
                chat_token: CHAT_TOKEN,
                update_interval: CHAT_UPDATE_INTERVAL,
                alert_interval: 500,
                read_only: false
            });

            livechat = $live.data('livechat');
        }

        window.location.hash = '#chat';
    });
    if (window.location.hash == '#chat') {
        $live_tab.trigger('click');
    } else {
        $mrpres_tab.trigger('click');
    }
});
