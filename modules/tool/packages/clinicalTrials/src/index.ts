import { z } from 'zod';

// ClinicalTrials.gov API v2 基础URL
const CLINICAL_TRIALS_API_BASE = 'https://beta-ut.clinicaltrials.gov/api/v2/studies';

// 输入参数类型定义
export const InputType = z.object({
  query: z.string().min(1, '查询关键词不能为空'),
  phases: z.union([z.string(), z.array(z.string())]).optional(), // 试验阶段，支持字符串（逗号分隔）或数组
  status: z.union([z.string(), z.array(z.string())]).optional(), // 试验状态，支持字符串（逗号分隔）或数组
  location: z.string().optional(), // 地理位置
  startDate: z.string().optional(), // 开始日期 YYYY-MM-DD
  pageSize: z.number().min(1).max(1000).optional().default(200) // 返回数量，默认200，最大1000
});

// 输出参数类型定义
export const OutputType = z.object({
  result: z.string(), // 格式化的查询结果
  totalCount: z.number(), // 试验总数
  summary: z.string() // 查询摘要
});

// 中文疾病名称到英文的映射
const DISEASE_TRANSLATION_MAP: Record<string, string> = {
  胰腺癌: 'pancreatic cancer',
  胰腺腺癌: 'pancreatic adenocarcinoma',
  胰腺导管腺癌: 'pancreatic ductal adenocarcinoma',
  胰腺肿瘤: 'pancreatic tumor',
  乳腺癌: 'breast cancer',
  乳腺肿瘤: 'breast tumor',
  肺癌: 'lung cancer',
  肝癌: 'liver cancer',
  胃癌: 'gastric cancer',
  结直肠癌: 'colorectal cancer',
  前列腺癌: 'prostate cancer',
  卵巢癌: 'ovarian cancer',
  宫颈癌: 'cervical cancer',
  白血病: 'leukemia',
  淋巴瘤: 'lymphoma',
  黑色素瘤: 'melanoma'
};

// 试验阶段映射
const PHASE_MAP: Record<string, string> = {
  '0': '0',
  EARLY_PHASE1: '0',
  早期1期: '0',
  '1': '1',
  PHASE1: '1',
  '1期': '1',
  '2': '2',
  PHASE2: '2',
  '2期': '2',
  '3': '3',
  PHASE3: '3',
  '3期': '3',
  '4': '4',
  PHASE4: '4',
  '4期': '4'
};

// 试验状态映射
const STATUS_MAP: Record<string, string> = {
  RECRUITING: 'RECRUITING',
  招募中: 'RECRUITING',
  ACTIVE_NOT_RECRUITING: 'ACTIVE_NOT_RECRUITING',
  活跃不招募: 'ACTIVE_NOT_RECRUITING',
  NOT_YET_RECRUITING: 'NOT_YET_RECRUITING',
  尚未招募: 'NOT_YET_RECRUITING',
  COMPLETED: 'COMPLETED',
  已完成: 'COMPLETED',
  SUSPENDED: 'SUSPENDED',
  暂停: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
  终止: 'TERMINATED',
  WITHDRAWN: 'WITHDRAWN',
  撤回: 'WITHDRAWN'
};

// translateQuery函数已移除，直接使用原始查询词

/**
 * 解析试验阶段参数
 * 支持字符串（逗号分隔）和数组两种格式
 */
function parsePhases(phases?: string | string[]): string[] {
  if (!phases) return [];

  // 如果是数组，直接处理
  if (Array.isArray(phases)) {
    return phases
      .map((phase) => {
        const trimmed = phase.trim();
        return PHASE_MAP[trimmed] || trimmed;
      })
      .filter(Boolean);
  }

  // 如果是字符串，按逗号分割后处理
  return phases
    .split(',')
    .map((phase) => {
      const trimmed = phase.trim();
      return PHASE_MAP[trimmed] || trimmed;
    })
    .filter(Boolean);
}

/**
 * 解析试验状态参数
 * 支持字符串（逗号分隔）和数组两种格式
 */
