import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  StatusBar,
  ScrollView,
  useWindowDimensions
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { LineChart, Grid } from 'react-native-svg-charts';
import { printLog } from '../utils/LogUtils';

export default function DetailsScreen({ navigation, route }) {
  const baseApiUrl = 'https://api.coingecko.com/api/v3';

  const { width } = useWindowDimensions();
  const { coinId, coinName, coinSymbol, currency } = route.params;
  const [coinData, setCoinData] = useState(null);
  const [coinMarketData, setCoinMarketData] = useState({ prices: [] });

  const getCoinData = async (coinId) => {
    try {
      const url = baseApiUrl + '/coins/' + coinId + '?market_data=true';
      printLog('request url: ' + url);

      const response = await fetch(url);
      const json = await response.json();

      // Replace new line character with <br />
      json.description.en = json.description.en.replace(/\r\n/g, '<br />');
      setCoinData(json);
    } catch (error) {
      console.error(error);
    } finally {
    }
  }

  const getCoinMarketData = async (coinId, currency) => {
    try {
      const url = baseApiUrl + '/coins/' + coinId + '/market_chart?vs_currency=' + currency + '&days=1';
      printLog('request url: ' + url);

      const response = await fetch(url);
      const json = await response.json();

      setCoinMarketData(json);
    } catch (error) {
      console.error(error);
    } finally {
    }
  }

  useEffect(() => {
    if (coinId) {
      navigation.setOptions({
        title: coinName + ' (' + coinSymbol.toUpperCase() + ')'
      });
      getCoinData(coinId);
      getCoinMarketData(coinId, currency);
    }
  }, []);

  return (
    <View style={styles.container} >
      <StatusBar hidden={false} backgroundColor='#21b1ff' />
      <ScrollView>
        {!coinData ? null :
          <>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                {currency.toUpperCase() + '$ ' + coinData.market_data.current_price[currency]}
              </Text>
              <Text style={coinData.market_data.price_change_24h_in_currency[currency] >= 0 ?
                styles.pricePositiveChangeText : styles.priceNegativeChangeText}>
                {(coinData.market_data.price_change_24h_in_currency[currency] >= 0 ?
                  '+ ' + coinData.market_data.price_change_24h_in_currency[currency].toFixed(2) :
                  '- ' + (-coinData.market_data.price_change_24h_in_currency[currency].toFixed(2)))
                }
              </Text>
            </View>
            <LineChart
              style={{ height: 200 }}
              data={coinMarketData.prices.map(data => data[1])}
              svg={{
                stroke: (coinMarketData.prices.length > 0
                  && coinMarketData.prices[coinMarketData.prices.length - 1][1] - coinMarketData.prices[0][1] >= 0 ?
                  positivePriceChangeColor : negativePriceChangeColor)
              }}
              contentInset={{ top: 20, bottom: 20 }}
            >
              <Grid />
            </LineChart>
            <RenderHtml
              contentWidth={width}
              source={{ html: coinData.description.en }}
              tagsStyles={{
                body: {
                  color: 'black'
                }
              }}
            />
          </>
        }
      </ScrollView>
    </View>
  );
}

const positivePriceChangeColor = '#239e2b';
const negativePriceChangeColor = '#ab2626';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 10
  },
  priceContainer: {
    flexDirection: 'row',
    padding: 10
  },
  priceText: {
    flex: 1,
    fontSize: 20,
    textAlign: 'left'
  },
  pricePositiveChangeText: {
    flex: 1,
    fontSize: 20,
    textAlign: 'right',
    color: positivePriceChangeColor
  },
  priceNegativeChangeText: {
    flex: 1,
    fontSize: 20,
    textAlign: 'right',
    color: negativePriceChangeColor
  }
});
