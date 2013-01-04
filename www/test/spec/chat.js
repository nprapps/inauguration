describe('$.livechat', function() {
    var xhr_requests = [];

    beforeEach(function() {
        // Set predictable jsonp callback 
        $.ajaxSetup({
            jsonpCallback: 'test'
        });

        // Fake XHR
        this.xhr = sinon.useFakeXMLHttpRequest();
        
        this.xhr.addFilter(function(method, url) {
            return url.indexOf('/test/fixtures') === 0;
        });
        this.xhr.useFilters = true;

        this.xhr.onCreate = function(xhr) {
            xhr_requests.push(xhr);
        };

        // Fake Timers
        this.timers = sinon.useFakeTimers();

        // JSON Fixtures
        jasmine.getJSONFixtures().fixturesPath = '/test/fixtures'

        // Sandbox
        $('body').append(sandbox({ id: 'live-chat' }));
    });

    afterEach(function() {
        $('#live-chat').remove();

        this.timers.restore();
        this.xhr.restore();

        xhr_requests = [];
    });

    it('should take options', function() {
        var livechat = $('#live-chat').livechat({
            chat_id: '123456',
            chat_token: 'ABCDEFG',
            update_interval: 123,
            alert_interval: 456,
            read_only: true,
            scribble_host: window.location.host
        }).data('livechat');

        expect(livechat.settings.chat_id).toBe('123456');
        expect(livechat.settings.chat_token).toBe('ABCDEFG');
        expect(livechat.settings.update_interval).toBe(123);
        expect(livechat.settings.alert_interval).toBe(456);
        expect(livechat.settings.read_only).toBe(true);
        expect(livechat.settings.scribble_host).toBe(window.location.host);
    });

    it('should update automatically', function() {
        var livechat = $('#live-chat').livechat({
            chat_id: '123456',
            chat_token: 'ABCDEFG',
            update_interval: 100,
            scribble_host: window.location.host 
        }).data('livechat');

        xhr_requests = [];

        this.timers.tick(150);
        expect(xhr_requests.length).toBe(1);

        this.timers.tick(150);
        expect(xhr_requests.length).toBe(3);
    });

    describe('update_live_chat', function() {
        beforeEach(function() {
            this.livechat = $('#live-chat').livechat({
                chat_id: '74796',
                chat_token: 'FtP7wRfX',
                update_interval: 100,
                scribble_host: window.location.host 
            }).data('livechat');
            
            xhr_requests = [];
        });

        it('should update the live chat', function() {
            this.livechat.update_live_chat();

            expect(xhr_requests.length).toBe(1);
        });

        it('should render the latest posts', function() {
            this.livechat.render_new_posts(getJSONFixture('chat_posts_base.json'));

            expect(this.livechat.$chat_body.find('.chat-post').length).toBe(1);
        });
    });
});
