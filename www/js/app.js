/*
* Prepare the live chat widget.
*/
$(function(){

    // Constants for the live chat/widget
    var CHAT_ID = '74796';
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
                update_interval: CHAT_UPDATE_INTERVAL
            });

            livechatwidget = $widget.data('livechatwidget');
        }
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
    });

    $live_tab.trigger('click');
});
