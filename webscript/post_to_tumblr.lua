local post_data = {
    type = "photo",
    state = "published",
    format = "html",
    caption = caption,
    data = request.files.image
}

local caption = string.format(
    "<p>Dear Mr. President:<br/>%s<br/>%s<br/>Signed,<br/>%s from %s.</p>",
    request.form.voted,
    request.form.message,
    request.form.signed_name,
    request.form.location)

local response = http.request {
    url = "http://api.tumblr.com/v2/blog/testmisterpresident.tumblr.com/post",
    method = "POST",
    headers = {
         ["Content-Type"] = "application/x-www-form-urlencoded",
    },
    auth = {
        oauth = {
            consumertoken = 'Cxp2JzyA03QxmQixf7Fee0oIYaFtBTTHKzRA0AveHlh094bwDH',
            consumersecret='QYQ6xuMMYzRmovnkiN1t5V0pLoeTPTYzNrMt1WH3gLDu3cm7XA',
            accesstoken='5jSuDYkecwiLxvSvpzcdnvI7UNY4ea5aHUjsV3hA24X3vwQwqe',
            tokensecret='Ay59qTVESMoidphwEF4hjhTD25AruTqWrB9GLa31tXHewFkrQa'
        }
    },
    data = post_data
}

return response.content