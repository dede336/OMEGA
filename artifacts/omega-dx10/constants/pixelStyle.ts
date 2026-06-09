import { Platform } from 'react-native';

/**
 * Web: 2-step pixel-art chamfered corners via clipPath.
 * Native: standard rounded corners (borderRadius: 10).
 */

const PIXEL_POLYGON =
  'polygon(' +
  '6px 0px, calc(100% - 6px) 0px,' +
  'calc(100% - 4px) 0px, calc(100% - 4px) 2px, calc(100% - 2px) 2px, calc(100% - 2px) 4px, 100% 4px,' +
  '100% calc(100% - 6px),' +
  '100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px), calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px), calc(100% - 4px) 100%,' +
  'calc(100% - 6px) 100%, 6px 100%,' +
  '4px 100%, 4px calc(100% - 2px), 2px calc(100% - 2px), 2px calc(100% - 4px), 0px calc(100% - 4px),' +
  '0px 6px,' +
  '0px 4px, 2px 4px, 2px 2px, 4px 2px, 4px 0px' +
  ')';

export const pixelStyle: object = Platform.OS === 'web'
  ? { clipPath: PIXEL_POLYGON, borderRadius: 0, borderWidth: 0 }
  : { borderRadius: 10, overflow: 'hidden' };
