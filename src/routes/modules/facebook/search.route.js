const router = require( "express-promise-router" )();
const FacebookSearchController = require( "../../../controllers/facebook/search/Post.controller" );

router.route( "/post/public" ).post( FacebookSearchController.searchPostPublic );

module.exports = router;
