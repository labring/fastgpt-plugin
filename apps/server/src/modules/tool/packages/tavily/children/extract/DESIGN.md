# Tavily Extract

> Extract web page content from one or more specified URLs using Tavily Extract.

## OpenAPI

````yaml POST /extract
paths:
  path: /extract
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
              urls:
                allOf:
                  - oneOf:
                      - type: string
                        description: The URL to extract content from.
                        example: https://en.wikipedia.org/wiki/Artificial_intelligence
                      - type: array
                        items:
                          type: string
                        description: A list of URLs to extract content from.
                        example:
                          - >-
                            https://en.wikipedia.org/wiki/Artificial_intelligence
                          - https://en.wikipedia.org/wiki/Machine_learning
                          - https://en.wikipedia.org/wiki/Data_science
              include_images:
                allOf:
                  - type: boolean
                    description: >-
                      Include a list of images extracted from the URLs in the
                      response. Default is false.
                    default: false
              include_favicon:
                allOf:
                  - type: boolean
                    description: Whether to include the favicon URL for each result.
                    default: false
              extract_depth:
                allOf:
                  - type: string
                    description: >-
                      The depth of the extraction process. `advanced` extraction
                      retrieves more data, including tables and embedded
                      content, with higher success but may increase
                      latency.`basic` extraction costs 1 credit per 5 successful
                      URL extractions, while `advanced` extraction costs 2
                      credits per 5 successful URL extractions.
                    enum:
                      - basic
                      - advanced
                    default: basic
              format:
                allOf:
                  - type: string
                    description: >-
                      The format of the extracted web page content. `markdown`
                      returns content in markdown format. `text` returns plain
                      text and may increase latency.
                    enum:
                      - markdown
                      - text
                    default: markdown
              timeout:
                allOf:
                  - type: number
                    format: float
                    description: >-
                      Maximum time in seconds to wait for the URL extraction
                      before timing out. Must be between 1.0 and 60.0 seconds.
                      If not specified, default timeouts are applied based on
                      extract_depth: 10 seconds for basic extraction and 30
                      seconds for advanced extraction.
                    minimum: 1
                    maximum: 60
                    default: None
            required: true
            requiredProperties:
              - urls
        examples:
          example:
            value:
              urls: https://en.wikipedia.org/wiki/Artificial_intelligence
              include_images: false
              include_favicon: false
              extract_depth: basic
              format: markdown
              timeout: None
        description: Parameters for the Tavily Extract request.
    codeSamples:
      - label: Python SDK
        lang: python
        source: >-
          from tavily import TavilyClient


          tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

          response =
          tavily_client.extract("https://en.wikipedia.org/wiki/Artificial_intelligence")


          print(response)
      - label: JavaScript SDK
        lang: javascript
        source: >-
          const { tavily } = require("@tavily/core");


          const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

          const response = await
          tvly.extract("https://en.wikipedia.org/wiki/Artificial_intelligence");


          console.log(response);
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              results:
                allOf:
                  - type: array
                    description: A list of extracted content from the provided URLs.
                    items:
                      type: object
                      properties:
                        url:
                          type: string
                          description: The URL from which the content was extracted.
                          example: >-
                            https://en.wikipedia.org/wiki/Artificial_intelligence
                        raw_content:
                          type: string
                          description: The full content extracted from the page.
                          example: >-
                            "Jump to content\nMain
                            menu\nSearch\nAppearance\nDonate\nCreate
                            account\nLog in\nPersonal tools\n        Photograph
                            your local culture, help Wikipedia and win!\nToggle
                            the table of contents\nArtificial intelligence\n161
                            languages\nArticle\nTalk\nRead\nView source\nView
                            history\nTools\nFrom Wikipedia, the free
                            encyclopedia\n\"AI\" redirects here. For other uses,
                            see AI (disambiguation) and Artificial intelligence
                            (disambiguation).\nPart of a series on\nArtificial
                            intelligence (AI)\nshow\nMajor
                            goals\nshow\nApproaches\nshow\nApplications\nshow\nPhilosophy\nshow\nHistory\nshow\nGlossary\nvte\nArtificial
                            intelligence (AI), in its broadest sense, is
                            intelligence exhibited by machines, particularly
                            computer systems. It is a field of research in
                            computer science that develops and studies methods
                            and software that enable machines to perceive their
                            environment and use learning and intelligence to
                            take actions that maximize their chances of
                            achieving defined goals.[1] Such machines may be
                            called AIs.\nHigh-profile applications of AI include
                            advanced web search engines (e.g., Google Search);
                            recommendation systems (used by YouTube, Amazon, and
                            Netflix); virtual assistants (e.g., Google
                            Assistant, Siri, and Alexa); autonomous vehicles
                            (e.g., Waymo); generative and creative tools (e.g.,
                            ChatGPT and AI art); and superhuman play and
                            analysis in strategy games (e.g., chess and
                            Go)...................
                        images:
                          type: array
                          example: []
                          description: >-
                            This is only available if `include_images` is set to
                            `true`. A list of image URLs extracted from the
                            page.
                          items:
                            type: string
                        favicon:
                          type: string
                          description: The favicon URL for the result.
                          example: >-
                            https://en.wikipedia.org/static/favicon/wikipedia.ico
              failed_results:
                allOf:
                  - type: array
                    example: []
                    description: A list of URLs that could not be processed.
                    items:
                      type: object
                      properties:
                        url:
                          type: string
                          description: The URL that failed to be processed.
                        error:
                          type: string
                          description: >-
                            An error message describing why the URL couldn't be
                            processed.
              response_time:
                allOf:
                  - type: number
                    format: float
                    description: Time in seconds it took to complete the request.
                    example: 0.02
              request_id:
                allOf:
                  - type: string
                    description: >-
                      A unique request identifier you can share with customer
                      support to help resolve issues with specific requests.
                    example: 123e4567-e89b-12d3-a456-426614174111
        examples:
          example:
            value:
              results:
                - url: https://en.wikipedia.org/wiki/Artificial_intelligence
                  raw_content: >-
                    "Jump to content\nMain
                    menu\nSearch\nAppearance\nDonate\nCreate account\nLog
                    in\nPersonal tools\n        Photograph your local culture,
                    help Wikipedia and win!\nToggle the table of
                    contents\nArtificial intelligence\n161
                    languages\nArticle\nTalk\nRead\nView source\nView
                    history\nTools\nFrom Wikipedia, the free
                    encyclopedia\n\"AI\" redirects here. For other uses, see AI
                    (disambiguation) and Artificial intelligence
                    (disambiguation).\nPart of a series on\nArtificial
                    intelligence (AI)\nshow\nMajor
                    goals\nshow\nApproaches\nshow\nApplications\nshow\nPhilosophy\nshow\nHistory\nshow\nGlossary\nvte\nArtificial
                    intelligence (AI), in its broadest sense, is intelligence
                    exhibited by machines, particularly computer systems. It is
                    a field of research in computer science that develops and
                    studies methods and software that enable machines to
                    perceive their environment and use learning and intelligence
                    to take actions that maximize their chances of achieving
                    defined goals.[1] Such machines may be called
                    AIs.\nHigh-profile applications of AI include advanced web
                    search engines (e.g., Google Search); recommendation systems
                    (used by YouTube, Amazon, and Netflix); virtual assistants
                    (e.g., Google Assistant, Siri, and Alexa); autonomous
                    vehicles (e.g., Waymo); generative and creative tools (e.g.,
                    ChatGPT and AI art); and superhuman play and analysis in
                    strategy games (e.g., chess and Go)...................
                  images: []
                  favicon: https://en.wikipedia.org/static/favicon/wikipedia.ico
              failed_results: []
              response_time: 0.02
              request_id: 123e4567-e89b-12d3-a456-426614174111
        description: Extraction results returned successfully
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
                error: <400 Bad Request, (e.g Max 20 URLs are allowed.)>
        description: Bad Request
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