function parseStatus(status?: string | string[]): string[] {
  if (!status) return ['RECRUITING']; // 默认只查询招募中的试验

  // 如果是数组，直接处理
  if (Array.isArray(status)) {
    return status
      .map((s) => {
        const trimmed = s.trim();
        return STATUS_MAP[trimmed] || trimmed;
      })
      .filter(Boolean);
  }

  // 如果是字符串，按逗号分割后处理
  return status
    .split(',')
    .map((s) => {
      const trimmed = s.trim();
      return STATUS_MAP[trimmed] || trimmed;
    })
    .filter(Boolean);
}

/**
 * 构建API查询参数
 */
function buildQueryParams(input: z.infer<typeof InputType>): URLSearchParams {
  const params = new URLSearchParams();

  // 基础参数
  params.set('format', 'json');
  params.set('markupFormat', 'markdown');
  params.set('countTotal', 'true');
  params.set('pageSize', input.pageSize?.toString() || '200');

  // 查询条件 - 根据用户提供的正确API格式使用query.cond参数
  // 参考: https://beta-ut.clinicaltrials.gov/api/v2/studies?query.cond=pancreatic+cancer+KRAS
  const queryTerm = input.query;
  if (queryTerm) {
    // 使用query.cond参数进行疾病条件搜索，支持多个关键词用空格或+号连接
    params.set('query.cond', queryTerm.replace(/\s+/g, '+'));
  }

  // 地理位置
  if (input.location) {
    params.set('query.locn', input.location);
  }

  // 试验状态 - 使用正确的参数名称
  const statusList = parseStatus(input.status);
  if (statusList.length > 0) {
    params.set('filter.overallStatus', statusList.join(','));
  }

  // 试验阶段过滤
  const phaseList = parsePhases(input.phases);
  if (phaseList.length > 0) {
    params.set('filter.phase', phaseList.join(','));
  }

  // 日期过滤 - 使用更简单的格式
  if (input.startDate) {
    params.set('filter.studyFirstPostDate', `${input.startDate}:MAX`);
  }

  return params;
}

/**
 * 格式化单个试验信息
 */
function formatStudy(study: any): string {
  const protocolSection = study.protocolSection || {};
  const identificationModule = protocolSection.identificationModule || {};
  const statusModule = protocolSection.statusModule || {};
  const designModule = protocolSection.designModule || {};
  const armsInterventionsModule = protocolSection.armsInterventionsModule || {};
  const contactsLocationsModule = protocolSection.contactsLocationsModule || {};
  const sponsorCollaboratorsModule = protocolSection.sponsorCollaboratorsModule || {};

  const nctId = identificationModule.nctId || 'N/A';
  const briefTitle = identificationModule.briefTitle || 'N/A';
  const officialTitle = identificationModule.officialTitle || briefTitle;
  const overallStatus = statusModule.overallStatus || 'N/A';
  const phase = designModule.phases?.[0] || 'N/A';
  const studyType = designModule.studyType || 'N/A';

  // 疾病条件
  const conditions = protocolSection.conditionsModule?.conditions || [];
  const conditionsText = conditions.length > 0 ? conditions.join(', ') : 'N/A';

  // 干预措施
  const interventions = armsInterventionsModule.interventions || [];
  const interventionsText =
    interventions
      .map((intervention: any) => `${intervention.name || 'N/A'} (${intervention.type || 'N/A'})`)
      .join(', ') || 'N/A';

  // 发起方
  const leadSponsor = sponsorCollaboratorsModule.leadSponsor?.name || 'N/A';

  // 重要日期
  const startDate = statusModule.startDateStruct?.date || 'N/A';
  const completionDate =
    statusModule.primaryCompletionDateStruct?.date ||
    statusModule.completionDateStruct?.date ||
    'N/A';
  const lastUpdate = statusModule.lastUpdatePostDate || 'N/A';

  // 联系信息
  const centralContacts = contactsLocationsModule.centralContacts || [];
  const contactInfo =
    centralContacts
      .map(
        (contact: any) =>
          `${contact.name || 'N/A'} (${contact.role || 'N/A'}) - ${contact.phone || contact.email || 'N/A'}`
      )
      .join('; ') || 'N/A';

  // 试验地点
  const locations = contactsLocationsModule.locations || [];
  const locationInfo =
    locations
      .slice(0, 3)
      .map(
        (location: any) =>
          `${location.facility || 'N/A'}, ${location.city || 'N/A'}, ${location.country || 'N/A'}`
      )
      .join('; ') || 'N/A';

  return `
## ${briefTitle}

**试验编号**: ${nctId}  
**正式标题**: ${officialTitle}  
**疾病条件**: ${conditionsText}  
**试验状态**: ${overallStatus}  
**试验阶段**: ${phase}  
**试验类型**: ${studyType}  
**干预措施**: ${interventionsText}  
**发起方**: ${leadSponsor}  
**开始日期**: ${startDate}  
**完成日期**: ${completionDate}  
**最后更新**: ${lastUpdate}  
**联系信息**: ${contactInfo}  
**试验地点**: ${locationInfo}  
**详情链接**: https://clinicaltrials.gov/study/${nctId}

---
`;
}

