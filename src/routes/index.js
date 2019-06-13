// eslint-disable-next-line new-cap
const router = require( "express" ).Router();

// Facebook Route
router.use( "/facebook/search", require( "./modules/facebook/search.route" ) );

module.exports = router;
