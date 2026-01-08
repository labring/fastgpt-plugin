import TurndownService from 'turndown';
// @ts-ignore
import turndownPluginGfm from 'joplin-turndown-plugin-gfm';

// Update content size limits
const MAX_TEXT_LENGTH = 100 * 1000; // 100k characters limit

export const html2md = (html: string) => {
  if (html.length > MAX_TEXT_LENGTH) {
    html = html.slice(0, MAX_TEXT_LENGTH);
  }
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full'
  });

  turndownService.remove(['i', 'script', 'iframe', 'style']);

  turndownService.use(turndownPluginGfm.gfm);

  const md = turndownService.turndown(html);

  const formatMd = md.replace(
    /(!\[([^\]]*)\]|\[([^\]]*)\])(\([^)]*\))/g,
    (match: string, prefix: string, imageAlt: string, linkAlt: string, url: string) => {
      const altText = imageAlt !== undefined ? imageAlt : linkAlt;
      const cleanAltText = altText.replace(/\n+/g, ' ').trim();

      return imageAlt !== undefined ? `![${cleanAltText}]${url}` : `[${cleanAltText}]${url}`;
    }
  );

  return formatMd;
};
