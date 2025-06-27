export const htmlTable2Md = (content: string): string => {
  return content.replace(/<table>[\s\S]*?<\/table>/g, (htmlTable) => {
    try {
      // Clean up whitespace and newlines
      const cleanHtml = htmlTable.replace(/\n\s*/g, '');
      const rows = cleanHtml.match(/<tr>(.*?)<\/tr>/g);
      if (!rows) return htmlTable;

      // Parse table data
      const tableData: string[][] = [];
      let maxColumns = 0;

      // Try to convert to markdown table
      rows.forEach((row, rowIndex) => {
        if (!tableData[rowIndex]) {
          tableData[rowIndex] = [];
        }
        let colIndex = 0;
        const cells = row.match(/<td.*?>(.*?)<\/td>/g) || [];

        cells.forEach((cell) => {
          while (tableData[rowIndex][colIndex]) {
            colIndex++;
          }
          const colspan = parseInt(cell.match(/colspan="(\d+)"/)?.[1] || '1');
          const rowspan = parseInt(cell.match(/rowspan="(\d+)"/)?.[1] || '1');
          const content = cell.replace(/<td.*?>|<\/td>/g, '').trim();

          for (let i = 0; i < rowspan; i++) {
            for (let j = 0; j < colspan; j++) {
              if (!tableData[rowIndex + i]) {
                tableData[rowIndex + i] = [];
              }
              tableData[rowIndex + i][colIndex + j] = i === 0 && j === 0 ? content : '^^';
            }
          }
          colIndex += colspan;
          maxColumns = Math.max(maxColumns, colIndex);
        });

        for (let i = 0; i < maxColumns; i++) {
          if (!tableData[rowIndex][i]) {
            tableData[rowIndex][i] = ' ';
          }
        }
      });
      const chunks: string[] = [];

      const headerCells = tableData[0]
        .slice(0, maxColumns)
        .map((cell) => (cell === '^^' ? ' ' : cell || ' '));
      const headerRow = '| ' + headerCells.join(' | ') + ' |';
      chunks.push(headerRow);

      const separator = '| ' + Array(headerCells.length).fill('---').join(' | ') + ' |';
      chunks.push(separator);

      tableData.slice(1).forEach((row) => {
        const paddedRow = row
          .slice(0, maxColumns)
          .map((cell) => (cell === '^^' ? ' ' : cell || ' '));
        while (paddedRow.length < maxColumns) {
          paddedRow.push(' ');
        }
        chunks.push('| ' + paddedRow.join(' | ') + ' |');
      });

      return chunks.join('\n');
    } catch (error) {
      return htmlTable;
    }
  });
};