/**
 * 自然语言查询解析函数
 * 从自然语言查询中提取关键信息并更新输入参数
 */
function parseNaturalLanguageQuery(input: z.infer<typeof InputType>): z.infer<typeof InputType> {
  const query = input.query.toLowerCase();
  const result = { ...input };

  // 提取试验阶段信息
  const phasePatterns = [
    { pattern: /[iⅰ一1]期|phase\s*[i1]|early\s*phase/i, value: 'PHASE1' },
    { pattern: /[iiⅱ二2]期|phase\s*[ii2]/i, value: 'PHASE2' },
    { pattern: /[iiiⅲ三3]期|phase\s*[iii3]/i, value: 'PHASE3' },
    { pattern: /[ivⅳ四4]期|phase\s*[iv4]/i, value: 'PHASE4' },
    { pattern: /早期|early/i, value: 'EARLY_PHASE1' }
  ];

  for (const { pattern, value } of phasePatterns) {
    if (pattern.test(query) && !result.phases) {
      result.phases = [value]; // 修改为数组格式，与类型定义保持一致
      break;
    }
  }

  // 提取试验状态信息
  const statusPatterns = [
    { pattern: /招募中|正在招募|recruiting/i, value: 'RECRUITING' },
    { pattern: /即将开始|not yet recruiting/i, value: 'NOT_YET_RECRUITING' },
    { pattern: /已完成|completed/i, value: 'COMPLETED' },
    { pattern: /暂停|suspended/i, value: 'SUSPENDED' },
    { pattern: /终止|terminated/i, value: 'TERMINATED' },
    { pattern: /撤回|withdrawn/i, value: 'WITHDRAWN' }
  ];

  for (const { pattern, value } of statusPatterns) {
    if (pattern.test(query) && !result.status) {
      result.status = [value]; // 修改为数组格式，与类型定义保持一致
      break;
    }
  }

  // 提取地理位置信息
  const locationPatterns = [
    { pattern: /中国|china/i, value: 'China' },
    { pattern: /美国|united states|usa/i, value: 'United States' },
    { pattern: /日本|japan/i, value: 'Japan' },
    { pattern: /韩国|south korea|korea/i, value: 'Korea, Republic of' },
    { pattern: /英国|united kingdom|uk/i, value: 'United Kingdom' },
    { pattern: /德国|germany/i, value: 'Germany' },
    { pattern: /法国|france/i, value: 'France' },
    { pattern: /加拿大|canada/i, value: 'Canada' },
    { pattern: /澳大利亚|australia/i, value: 'Australia' }
  ];

  for (const { pattern, value } of locationPatterns) {
    if (pattern.test(query) && !result.location) {
      result.location = value;
      break;
    }
  }

  // 提取时间范围信息
  const timePatterns = [
    { pattern: /最近(\d+)天|past\s*(\d+)\s*days/i, days: 'match' },
    { pattern: /最近一周|past week/i, days: 7 },
    { pattern: /最近一个月|past month/i, days: 30 },
    { pattern: /最近三个月|past 3 months/i, days: 90 },
    { pattern: /最近半年|past 6 months/i, days: 180 },
    { pattern: /最近一年|past year/i, days: 365 }
  ];

  for (const { pattern, days } of timePatterns) {
    const match = query.match(pattern);
    if (match && !result.startDate) {
      const daysBack = days === 'match' ? parseInt(match[1] || match[2]) : (days as number);
      if (!isNaN(daysBack) && daysBack > 0) {
        const date = new Date();
        date.setDate(date.getDate() - daysBack);
        result.startDate = date.toISOString().split('T')[0];
        break;
      }
    }
  }

  // 提取返回数量信息
  const countPattern = /返回(\d+)个|show\s*(\d+)|limit\s*(\d+)/i;
  const countMatch = query.match(countPattern);
  if (countMatch && !result.pageSize) {
    const count = parseInt(countMatch[1] || countMatch[2] || countMatch[3]);
    if (count > 0 && count <= 1000) {
      result.pageSize = count;
    }
  }

  // 清理查询词，移除已提取的参数信息，保留核心疾病/药物关键词
  let cleanQuery = result.query;

  // 移除时间相关词汇
  cleanQuery = cleanQuery.replace(
    /最近\d+天|最近一?[周月年]|past\s+\d+\s+days?|past\s+week|past\s+months?|past\s+years?/gi,
    ''
  );

  // 移除状态相关词汇
  cleanQuery = cleanQuery.replace(
    /招募中|正在招募|即将开始|已完成|暂停|终止|撤回|recruiting|not yet recruiting|completed|suspended|terminated|withdrawn/gi,
    ''
  );

  // 移除阶段相关词汇
  cleanQuery = cleanQuery.replace(
    /[iⅰ一1234iiⅱ二iiiⅲ三ivⅳ四]期|phase\s*[i1234iv]+|早期|early\s*phase/gi,
    ''
  );

  // 移除地理位置词汇
  cleanQuery = cleanQuery.replace(
    /中国|美国|日本|韩国|英国|德国|法国|加拿大|澳大利亚|china|usa|united\s+states|japan|korea|united\s+kingdom|germany|france|canada|australia/gi,
    ''
  );

  // 移除数量相关词汇
  cleanQuery = cleanQuery.replace(/返回\d+个|show\s*\d+|limit\s*\d+/gi, '');

  // 移除常见的连接词和疑问词
  cleanQuery = cleanQuery.replace(
    /请查询|查询|有哪些|的|在|方案|试验|临床|请|下|中|最近|哪些|什么|how many|what|which|trials?|studies?|clinical/gi,
    ''
  );

  // 清理多余空格和标点
  cleanQuery = cleanQuery
    .replace(/[，。？！,?!]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanQuery) {
    result.query = cleanQuery;
  }

  return result;
}

