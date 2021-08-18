import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const guidelineBaseWidth = 350;
const scaleText = size => width / guidelineBaseWidth * size;

export {scaleText};