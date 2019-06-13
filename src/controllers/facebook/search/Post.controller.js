const { searchPostPublic } = require( "../../../networks/facebook/search/post" );

module.exports = {
  "searchPostPublic": async ( req, res ) => {
    const { keyword, size } = req.query,
      agent = process.env.FACEBOOK_APP_AGENT,
      cookie = process.env.FACEBOOK_APP_COOKIE,
      data = await searchPostPublic( { agent, cookie, keyword, size } );

    res.status( 200 ).json( { "status": "success", "data": data } );
  }
};
