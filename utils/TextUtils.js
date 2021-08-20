import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width } = Dimensions.get('window');
const guidelineBaseWidth = 350;
const scaleText = size => {
    const newSize = width / guidelineBaseWidth * size;
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
    }
}

export { scaleText };