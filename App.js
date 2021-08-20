import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import { printLog } from './utils/LogUtils';
import { scaleText } from './utils/TextUtils';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    printLog('Start app with splash screen.');
    setTimeout(() => {
      printLog('Go to home screen.');
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <ActionSheetProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName='Home'
          screenOptions={{
            headerStyle: {
              backgroundColor: '#21b1ff',
            },
            headerTintColor: 'white',
            headerTitleAlign: 'center',
            headerTitle: ({ children }) =>
              <Text style={styles.titleText}>{children}</Text>,
            headerBackTitle: null
          }}
        >
          <Stack.Screen
            name='Home'
            component={HomeScreen}
            options={{
              title: 'My cryptocurrency dashboard'
            }}
          />
          <Stack.Screen
            name='Details'
            component={DetailsScreen}
            options={{
              title: 'Details'
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ActionSheetProvider>
  );
}

const styles = StyleSheet.create({
  titleText: {
    fontSize: scaleText(15),
    color: 'white'
  }
});