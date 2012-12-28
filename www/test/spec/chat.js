describe("$.livechat", function() {
    beforeEach(function() {
        sandbox({ id: 'live-chat' });
    });

    it('should take options', function() {
        $livechat = $('#live-chat').livechat({
            chat_id: '74796',
            chat_token: 'FtP7wRfX',
            update_interval: 123,
            alert_interval: 456,
            read_only: true 
        });

        expect($livechat.settings.chat_id).toBe('74796');
        expect($livechat.settings.chat_token).toBe('FtP7wRfX');
        expect($livechat.settings.update_interval).toBe(123);
        expect($livechat.settings.alert_interval).toBe(456);
        expect($livechat.settings.read_only).toBe(true);
    });
});
