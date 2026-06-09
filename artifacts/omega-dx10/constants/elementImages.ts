import { ElementId } from '@/constants/gameData';
import { ImageSourcePropType } from 'react-native';

const ELEMENT_IMAGES: Partial<Record<ElementId, ImageSourcePropType>> = {
  FIRE:      require('../assets/images/elements/fogo.png'),
  WATER:     require('../assets/images/elements/agua.png'),
  PLANT:     require('../assets/images/elements/planta.png'),
  EARTH:     require('../assets/images/elements/terra.png'),
  ICE:       require('../assets/images/elements/gelo.png'),
  DARK:      require('../assets/images/elements/trevas.png'),
  LIGHT:     require('../assets/images/elements/luz.png'),
  LIGHTNING: require('../assets/images/elements/trovao.png'),
  WIND:      require('../assets/images/elements/vento.png'),
  METAL:     require('../assets/images/elements/metal.png'),
  NULL:      require('../assets/images/elements/nulo.png'),
};

export default ELEMENT_IMAGES;
