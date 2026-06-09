import { AttributeId } from '@/constants/gameData';
import { ImageSourcePropType } from 'react-native';

const ATTRIBUTE_IMAGES: Partial<Record<AttributeId, ImageSourcePropType>> = {
  VC: require('../assets/images/attributes/vacina.png'),
  VR: require('../assets/images/attributes/virus.png'),
  DA: require('../assets/images/attributes/data.png'),
  UN: require('../assets/images/attributes/desconhecido.png'),
  FR: require('../assets/images/attributes/livre.png'),
};

export default ATTRIBUTE_IMAGES;
