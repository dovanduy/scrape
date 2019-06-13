let listPosts = [], page = 2;
const cheerio = require( "cheerio" ),
  htmlDecode = require( "ent/decode" ),
  request = require( "request" ),
  { getDataTokenSign, getDataTokenSignAgent } = require( "../../../networks/facebook/token/datatokensign" ),
  { getPostByModalUrl, searchPostPublicUrl } = require( "../../../configs/facebook/scrape.url" ),
  { convertUnicodeToCharacter, findSubString } = require( "../../../helpers/utils/functions/string" ),
  getPostInfoByModalAPI = ( { agent, cookie, storyToken, unicornStoryID } ) => {
    return new Promise( async ( resolve ) => {
      const option = {
        "method": "POST",
        "url": getPostByModalUrl( storyToken, unicornStoryID ),
        "headers": {
          "User-Agent": agent,
          "Cookie": cookie
        },
        "form": {
          "__asyncDialog": 1,
          "__a": "1",
          "__user": findSubString( cookie, "c_user=", ";" ),
          "fb_dtsg": await getDataTokenSign( { agent, cookie } )
        }
      };

      request( option, "utf8", async ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {
          let photos = [];
          const data = JSON.parse( body.replace( "for (;;);", "" ) ),
            $ = cheerio.load( data.jsmods.markup[ 0 ][ 1 ].__html );

          $( "div.userContentWrapper" )
            .find( "a[rel*='theater']" )
            .each( function() {
              photos.push( $( this ).attr( "data-ploi" ) );
            } );

          resolve( {
            "errors": {
              "code": 200,
              "message": "Lấy thông tin bài viết thành công!"
            },
            "results": {
              "content": htmlDecode( $( "div.userContent" ).html().replace( /(<br \/>)|(<br>)/gm, "\n" ).replace( /(<\/p>)|(<\/div>)/gm, "\n" ).replace( /(<([^>]+)>)/gm, "" ) ),
              "photos": photos.filter( ( photo ) => photo !== undefined && photo !== null )
            }
          } );
        }
        return resolve( {
          "errors": {
            "code": 403,
            "message": "Hệ thống xảy ra lỗi trong quá trình request tới facebook. Có thể facebook đã đổi api!"
          },
          "results": null
        } );
      } );
    } );
  },
  // eslint-disable-next-line no-shadow
  searchScrapeByAPI = ( { agent, cookie, cursor, keyword, page, token } ) => {
    return new Promise( ( resolve ) => {
      const option = {
        "method": "GET",
        "url": searchPostPublicUrl( cursor, keyword, findSubString( cookie, "c_user=", ";" ), page, token ),
        "headers": {
          "User-Agent": agent,
          "Cookie": cookie
        }
      };

      request( option, async ( err, res, body ) => {
        if ( !err && res.statusCode === 200 ) {

          const data = JSON.parse( body.replace( "for (;;);", "" ) ),
            dataModalPosts = await Promise.all( data.jsmods.require.filter( ( post ) => Array.isArray( post ) && post.includes( "DenseStoryInlineExpansion" ) ).map( ( post ) => {
              return {
                "storyToken": post[ post.length - 1 ][ post[ post.length - 1 ].length - 1 ].storyToken,
                "unicornStoryID": post[ post.length - 1 ][ post[ post.length - 1 ].length - 1 ].unicornStoryID
              };
            } ) );

          if ( data.jsmods.pre_display_requires === undefined ) {
            return resolve( {
              "errors": {
                "code": 204,
                "message": "Không còn kết quả để hiển thị!"
              },
              "results": {
                "list": null,
                "cursor": null
              }
            } );
          }

          // eslint-disable-next-line one-var
          const listData = await Promise.all( data.jsmods.pre_display_requires.filter( ( item ) => item.includes( "RelayPrefetchedStreamCache" ) ).map( async ( post ) => {
            const feedback = post.filter( ( i ) => Array.isArray( i ) && i.length > 0 )[ 0 ].filter( ( t ) => typeof t === "object" && t.__bbox )[ 0 ].__bbox.result.data.feedback,
              postInfoModal = dataModalPosts.filter( ( item ) => item.unicornStoryID.includes( feedback.share_fbid ) )[ 0 ],
              postInfo = await getPostInfoByModalAPI( { agent, cookie, "storyToken": postInfoModal.storyToken, "unicornStoryID": postInfoModal.unicornStoryID } );

            return {
              "postID": feedback.share_fbid,
              "content": postInfo.results.content,
              "photos": postInfo.results.photos,
              "like": feedback.reaction_count.count,
              "share": feedback.share_count.count
            };
          } ) );


          return resolve( {
            "errors": {
              "code": 200,
              "message": "Lấy danh sách bài viết thành công!"
            },
            "results": {
              "list": listData,
              "cursor": data.jsmods.require.filter( ( item ) => item.includes( "BrowseScrollingPager" ) )[ 0 ].filter( ( item ) => Array.isArray( item ) && item.length > 0 )[ 0 ][ 0 ].cursor
            }
          } );
        }
        return resolve( {
          "errors": {
            "code": 403,
            "message": "Hệ thống xảy ra lỗi trong quá trình request tới facebook. Có thể facebook đã đổi api!"
          },
          "results": null
        } );
      } );
    } );
  },
  handleMultiDataByRecursive = async ( { agent, cookie, cursor, keyword, size, token } ) => {
    let results;

    results = await searchScrapeByAPI( { agent, cookie, cursor, keyword, page, token } );
    listPosts = listPosts.concat( results.results.list );
    if ( results.errors.code === 204 ) {
      return listPosts.filter( ( post ) => post !== undefined && post !== null );
    } else if ( results.errors.code === 200 && listPosts.length < size ) {
      page += 1;
      // eslint-disable-next-line no-unused-expressions
      console.log( page );
      await handleMultiDataByRecursive( { agent, cookie, "cursor": results.results.cursor, keyword, size, token } );
    }
    return listPosts.filter( ( post ) => post !== undefined && post !== null );
  };

module.exports = {
  /**
   * When scrape search facebook, system will get follow scroll page facebook return by api
   * Normally, We will get from two page. Note: two page has three post.
   */
  "searchPostPublic": async ( { agent, cookie, keyword, size } ) => {

    const cursor = process.env.FACEBOOK_APP_CURSOR_DEFAULT,
      token = await getDataTokenSignAgent( { agent, cookie } ),
      results = await handleMultiDataByRecursive( { agent, cookie, cursor, keyword, size, token } );

    // Reset variables global
    listPosts = [];
    page = 2;

    return results;
  }
};
