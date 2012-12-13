$(function(){
    var POLLING_INTERVAL = 60000;
    
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
                    $('#radio').addClass('buffering');
                    $('#radio').removeClass('playing');
				},
				onPlay: function () {
                    $('#radio').removeClass('buffering');
                    $('#radio').addClass('playing');
				},
				onPause: function() {
                    $('#radio').removeClass('buffering');
                    $('#radio').removeClass('playing');
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
        $('#radio-htmlcontrol').show();
        $('#radio-htmlstream')[0].src = url;
    }

    function setupAudioInterface(title,prompt,feedback){
        //just in case we're switching to a new stream
        $('#radio').removeClass('buffering');
        $('#radio').removeClass('playing');
    
        $("#radio-title").text(title);
        $("#radio-prompt").text(prompt);
        $("#radio-feedback #radio-feedback-message").text(feedback);
    }
    
    //interactivity for the html player
    $('#radio-htmlcontrol').click(function(){
        var player = $('#radio-htmlstream')[0];
        if(player.paused) {
            player.play();
            $('#radio').addClass('playing');
        } else {
            player.pause();
            $('#radio').removeClass('playing');
        }
    });
    
    var oldStatus = {};
    
    function update_radio(){
        $.getJSON('live-data/radio.json?t=' + (new Date()).getTime(), function(status) {
            //check if the status has changed
            if(!_.isEqual(oldStatus, status)) {
                oldStatus = status;
                if(status['audio'] == 'true') {
                    if(status['streaming'] == 'true') {
                        playStream(status['flashStreamer'],status['flashFile'],status['htmlUrl'],status['title'],status['prompt'],status['feedback']); 
	                    $("body").removeClass("comingsoon").addClass("not-coming");
                    } else {
                        playFile(status['url'],status['title'],status['prompt'],status['feedback']); 
						$("#comingsoon-message").html(status['message']);
	                    $("body").removeClass("not-coming").addClass("comingsoon");
                    }
                    $("body").removeClass("no-audio").addClass("audio");
                } else {
                    $("#comingsoon-message").html(status['message']);
                    $("body").removeClass("audio").addClass("no-audio");
                    $("body").removeClass("not-coming").addClass("comingsoon");
                }
            }
        });
    }
    
    update_radio();
    setInterval(update_radio, POLLING_INTERVAL);
});
