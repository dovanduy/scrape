module.exports = {
  "getPostByModalUrl": ( storyToken, unicornStoryId ) => {
    return `https://www.facebook.com/search/async/story_modal/?story_token=${encodeURI( storyToken )}&unicorn_story_id=${encodeURI( unicornStoryId )}&browse_location=browse_location%3Abrowse&expand_comments=false`;
  },
  "searchPostPublicUrl": ( cursor, keyword, id, page, token ) => {
    const data = {
      "view": "list",
      "encoded_query": `{\"bqf\":\"keywords_blended_posts(${keyword.trim().replace( " ", "+" )})\",\"browse_sid\":\"40c572c1132abe7e5c14ea877d471290\",\"typeahead_sid\":null,\"vertical\":\"content\",\"post_search_vertical\":null,\"intent_data\":null,\"requestParams\":{\"filter_config\":\"merged_public_posts_see_more\",\"kw_blender_module_dependency_graph_config\":\"merged_public_posts_see_more\",\"kw_blender_wpr_sizing_config\":\"merged_public_posts_see_more_wpr_sizing\",\"no_override_params\":\"[\\\"kw_blender_wpr_sizing_config\\\"]\"},\"has_chrono_sort\":false,\"query_analysis\":null,\"subrequest_disabled\":false,\"token_role\":\"NONE\",\"preloaded_story_ids\":[],\"extra_data\":null,\"disable_main_browse_unicorn\":false,\"entry_point_scope\":null,\"entry_point_surface\":null,\"entry_point_action\":\"FILTERS\",\"squashed_ent_ids\":[],\"source_session_id\":null,\"preloaded_entity_ids\":[],\"preloaded_entity_type\":null,\"use_bootstrap_fallback_results\":false,\"block_preloaded_entity_ids_deduping\":false,\"high_confidence_argument\":null,\"query_source\":null,\"logging_unit_id\":\"browse_serp:df49a1d4-0825-4b8a-9e6a-6974604b66f8\",\"query_title\":null,\"serp_decider_outcome\":null,\"infobox_context\":{\"kgid\":null}}`,
      "encoded_title": "WyJ0aG9pK3RyYW5nIl0",
      "ref": "unknown",
      "logger_source": "www_main",
      "typeahead_sid": "",
      "tl_log": false,
      "impression_id": "0BjPhTEBIEhDYAy6B",
      "filter_ids": {
        "491090238000914:1896453527326147": "491090238000914:1896453527326147",
        "152760764768061:2478604905516957": "152760764768061:2478604905516957"
      },
      "experience_type": "grammar",
      "exclude_ids": null,
      "browse_location": "browse_location:browse",
      "trending_source": null,
      "reaction_surface": null,
      "reaction_session_id": null,
      "ref_path": "/search/posts/",
      "is_trending": false,
      "topic_id": null,
      "place_id": null,
      "story_id": null,
      "callsite": "browse_ui:init_result_set",
      "has_top_pagelet": true,
      "display_params": { "crct": "none", "mrss": true },
      "cursor": cursor,
      "page_number": page,
      "em": false,
      "tr": null
    };

    return `https://www.facebook.com/ajax/pagelet/generic.php/BrowseScrollingSetPagelet?fb_dtsg_ag=${token}&data=${encodeURI( JSON.stringify( data ) )}&__user=${id}&__a=1`;
  }
};
