$(function(){
    var POLLING_INTERVAL = 60000;

    var $b = $('body');
    var $radio = $('#radio');
    var $radio_control = $('#radio-htmlcontrol')
    var $radio_feedback = $('#radio-feedback-message');
    var $radio_prompt = $('#radio-prompt');
    var $radio_stream = $('#radio-htmlstream');
    var $radio_title = $('#radio-title');
    var $coming_message = $('#comingsoon-message');
    
    function playStream(flashStreamer,flashFile,htmlUrl,title,prompt,feedback){
        play(true,flashStreamer,flashFile,htmlUrl,title,prompt,feedback);
    }

    function playFile(url,title,prompt,feedback){
        play(false,'',url,url,title,prompt,feedback);
    }
    
    function play(streaming,flashStreamer,flashFile,htmlUrl,title,prompt,feedback) {
        //jwplayer uses the video tag, even for html5 audio, so we kick it to the curb for iOS
        //but we want to use the flash player when possible to get the analytics and stuff        
        if (navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad|android)/)) {
            setupHtmlPlayer(htmlUrl);
        } else {
            setupFlashPlayer(streaming,flashStreamer,flashFile);
        }
        setupAudioInterface(title,prompt,feedback);
    }

    function setupFlashPlayer(streaming,streamer,file){
        var options = {
            file: file,
            modes: [
                {
                    type: 'flash',
                    src: 'http://www.npr.org/templates/javascript/jwplayer/player.swf'
                }
            ],
            skin: 'http://www.npr.org/design/stage/audioTest/live-convention-controls.zip',
            controlbar: 'bottom',
            width: '41',
            height: '41',
            bufferlength: '5',
			plugins: {
				'gapro-2': {
                    'trackingobject': '_gaq',
                    'trackstarts': 'true',
                    'trackpercentage': 'true',
                    'tracktime': 'true'
				}
			},
			events: {
				onBuffer: function () {
					console.log('buffering')
                    $radio.addClass('buffering');
                    $radio.removeClass('playing');
				},
				onPlay: function () {
					console.log('playing')
                    $radio.removeClass('buffering');
                    $radio.addClass('playing');
				},
				onPause: function() {
					console.log('paused')
                    $radio.removeClass('buffering');
                    $radio.removeClass('playing');
				}
			}
        }
    
        if(streaming){
            options['provider'] = 'rtmp';
            options['streamer'] = streamer;
        }
        
        jwplayer('jwplayer').setup(options);
    }

    function setupHtmlPlayer(url){
        $radio_control.show();
        $radio_stream[0].src = url;
    }

    function setupAudioInterface(title,prompt,feedback){
        //just in case we're switching to a new stream
        $radio.removeClass('buffering');
        $radio.removeClass('playing');
    
        $radio_title.text(title);
        $radio_prompt.text(prompt);
        $radio_feedback.text(feedback);
    }
    
    //interactivity for the html player
    $radio_control.click(function(){
        var player = $radio_stream[0];
        if(player.paused) {
            player.play();
            $radio.addClass('playing');
        } else {
            player.pause();
            $radio.removeClass('playing');
        }
    });
    
    var old_status = {};
    
    function update_radio(){
        $.getJSON('live-data/radio.json?t=' + (new Date()).getTime(), function(status) {
            //check if the status has changed
            if(!_.isEqual(old_status, status)) {
                old_status = status;
                if(status['audio'] == 'true') {
                    if(status['streaming'] == 'true') {
                        playStream(status['flashStreamer'],status['flashFile'],status['htmlUrl'],status['title'],status['prompt'],status['feedback']); 
	                    $b.removeClass("comingsoon").addClass("not-coming");
                    } else {
                        playFile(status['url'],status['title'],status['prompt'],status['feedback']); 
						$coming_message.html(status['message']);
	                    $b.removeClass("not-coming").addClass("comingsoon");
                    }
                    $b.removeClass("no-audio").addClass("audio");
                } else {
                    $coming_message.html(status['message']);
                    $b.removeClass("audio").addClass("no-audio");
                    $b.removeClass("not-coming").addClass("comingsoon");
                }
                switch(status['id']) {
                	case 'pregame':
                		$b.removeClass('live').removeClass('off').addClass('pregame');
                		break;
                	case 'live':
                		$b.removeClass('pregame').removeClass('off').addClass('live');
                		break;
                	case 'off':
                		$b.removeClass('pregame').removeClass('live').addClass('off');
                		break;
                }
            }
        });
    }
    
    update_radio();
    setInterval(update_radio, POLLING_INTERVAL);
});