/**
 * 主要的工具函数
 */
export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 解析自然语言查询，提取参数
    const parsedInput = parseNaturalLanguageQuery(props);

    console.log('=== 临床试验查询开始 ===');
    console.log('原始查询:', props.query);
    console.log('解析后的输入参数:', JSON.stringify(parsedInput, null, 2));
    console.log('解析后参数:', parsedInput);

    // 构建查询参数
    const queryParams = buildQueryParams(parsedInput);

    // 构建完整的API URL
    const apiUrl = `${CLINICAL_TRIALS_API_BASE}?${queryParams.toString()}`;

    console.log('构建的查询参数:', queryParams.toString());
    console.log('完整API URL:', apiUrl);
    console.log('正在发送API请求...');

    // 发送API请求
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'FastGPT-ClinicalTrials-Plugin/1.0',
        Accept: 'application/json'
      },
      // 设置30秒超时
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('API响应状态:', response.status, response.statusText);
    console.log('API响应数据结构:', {
      hasStudies: !!data.studies,
      studiesLength: data.studies?.length || 0,
      totalCount: data.totalCount || 0,
      hasNextPageToken: !!data.nextPageToken,
      dataKeys: Object.keys(data || {})
    });

    // 检查响应数据
    if (!data || typeof data !== 'object') {
      console.error('API返回数据格式错误:', data);
      throw new Error('API返回数据格式错误');
    }

    const studies = data.studies || [];
    const totalCount = data.totalCount || 0;

    console.log(`查询成功，找到 ${totalCount} 个试验，返回 ${studies.length} 个`);

    // 如果没有找到结果，记录详细信息
    if (studies.length === 0) {
      console.log('未找到试验，可能的原因:');
      console.log('- 查询条件过于严格');
      console.log('- 关键词不匹配');
      console.log('- API数据库中确实没有相关试验');
      console.log('建议尝试更宽泛的查询条件');
    }

    // 格式化结果
    let result = '';
    if (studies.length === 0) {
      result =
        '未找到符合条件的临床试验。\n\n建议：\n1. 尝试使用更通用的关键词\n2. 减少筛选条件\n3. 检查拼写是否正确';
    } else {
      result = `# 临床试验查询结果\n\n**查询关键词**: ${props.query}\n**找到试验数量**: ${totalCount}\n**显示数量**: ${studies.length}\n\n`;

      // 按状态分组显示
      const recruitingStudies = studies.filter(
        (study: any) => study.protocolSection?.statusModule?.overallStatus === 'RECRUITING'
      );
      const otherStudies = studies.filter(
        (study: any) => study.protocolSection?.statusModule?.overallStatus !== 'RECRUITING'
      );

      if (recruitingStudies.length > 0) {
        result += `## 正在招募的试验 (${recruitingStudies.length}个)\n`;
        recruitingStudies.forEach((study: any) => {
          result += formatStudy(study);
        });
      }

      if (otherStudies.length > 0) {
        result += `## 其他状态试验 (${otherStudies.length}个)\n`;
        otherStudies.forEach((study: any) => {
          result += formatStudy(study);
        });
      }
    }

    // 生成查询摘要
    const recruitingCount = studies.filter(
      (s: any) => s.protocolSection?.statusModule?.overallStatus === 'RECRUITING'
    ).length;

    let summary = `查询了"${props.query}"相关的临床试验，`;

    // 显示自然语言解析结果
    const extractedParams = [];
    if (parsedInput.query !== props.query) {
      extractedParams.push(`核心关键词：${parsedInput.query}`);
    }
    if (parsedInput.phases && !props.phases) {
      const phasesStr = Array.isArray(parsedInput.phases)
        ? parsedInput.phases.join(',')
        : parsedInput.phases;
      extractedParams.push(`试验阶段：${phasesStr}`);
    }
    if (parsedInput.status && !props.status) {
      const statusStr = Array.isArray(parsedInput.status)
        ? parsedInput.status.join(',')
        : parsedInput.status;
      extractedParams.push(`试验状态：${statusStr}`);
    }
    if (parsedInput.location && !props.location) {
      extractedParams.push(`地理位置：${parsedInput.location}`);
    }
    if (parsedInput.startDate && !props.startDate) {
      extractedParams.push(`开始日期：${parsedInput.startDate}`);
    }
    if (parsedInput.pageSize && !props.pageSize) {
      extractedParams.push(`返回数量：${parsedInput.pageSize}`);
    }

    if (extractedParams.length > 0) {
      summary += `自动提取参数：${extractedParams.join('，')}。`;
    }

    summary += `找到${totalCount}个试验，其中${recruitingCount}个正在招募。`;

    // 显示最终使用的查询条件
    const finalParams = [];
    if (parsedInput.location) finalParams.push(`地区：${parsedInput.location}`);
    if (parsedInput.phases) {
      const phasesStr = Array.isArray(parsedInput.phases)
        ? parsedInput.phases.join(',')
        : parsedInput.phases;
      finalParams.push(`阶段：${phasesStr}`);
    }
    if (parsedInput.status) {
      const statusStr = Array.isArray(parsedInput.status)
        ? parsedInput.status.join(',')
        : parsedInput.status;
      finalParams.push(`状态：${statusStr}`);
    }
    if (parsedInput.startDate) finalParams.push(`起始日期：${parsedInput.startDate}`);

    if (finalParams.length > 0) {
      summary += `查询条件：${finalParams.join('，')}。`;
    }

    return {
      result,
      totalCount,
      summary
    };
  } catch (error) {
    console.error('临床试验查询失败:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';

    return {
      result: `临床试验查询失败: ${errorMessage}\n\n请检查：\n1. 网络连接是否正常\n2. 查询参数是否正确\n3. 稍后重试`,
      totalCount: 0,
      summary: `查询"${props.query}"时发生错误: ${errorMessage}`
    };
  }
}

/**
 * 工具配置导出 - FastGPT插件系统必需的默认导出
 */
export default {
  id: 'clinicalTrials',
  toolName: '临床试验查询',
  description:
    '查询ClinicalTrials.gov数据库中的临床试验信息，支持按疾病、药物、试验阶段、状态等条件筛选',
  avatar: '/imgs/module/clinicalTrials.svg',
  inputSchema: InputType,
  outputSchema: OutputType,
  tool
};
