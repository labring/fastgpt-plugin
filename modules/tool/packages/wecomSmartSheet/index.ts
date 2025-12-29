import config from './config';
import { exportToolSet } from '@tool/utils/tool';

import wecomSmartSheetDoc from './children/wecomSmartSheetDoc';
import wecomSmartSheetFieldAdvanced from './children/wecomSmartSheetFieldAdvanced';
import wecomSmartSheetFieldSimple from './children/wecomSmartSheetFieldSimple';
import wecomSmartSheetRecordAdvanced from './children/wecomSmartSheetRecordAdvanced';
import wecomSmartSheetRecordSimple from './children/wecomSmartSheetRecordSimple';
import wecomSmartSheetTable from './children/wecomSmartSheetTable';
import wecomSmartSheetView from './children/wecomSmartSheetView';

export default exportToolSet({
  config: {
    ...config,
    children: [
      wecomSmartSheetDoc,
      wecomSmartSheetFieldAdvanced,
      wecomSmartSheetFieldSimple,
      wecomSmartSheetRecordAdvanced,
      wecomSmartSheetRecordSimple,
      wecomSmartSheetTable,
      wecomSmartSheetView
    ]
  }
});
