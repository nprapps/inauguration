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

        // Sandbox
        sandbox({ id: 'live-chat' });
    });

    afterEach(function() {
        this.timers.restore();
        this.xhr.restore();
    });

    xit('should take options', function() {
        var $livechat = $('#live-chat').livechat({
            chat_id: '123456',
            chat_token: 'ABCDEFG',
            update_interval: 123,
            alert_interval: 456,
            read_only: true,
            scribble_host: 'test.com'
        });

        expect($livechat.settings.chat_id).toBe('123456');
        expect($livechat.settings.chat_token).toBe('ABCDEFG');
        expect($livechat.settings.update_interval).toBe(123);
        expect($livechat.settings.alert_interval).toBe(456);
        expect($livechat.settings.read_only).toBe(true);
        expect($livechat.settings.scribble_host).toBe('test.com');
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

    xdescribe('update_live_chat', function() {
        beforeEach(function() {
            this.$livechat = $('#live-chat').livechat({
                chat_id: '74796',
                chat_token: 'FtP7wRfX',
            });
        });

        it('should fetch the latest posts', function() {
            // TODO
        });
    });
});
