// eslint-disable-next-line no-extend-native
Object.defineProperty( Array.prototype, "flat", {
  "value": function( depth = 1 ) {
    return this.reduce( function ( flat, toFlatten ) {
      return flat.concat( ( Array.isArray( toFlatten ) && ( depth > 1 ) ) ? toFlatten.flat( depth - 1 ) : toFlatten );
    }, [] );
  }
} );

let checkCondition = true;

const { checkUnique } = require( "../../helpers/utils/functions/array" ),
  { searchPostPublic } = require( "../../networks/facebook/search/post" ),
  request = require( "axios" ),
  CronJob = require( "cron" ).CronJob,

  // Function handle crawl post facebook
  crawlPostFacebook = async ( infoCrawl ) => {
    // remove duplicate keywords
    infoCrawl.keywords = [ ...new Set( infoCrawl.keywords ) ] ;

    // Handle search on facebook and get info feed/ post
    let listPost = await Promise.all( infoCrawl.keywords.map( async ( keyword ) => {
      let listPostByKeyword;

      // Search post by keyword
      listPostByKeyword = await searchPostPublic( {
        "agent": process.env.FACEBOOK_APP_AGENT,
        "cookie": process.env.FACEBOOK_APP_COOKIE,
        "keyword": keyword,
        "number": 100
      } );
      // Remove post no content
      listPostByKeyword = listPostByKeyword.filter( ( post ) => post.postID.includes( "photos" ) === false ).filter( ( post ) => post.content !== "" || post.content !== null || post.content !== undefined );

      // Handle like, share and photos
      listPostByKeyword = await Promise.all( listPostByKeyword.map( async ( post ) => {
        post.feedId = post.postID;
        post.generate = 1;

        // Photos
        if ( post.photos && post.photos.length > 0 ) {
          post.attachments = await Promise.all( post.photos.map( ( photo ) => {
            return {
              "link": photo,
              "typeAttachment": 1
            };
          } ) );
          delete post.photos;
        }

        // Handle over props
        delete post.postID;

        return post;
      } ) );
      return listPostByKeyword;
    } ) );

    // Merge nested array
    listPost = listPost.flat( 1 );

    // Remove post exist in database
    if ( infoCrawl.data.length > 0 ) {
      listPost = listPost.filter( ( post ) => checkUnique( infoCrawl.data, "feedId", post.feedId ) === false );
    }

    // Filter
    listPost = listPost.filter( ( item ) => item.like > 100 );

    return listPost ;
  };

// eslint-disable-next-line func-style
function recursiveKeywords ( arr, data, index ) {
  if ( arr.length === 0 ) {
    checkCondition = true;
    return checkCondition;
  }
  checkCondition = false;
  let result = crawlPostFacebook( { "keywords": arr.splice( 0, index ), "data": data } );

  recursiveKeywords( arr, data, index );
  return result;
}


( async () => {
  // eslint-disable-next-line no-new
  new CronJob( "1 * * * * *", async function() {
    let dataResponseFromFacebook, dataResponseStatusFromMainServer;

    console.log( "Thread 01: Starting request get all keywords" );

    const listInfoRes = await request( {
      "method": "get",
      "url": `${process.env.APP_MAIN_URL}/api/v1/keywords/sync`
    } );

    if ( checkCondition === false ) {
      return false;
    }

    console.log( "Thread 02: Starting request crawler to facebook!" );
    dataResponseFromFacebook = await recursiveKeywords( listInfoRes.data.keywords.reverse(), listInfoRes.data.data, 2 );
    console.log( "Thread 02: Finnish request crawler to facebook!" );

    console.log( dataResponseFromFacebook );

    console.log( "Thread 03: Starting request save data to main server!" );
    dataResponseStatusFromMainServer = await request( {
      "method": "patch",
      "url": `${process.env.APP_MAIN_URL}/api/v1/posts/sync`,
      "data": dataResponseFromFacebook
    } );
    console.log( "Thread 03: Finnish request save data to main server!" );

    if ( dataResponseStatusFromMainServer.data.status !== "success" ) {
      console.log( "ERROR: Error crashed from main server in insertMany!" );
    }

    console.log( "CLOSED: Finnish scrape data from facebook. Waiting next 1 minutes..." );

  }, null, true, "Asia/Ho_Chi_Minh", null, true );
} )();
