describe('$.livechat', function() {
    beforeEach(function() {
        // Fake XHR
        this.xhr = sinon.useFakeXMLHttpRequest();
        var requests = this.requests = [];

        this.xhr.onCreate = function(xhr) {
            requests.push(xhr);
        };

        // Fake Timers
        this.timers = sinon.useFakeTimers();

        // JSON Fixtures
        jasmine.getJSONFixtures().fixturesPath = '/test/fixtures'

        // Sandbox
        sandbox({ id: 'live-chat' });
    });

    afterEach(function() {
        this.timers.restore();
        this.xhr.restore();
    });

    it('should take options', function() {
        var $livechat = $('#live-chat').livechat({
            chat_id: '123456',
            chat_token: 'ABCDEFG',
            update_interval: 123,
            alert_interval: 456,
            read_only: true,
            scribble_host: window.location.host
        });

        expect($livechat.settings.chat_id).toBe('123456');
        expect($livechat.settings.chat_token).toBe('ABCDEFG');
        expect($livechat.settings.update_interval).toBe(123);
        expect($livechat.settings.alert_interval).toBe(456);
        expect($livechat.settings.read_only).toBe(true);
        expect($livechat.settings.scribble_host).toBe(window.location.host);
    });

    it('should update automatically', function() {
        var $livechat = $('#live-chat').livechat({
            chat_id: '123456',
            chat_token: 'ABCDEFG',
            update_interval: 100,
            scribble_host: window.location.host 
        });

        expect(this.requests.length).toBe(1);

        this.timers.tick(150);

        expect(this.requests.length).toBe(2);
    });

    describe('update_live_chat', function() {
        beforeEach(function() {
            this.$livechat = $('#live-chat').livechat({
                chat_id: '74796',
                chat_token: 'FtP7wRfX',
                update_interval: 100,
                scribble_host: window.location.host 
            });

            //this.requests[0].respond(200, { 'Content-Type': 'application/json' }, getJSONFixture('chat_posts_base.json'));
        });

        xit('should fetch the latest posts', function() {
            //expect(this.requests.length).toBe(0);
            //this.timers.tick(150);
            //expect(this.requests.length).toBe(1);

        });
    });
});
