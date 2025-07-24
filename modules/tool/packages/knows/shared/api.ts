import type {
  KnowsConfig,
  ApiResponse,
  ErrorResponse,
  AiSearchRequest,
  AiSearchResponse,
  EvidenceSummaryRequest,
  EvidenceSummaryResponse,
  AllEvidenceSummaryRequest,
  EvidenceHighlightRequest,
  EvidenceHighlightResponse,
  AnswerRequest,
  AnswerResponse,
  EvidenceDetailRequest,
  PaperEnResponse,
  PaperCnResponse,
  GuideResponse,
  MeetingResponse,
  ListQuestionRequest,
  ListQuestionResponse,
  ListInterpretationRequest,
  ListInterpretationResponse,
  CreateEvidenceRequest,
  CreateEvidenceResponse,
  AutoTaggingRequest,
  AutoTaggingResponse
} from './types';

/**
 * KnowS API 客户端
 * 提供所有 API 接口的统一调用方法
 */
export class KnowsApiClient {
  private config: KnowsConfig;

  constructor(config: KnowsConfig) {
    this.config = config;
  }

  /**
   * 通用 API 请求方法
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    // 增加请求日志
    console.log(`[KnowS API] 请求: ${options.method || 'GET'} ${url}`);
    if (options.body && typeof options.body === 'string') {
      console.log(`[KnowS API] 请求体:`, JSON.parse(options.body));
    }

    try {
      const response = await fetch(url, requestOptions);

      console.log(`[KnowS API] 响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // 增强错误处理：先尝试获取响应文本，再尝试解析JSON
        let errorData: ErrorResponse;
        try {
          const responseText = await response.text();
          console.log(`[KnowS API] 错误响应文本:`, responseText);

          if (responseText) {
            try {
              const parsedError = JSON.parse(responseText);
              errorData = {
                code: parsedError.code || response.status,
                msg: parsedError.msg || parsedError.message || response.statusText,
                error: parsedError.error
              };
            } catch (parseError) {
              // JSON 解析失败，使用响应文本作为错误信息
              errorData = {
                code: response.status,
                msg: responseText || response.statusText
              };
            }
          } else {
            // 响应为空
            errorData = {
              code: response.status,
              msg: response.statusText || `HTTP ${response.status} Error`
            };
          }
        } catch (readError) {
          // 读取响应失败
          console.error(`[KnowS API] 读取错误响应失败:`, readError);
          errorData = {
            code: response.status,
            msg: response.statusText || `HTTP ${response.status} Error`
          };
        }

        const errorMessage = `API Error ${errorData.code}: ${errorData.msg}`;
        console.error(`[KnowS API] ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        return response as unknown as T;
      }

      const responseText = await response.text();
      console.log(`[KnowS API] 响应内容长度: ${responseText.length} 字符`);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[KnowS API] JSON 解析失败:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
      }

      // 检查业务错误码
      if (data.code && data.code !== 0) {
        const businessError = `Business Error ${data.code}: ${data.msg || 'Unknown business error'}`;
        console.error(`[KnowS API] ${businessError}`);
        throw new Error(businessError);
      }

      console.log(`[KnowS API] 请求成功`);
      return data.data || data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[KnowS API] 请求失败:`, error.message);
        throw error;
      }
      const unknownError = `Request failed: ${error}`;
      console.error(`[KnowS API] ${unknownError}`);
      throw new Error(unknownError);
    }
  }

  // ===== 检索相关接口 =====

  /**
   * AI 检索证据列表
   */
  async aiSearch(request: AiSearchRequest): Promise<AiSearchResponse> {
    return this.request<AiSearchResponse>('/knows/ai_search', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // ===== 分析相关接口 =====

  /**
   * 单篇证据 AI 总结
   */
  async getEvidenceSummary(request: EvidenceSummaryRequest): Promise<EvidenceSummaryResponse> {
    return this.request<EvidenceSummaryResponse>('/knows/evidence/summary', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * 所有证据总结（流式）
   */
  async getAllEvidenceSummaryStream(request: AllEvidenceSummaryRequest): Promise<Response> {
    return this.request<Response>('/knows/all_evidence_summary/stream', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * 单篇证据被引内容
   */
  async getEvidenceHighlight(
    request: EvidenceHighlightRequest
  ): Promise<EvidenceHighlightResponse> {
    return this.request<EvidenceHighlightResponse>('/knows/evidence/highlight', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // ===== 总结相关接口 =====

  /**
   * 场景总结
   */
  async getAnswer(request: AnswerRequest): Promise<AnswerResponse> {
    return this.request<AnswerResponse>('/knows/answer', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * 场景总结（流式）
   */
  async getAnswerStream(request: AnswerRequest): Promise<Response> {
    return this.request<Response>('/knows/answer/stream', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // ===== 详情相关接口 =====

  /**
   * 英文文献详情
   */
  async getPaperEn(request: EvidenceDetailRequest): Promise<PaperEnResponse> {
    return this.request<PaperEnResponse>('/knows/evidence/get_paper_en', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * 中文文献详情
   */
  async getPaperCn(request: EvidenceDetailRequest): Promise<PaperCnResponse> {
    return this.request<PaperCnResponse>('/knows/evidence/get_paper_cn', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * 指南详情
   */
  async getGuide(request: EvidenceDetailRequest): Promise<GuideResponse> {
    return this.request<GuideResponse>('/knows/evidence/get_guide', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * 会议详情
   */
  async getMeeting(request: EvidenceDetailRequest): Promise<MeetingResponse> {
    return this.request<MeetingResponse>('/knows/evidence/get_meeting', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // ===== 历史记录相关接口 =====

  /**
   * 获取问题列表
   */
  async listQuestions(request: ListQuestionRequest = {}): Promise<ListQuestionResponse> {
    return this.request<ListQuestionResponse>('/knows/list_question', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * 获取文献解读列表
   */
  async listInterpretations(
    request: ListInterpretationRequest = {}
  ): Promise<ListInterpretationResponse> {
    return this.request<ListInterpretationResponse>('/knows/list_interpretion', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // ===== 内容管理相关接口 =====

  /**
   * 创建 Evidence（PDF 上传）
   */
  async createEvidenceByPdf(request: CreateEvidenceRequest): Promise<CreateEvidenceResponse> {
    const formData = new FormData();
    formData.append('pdf_file', new Blob([request.pdf_file]));

    return this.request<CreateEvidenceResponse>('/knows/create_evidence_by_pdf_file', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey
        // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
      },
      body: formData
    });
  }

  /**
   * 自动化标签
   */
  async autoTagging(request: AutoTaggingRequest): Promise<AutoTaggingResponse> {
    return this.request<AutoTaggingResponse>('/knows/auto_tagging', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }
}

/**
 * 创建 KnowS API 客户端实例
 */
export function createKnowsClient(config: KnowsConfig): KnowsApiClient {
  return new KnowsApiClient(config);
}
