import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { printLog } from '../utils/LogUtils';
import { scaleText } from '../utils/TextUtils';

const baseApiUrl = 'https://api.coingecko.com/api/v3';

export default function SplashScreen() {
  return (
    <View style={styles.container} >
      <Ionicons name="ios-rocket" size={160} color="white" />
      <Text style={styles.captionText}>TO THE MOON!!!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#21b1ff'
  },
  captionText: {
    fontSize: scaleText(30),
    fontWeight: 'bold',
    color: 'white'
  }
});
