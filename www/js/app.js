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
    $mrpres_tab.on('click', function() {
    	$live.hide();
    	$widget.show();
    	$mrprez.show();
    	
    	$(this).addClass('selected');
    	$live_tab.removeClass('selected');

		/*
		* Kill the live chat module and set up the widget.
		*/
		$live.livechat = null;
		init_live_widget();
    });
    $live_tab.on('click', function() {
    	$live.show();
    	$widget.hide();
    	$mrprez.hide();

    	$(this).addClass('selected');
    	$mrpres_tab.removeClass('selected');

		/*
		* If the live chat is alive, set up the live chat JS and unregister the widget.
		*/
		$widget.livechatwidget = null;
		$live.livechat({
			chat_id: CHAT_ID,
			chat_token: CHAT_TOKEN,
			update_interval: CHAT_UPDATE_INTERVAL,
			alert_interval: 500,
			read_only: false
		});
    });
});
