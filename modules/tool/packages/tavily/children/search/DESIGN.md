# Tavily Search

> Execute a search query using Tavily Search.

## OpenAPI

````yaml POST /search
paths:
  path: /search
  method: post
  servers:
    - url: https://api.tavily.com/
  request:
    security:
      - title: bearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                Bearer authentication header in the form Bearer <token>, where
                <token> is your Tavily API key (e.g., Bearer tvly-YOUR_API_KEY).
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              query:
                allOf:
                  - type: string
                    description: The search query to execute with Tavily.
                    example: who is Leo Messi?
              auto_parameters:
                allOf:
                  - type: boolean
                    description: >-
                      When `auto_parameters` is enabled, Tavily automatically
                      configures search parameters based on your query's content
                      and intent. You can still set other parameters manually,
                      and your explicit values will override the automatic ones.
                      The parameters `include_answer`, `include_raw_content`,
                      and `max_results` must always be set manually, as they
                      directly affect response size. Note: `search_depth` may be
                      automatically set to advanced when it's likely to improve
                      results. This uses 2 API credits per request. To avoid the
                      extra cost, you can explicitly set `search_depth` to
                      `basic`. Currently in beta.
                    default: false
              topic:
                allOf:
                  - type: string
                    description: >-
                      The category of the search.`news` is useful for retrieving
                      real-time updates, particularly about politics, sports,
                      and major current events covered by mainstream media
                      sources. `general` is for broader, more general-purpose
                      searches that may include a wide range of sources.
                    default: general
                    enum:
                      - general
                      - news
                      - finance
              search_depth:
                allOf:
                  - type: string
                    description: >-
                      The depth of the search. `advanced` search is tailored to
                      retrieve the most relevant sources and `content` snippets
                      for your query, while `basic` search provides generic
                      content snippets from each source. A `basic` search costs
                      1 API Credit, while an `advanced` search costs 2 API
                      Credits.
                    enum:
                      - basic
                      - advanced
                    default: basic
              chunks_per_source:
                allOf:
                  - type: integer
                    description: >-
                      Chunks are short content snippets (maximum 500 characters
                      each) pulled directly from the source. Use
                      `chunks_per_source` to define the maximum number of
                      relevant chunks returned per source and to control the
                      `content` length. Chunks will appear in the `content`
                      field as: `<chunk 1> [...] <chunk 2> [...] <chunk 3>`.
                      Available only when `search_depth` is `advanced`.
                    default: 3
                    minimum: 1
                    maximum: 3
              max_results:
                allOf:
                  - type: integer
                    example: 1
                    description: The maximum number of search results to return.
                    default: 5
                    minimum: 0
                    maximum: 20
              time_range:
                allOf:
                  - type: string
                    description: >-
                      The time range back from the current date to filter
                      results based on publish date or last updated date. Useful
                      when looking for sources that have published or updated
                      data.
                    enum:
                      - day
                      - week
                      - month
                      - year
                      - d
                      - w
                      - m
                      - 'y'
                    default: null
              start_date:
                allOf:
                  - type: string
                    description: >-
                      Will return all results after the specified start date
                      based on publish date or last updated date. Required to be
                      written in the format YYYY-MM-DD
                    example: '2025-02-09'
                    default: null
              end_date:
                allOf:
                  - type: string
                    description: >-
                      Will return all results before the specified end date
                      based on publish date or last updated date. Required to be
                      written in the format YYYY-MM-DD
                    example: '2025-12-29'
                    default: null
              include_answer:
                allOf:
                  - oneOf:
                      - type: boolean
                      - type: string
                        enum:
                          - basic
                          - advanced
                    description: >-
                      Include an LLM-generated answer to the provided query.
                      `basic` or `true` returns a quick answer. `advanced`
                      returns a more detailed answer.
                    default: false
              include_raw_content:
                allOf:
                  - oneOf:
                      - type: boolean
                      - type: string
                        enum:
                          - markdown
                          - text
                    description: >-
                      Include the cleaned and parsed HTML content of each search
                      result. `markdown` or `true` returns search result content
                      in markdown format. `text` returns the plain text from the
                      results and may increase latency.
                    default: false
              include_images:
                allOf:
                  - type: boolean
                    description: >-
                      Also perform an image search and include the results in
                      the response.
                    default: false
              include_image_descriptions:
                allOf:
                  - type: boolean
                    description: >-
                      When `include_images` is `true`, also add a descriptive
                      text for each image.
                    default: false
              include_favicon:
                allOf:
                  - type: boolean
                    description: Whether to include the favicon URL for each result.
                    default: false
              include_domains:
                allOf:
                  - type: array
                    description: >-
                      A list of domains to specifically include in the search
                      results. Maximum 300 domains.
                    items:
                      type: string
                    default: []
              exclude_domains:
                allOf:
                  - type: array
                    description: >-
                      A list of domains to specifically exclude from the search
                      results. Maximum 150 domains.
                    items:
                      type: string
                    default: []
              country:
                allOf:
                  - type: string
                    description: >-
                      Boost search results from a specific country. This will
                      prioritize content from the selected country in the search
                      results. Available only if topic is `general`.
                    enum:
                      - afghanistan
                      - albania
                      - algeria
                      - andorra
                      - angola
                      - argentina
                      - armenia
                      - australia
                      - austria
                      - azerbaijan
                      - bahamas
                      - bahrain
                      - bangladesh
                      - barbados
                      - belarus
                      - belgium
                      - belize
                      - benin
                      - bhutan
                      - bolivia
                      - bosnia and herzegovina
                      - botswana
                      - brazil
                      - brunei
                      - bulgaria
                      - burkina faso
                      - burundi
                      - cambodia
                      - cameroon
                      - canada
                      - cape verde
                      - central african republic
                      - chad
                      - chile
                      - china
                      - colombia
                      - comoros
                      - congo
                      - costa rica
                      - croatia
                      - cuba
                      - cyprus
                      - czech republic
                      - denmark
                      - djibouti
                      - dominican republic
                      - ecuador
                      - egypt
                      - el salvador
                      - equatorial guinea
                      - eritrea
                      - estonia
                      - ethiopia
                      - fiji
                      - finland
                      - france
                      - gabon
                      - gambia
                      - georgia
                      - germany
                      - ghana
                      - greece
                      - guatemala
                      - guinea
                      - haiti
                      - honduras
                      - hungary
                      - iceland
                      - india
                      - indonesia
                      - iran
                      - iraq
                      - ireland
                      - israel
                      - italy
                      - jamaica
                      - japan
                      - jordan
                      - kazakhstan
                      - kenya
                      - kuwait
                      - kyrgyzstan
                      - latvia
                      - lebanon
                      - lesotho
                      - liberia
                      - libya
                      - liechtenstein
                      - lithuania
                      - luxembourg
                      - madagascar
                      - malawi
                      - malaysia
                      - maldives
                      - mali
                      - malta
                      - mauritania
                      - mauritius
                      - mexico
                      - moldova
                      - monaco
                      - mongolia
                      - montenegro
                      - morocco
                      - mozambique
                      - myanmar
                      - namibia
                      - nepal
                      - netherlands
                      - new zealand
                      - nicaragua
                      - niger
                      - nigeria
                      - north korea
                      - north macedonia
                      - norway
                      - oman
                      - pakistan
                      - panama
                      - papua new guinea
                      - paraguay
                      - peru
                      - philippines
                      - poland
                      - portugal
                      - qatar
                      - romania
                      - russia
                      - rwanda
                      - saudi arabia
                      - senegal
                      - serbia
                      - singapore
                      - slovakia
                      - slovenia
                      - somalia
                      - south africa
                      - south korea
                      - south sudan
                      - spain
                      - sri lanka
                      - sudan
                      - sweden
                      - switzerland
                      - syria
                      - taiwan
                      - tajikistan
                      - tanzania
                      - thailand
                      - togo
                      - trinidad and tobago
                      - tunisia
                      - turkey
                      - turkmenistan
                      - uganda
                      - ukraine
                      - united arab emirates
                      - united kingdom
                      - united states
                      - uruguay
                      - uzbekistan
                      - venezuela
                      - vietnam
                      - yemen
                      - zambia
                      - zimbabwe
                    default: null
            required: true
            requiredProperties:
              - query
        examples:
          example:
            value:
              query: who is Leo Messi?
              auto_parameters: false
              topic: general
              search_depth: basic
              chunks_per_source: 3
              max_results: 1
              time_range: null
              start_date: '2025-02-09'
              end_date: '2025-12-29'
              include_answer: true
              include_raw_content: true
              include_images: false
              include_image_descriptions: false
              include_favicon: false
              include_domains: []
              exclude_domains: []
              country: null
        description: Parameters for the Tavily Search request.
    codeSamples:
      - label: Python SDK
        lang: python
        source: |-
          from tavily import TavilyClient

          tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")
          response = tavily_client.search("Who is Leo Messi?")

          print(response)
      - label: JavaScript SDK
        lang: javascript
        source: |-
          const { tavily } = require("@tavily/core");

          const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
          const response = await tvly.search("Who is Leo Messi?");

          console.log(response);
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              query:
                allOf:
                  - type: string
                    description: The search query that was executed.
                    example: Who is Leo Messi?
              answer:
                allOf:
                  - type: string
                    description: >-
                      A short answer to the user's query, generated by an LLM.
                      Included in the response only if `include_answer` is
                      requested (i.e., set to `true`, `basic`, or `advanced`)
                    example: >-
                      Lionel Messi, born in 1987, is an Argentine footballer
                      widely regarded as one of the greatest players of his
                      generation. He spent the majority of his career playing
                      for FC Barcelona, where he won numerous domestic league
                      titles and UEFA Champions League titles. Messi is known
                      for his exceptional dribbling skills, vision, and
                      goal-scoring ability. He has won multiple FIFA Ballon d'Or
                      awards, numerous La Liga titles with Barcelona, and holds
                      the record for most goals scored in a calendar year. In
                      2014, he led Argentina to the World Cup final, and in
                      2015, he helped Barcelona capture another treble. Despite
                      turning 36 in June, Messi remains highly influential in
                      the sport.
              images:
                allOf:
                  - type: array
                    description: >-
                      List of query-related images. If
                      `include_image_descriptions` is true, each item will have
                      `url` and `description`.
                    example: []
                    items:
                      type: object
                      properties:
                        url:
                          type: string
                        description:
                          type: string
              results:
                allOf:
                  - type: array
                    description: A list of sorted search results, ranked by relevancy.
                    items:
                      type: object
                      properties:
                        title:
                          type: string
                          description: The title of the search result.
                          example: Lionel Messi Facts | Britannica
                        url:
                          type: string
                          description: The URL of the search result.
                          example: https://www.britannica.com/facts/Lionel-Messi
                        content:
                          type: string
                          description: A short description of the search result.
                          example: >-
                            Lionel Messi, an Argentine footballer, is widely
                            regarded as one of the greatest football players of
                            his generation. Born in 1987, Messi spent the
                            majority of his career playing for Barcelona, where
                            he won numerous domestic league titles and UEFA
                            Champions League titles. Messi is known for his
                            exceptional dribbling skills, vision, and goal
                        score:
                          type: number
                          format: float
                          description: The relevance score of the search result.
                          example: 0.81025416
                        raw_content:
                          type: string
                          description: >-
                            The cleaned and parsed HTML content of the search
                            result. Only if `include_raw_content` is true.
                          example: null
                        favicon:
                          type: string
                          description: The favicon URL for the result.
                          example: https://britannica.com/favicon.png
              auto_parameters:
                allOf:
                  - type: object
                    description: >-
                      A dictionary of the selected auto_parameters, only shown
                      when `auto_parameters` is true.
                    example:
                      topic: general
                      search_depth: basic
              response_time:
                allOf:
                  - type: number
                    format: float
                    description: Time in seconds it took to complete the request.
                    example: '1.67'
              request_id:
                allOf:
                  - type: string
                    description: >-
                      A unique request identifier you can share with customer
                      support to help resolve issues with specific requests.
                    example: 123e4567-e89b-12d3-a456-426614174111
            requiredProperties:
              - query
              - results
              - images
              - response_time
              - answer
        examples:
          example:
            value:
              query: Who is Leo Messi?
              answer: >-
                Lionel Messi, born in 1987, is an Argentine footballer widely
                regarded as one of the greatest players of his generation. He
                spent the majority of his career playing for FC Barcelona, where
                he won numerous domestic league titles and UEFA Champions League
                titles. Messi is known for his exceptional dribbling skills,
                vision, and goal-scoring ability. He has won multiple FIFA
                Ballon d'Or awards, numerous La Liga titles with Barcelona, and
                holds the record for most goals scored in a calendar year. In
                2014, he led Argentina to the World Cup final, and in 2015, he
                helped Barcelona capture another treble. Despite turning 36 in
                June, Messi remains highly influential in the sport.
              images: []
              results:
                - title: Lionel Messi Facts | Britannica
                  url: https://www.britannica.com/facts/Lionel-Messi
                  content: >-
                    Lionel Messi, an Argentine footballer, is widely regarded as
                    one of the greatest football players of his generation. Born
                    in 1987, Messi spent the majority of his career playing for
                    Barcelona, where he won numerous domestic league titles and
                    UEFA Champions League titles. Messi is known for his
                    exceptional dribbling skills, vision, and goal
                  score: 0.81025416
                  raw_content: null
                  favicon: https://britannica.com/favicon.png
              auto_parameters:
                topic: general
                search_depth: basic
              response_time: '1.67'
              request_id: 123e4567-e89b-12d3-a456-426614174111
        description: Search results returned successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              detail:
                allOf:
                  - type: object
                    properties:
                      error:
                        type: string
        examples:
          example:
            value:
              detail:
                error: >-
                  <400 Bad Request, (e.g Invalid topic. Must be 'general' or
                  'news'.)>
        description: Bad Request - Your request is invalid.
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              detail:
                allOf:
                  - type: object
                    properties:
                      error:
                        type: string
        examples:
          example:
            value:
              detail:
                error: 'Unauthorized: missing or invalid API key.'
        description: Unauthorized - Your API key is wrong or missing.
    '429':
      application/json:
        schemaArray:
          - type: object
            properties:
              detail:
                allOf:
                  - type: object
                    properties:
                      error:
                        type: string
        examples:
          example:
            value:
              detail:
                error: >-
                  Your request has been blocked due to excessive requests.
                  Please reduce rate of requests.
        description: Too many requests - Rate limit exceeded
    '432':
      application/json:
        schemaArray:
          - type: object
            properties:
              detail:
                allOf:
                  - type: object
                    properties:
                      error:
                        type: string
        examples:
          example:
            value:
              detail:
                error: >-
                  <432 Custom Forbidden Error (e.g This request exceeds your
                  plan's set usage limit. Please upgrade your plan or contact
                  support@tavily.com)>
        description: Key limit or Plan Limit exceeded
    '433':
      application/json:
        schemaArray:
          - type: object
            properties:
              detail:
                allOf:
                  - type: object
                    properties:
                      error:
                        type: string
        examples:
          example:
            value:
              detail:
                error: >-
                  This request exceeds the pay-as-you-go limit. You can increase
                  your limit on the Tavily dashboard.
        description: PayGo limit exceeded
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              detail:
                allOf:
                  - type: object
                    properties:
                      error:
                        type: string
        examples:
          example:
            value:
              detail:
                error: Internal Server Error
        description: Internal Server Error - We had a problem with our server.
  deprecated: false
  type: path
components:
  schemas: {}

````
