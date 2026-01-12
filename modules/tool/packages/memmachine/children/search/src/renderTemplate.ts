interface EpisodeItem {
  content?: string;
  producer_id?: string;
  produced_for_id?: string;
}

interface SemanticFeature {
  tag?: string;
  feature_name?: string;
  value?: string;
}

export function renderTemplate(template: string, content: Record<string, any>): string {
  // semantic memory
  const semanticMemory = content.semantic_memory || [];

  // episodic memory
  const episodicMemory = content.episodic_memory || {};
  const shortTermMemory = episodicMemory.short_term_memory?.episodes || [];
  const episodeSummary = episodicMemory.short_term_memory?.episode_summary || [];
  const longTermMemory = episodicMemory.long_term_memory?.episodes || [];

  let result = template;
  result = result.replace('{{semanticMemory}}', _formatSemanticMemory(semanticMemory));
  result = result.replace('{{shortTermMemory}}', _formatEpisodicMemory(shortTermMemory));
  result = result.replace('{{episodeSummary}}', _formatEpisodeSummary(episodeSummary));
  result = result.replace('{{longTermMemory}}', _formatEpisodicMemory(longTermMemory));

  return result;
}

function _formatSemanticMemory(semanticMemory?: SemanticFeature[]): string {
  if (!Array.isArray(semanticMemory) || semanticMemory.length === 0) {
    return '*No semantic features available*';
  }

  return semanticMemory
    .map((feature) => {
      const tag = feature?.tag?.trim() || 'General';
      const featureName = feature?.feature_name?.trim() || 'property';
      const value = feature?.value?.trim() || '';
      return value ? `- **${tag}** / ${featureName}: ${value}` : `- **${tag}** / ${featureName}`;
    })
    .join('\n');
}

function _formatEpisodicMemory(episodes?: EpisodeItem[]): string {
  if (!Array.isArray(episodes) || episodes.length === 0) {
    return '*No memories available*';
  }

  return episodes
    .map((episode) => {
      const content = episode?.content?.trim() || '';
      const producer = episode?.producer_id?.trim() || 'Unknown';
      const producedFor = episode?.produced_for_id?.trim() || 'Unknown';
      return content
        ? `- **${producer}** → ${producedFor}: ${content}`
        : `- **${producer}** → ${producedFor}`;
    })
    .join('\n');
}

function _formatEpisodeSummary(episodeSummary?: string[]): string {
  if (!Array.isArray(episodeSummary) || !episodeSummary.some((s) => s?.trim())) {
    return '*No episode summaries available*';
  }

  return episodeSummary
    .map((summary) => summary?.trim())
    .filter((summary) => !!summary)
    .map((summary) => `> ${summary}`)
    .join('\n\n');
}
