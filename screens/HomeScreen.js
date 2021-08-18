import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Linking
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { printLog } from '../utils/LogUtils';
import { scaleText } from '../utils/TextUtils';

const baseApiUrl = 'https://api.coingecko.com/api/v3';
const defaultCoinDataRequestParams = {
  currency: 'usd',
  sortBy: 'market_cap_desc',
  dataPerPage: 25,
  page: 1
};

const areCoinItemPropsEqual = (prevProps, nextProps) => {
  return nextProps.item.id === prevProps.item.id
    && nextProps.item.current_price === prevProps.item.current_price
    && nextProps.item.total_volume === prevProps.item.total_volume
    && nextProps.navigation === prevProps.navigation;
}

const CoinItem = memo(({ item, currency, navigation }) => {
  return (
    <TouchableOpacity
      style={styles.coinItemContainer}
      onPress={() => navigation.navigate('Details',
        { coinId: item.id, coinName: item.name, coinSymbol: item.symbol, currency: currency })}>
      <Image
        style={styles.coinItemLogo}
        source={{ uri: item.image }} />
      <View style={styles.coinItemNameContainer}>
        <Text style={styles.coinItemSymbolText}>{item.symbol.toUpperCase()}</Text>
        <Text style={styles.coinItemNameText}>{item.name}</Text>
      </View>
      <Text style={styles.coinItemPriceText}>{item.current_price}</Text>
      <Text style={styles.coinItemVolumeText}>{item.total_volume}</Text>
    </TouchableOpacity>
  );
}, areCoinItemPropsEqual);

export default memo(function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [coinData, setCoinData] = useState([]);
  const [currency, setCurrency] = useState('usd');
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [coinDataRequestParams, setCoinDataRequestParams] = useState(defaultCoinDataRequestParams);
  const [isListLoadedCompletely, setIsListLoadedCompletely] = useState(false);

  const getCoinData = useCallback(async (requestParams) => {
    printLog('Get coin data. isLoading: ' + isLoading
      + ', page: ' + requestParams.page
      + ', isListLoadedCompletely: ' + isListLoadedCompletely);
    if (!isLoading && (requestParams.page == 1 || !isListLoadedCompletely)) { // The page starts from 1.
      try {
        setIsLoading(true);

        let getCoinDataParameters = [];
        getCoinDataParameters.push('vs_currency=' + requestParams.currency);
        getCoinDataParameters.push('order=' + requestParams.sortBy);
        getCoinDataParameters.push('per_page=' + requestParams.dataPerPage);
        getCoinDataParameters.push('page=' + requestParams.page);
        getCoinDataParameters.push('price_change_percentage=24h');
        //getCoinDataParameters.push('category=stablecoins');
        const url = baseApiUrl + '/coins/markets?' + getCoinDataParameters.join('&');
        printLog('request url: ' + url);

        const response = await fetch(url);
        const json = await response.json();
        printLog('=====On coin data downloaded.=====');
        printLog('page: ' + requestParams.page + ', coin data size: ' + json.length);

        if (json.length > 0) {
          let tempCoinData = requestParams.page > 1 ? coinData : [];
          // Remove duplicated data.
          let newCoinData = [...tempCoinData, ...json].filter((element, index, array) =>
            index === array.findIndex(e => e.id === element.id));
          //json.forEach(element => printLog(element.id));
          setCoinData(newCoinData);
          setIsListLoadedCompletely(false);
        }
        else {
          setIsListLoadedCompletely(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setIsRefreshingList(false);
      }
    }
    else {
      setIsRefreshingList(false);
    }
  }, [coinData, isLoading, isListLoadedCompletely]);

  const onPullToRefreshCoinDataList = useCallback(() => {
    printLog('>>>>> Pull to refresh coin data list.');
    setIsRefreshingList(true);
    setCoinDataRequestParams({
      ...defaultCoinDataRequestParams,
      currency: currency,
      sortBy: sortBy
    });
  }, [currency, sortBy]);

  const onCurrencyChanged = useCallback((newCurrency) => {
    printLog('>>>>> On currency changed. currency: ' + newCurrency);
    if (newCurrency === currency) {
      printLog('Currency is the same as previous one. Ignore the change.');
      return;
    }
    setIsRefreshingList(true);
    setCurrency(newCurrency);
    setCoinDataRequestParams({
      ...defaultCoinDataRequestParams,
      currency: newCurrency,
      sortBy: sortBy
    });
  }, [currency, sortBy]);

  const onSortByChanged = useCallback((newSortBy) => {
    printLog('>>>>> On sort by changed. sortBy: ' + newSortBy);
    if (newSortBy === sortBy) {
      printLog('Sort by is the same as previous one. Ignore the change.');
      return;
    }
    setIsRefreshingList(true);
    setSortBy(newSortBy);
    setCoinDataRequestParams({
      ...defaultCoinDataRequestParams,
      currency: currency,
      sortBy: newSortBy
    })
  }, [currency, sortBy]);

  const getMoreCoinData = useCallback(() => {
    if (!isLoading && !isListLoadedCompletely) {
      const newRequestParams = {
        ...coinDataRequestParams,
        page: coinDataRequestParams.page + 1
      };
      printLog('>>>>> Get more coin data. page: ' + newRequestParams.page);
      setCoinDataRequestParams(newRequestParams);
    }
  }, [isLoading, isListLoadedCompletely, coinDataRequestParams]);

  const shareToTwitter = useCallback(() => {
    let shareText = 'Today\'s top 10 cryptocurrencies (' + currency.toUpperCase() + '):\n';
    coinData.forEach((element, index, array) => {
      if (index < 10) {
        shareText += (index + 1) + '. ' + element.name + ' ' + element.current_price + '\n';
      }
    })
    printLog(shareText);
    const url = 'https://twitter.com/intent/tweet?text=' + encodeURI(shareText);
    Linking.openURL(url);
  }, [currency, coinData]);

  useEffect(() => {
    getCoinData(coinDataRequestParams);
  }, [coinDataRequestParams]);

  useEffect(() => {
    printLog('=====On coin data changed.=====');
    printLog('total coin data size: ' + coinData.length);
    //coinData.forEach(element => printLog(element.id));

    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ padding: 10 }}
          disabled={coinData.length == 0}
          onPress={shareToTwitter}>
          <Ionicons name="logo-twitter" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [coinData]);

  const renderCoinItem = useCallback(({ item }) => {
    return (
      <CoinItem
        item={item}
        currency={currency}
        navigation={navigation}
      />
    );
  }, [currency, navigation]);

  const renderFooter = useCallback(() => {
    return (
      <>
        {isLoading && coinData.length > 0 ? <ActivityIndicator size="large" color="#b3b3b3" /> : null}
      </>
    );
  }, [isLoading, coinData]);

  return (
    <View style={styles.container} >
      <StatusBar hidden={false} backgroundColor='#21b1ff' />
      <View style={styles.pickerContainer}>
        <Picker
          enabled={!isRefreshingList}
          style={{ flex: 1 }}
          selectedValue={currency}
          onValueChange={(itemValue, itemIndex) => onCurrencyChanged(itemValue)}>
          <Picker.Item label='USD' value='usd' />
          <Picker.Item label='TWD' value='twd' />
        </Picker>
        <Picker
          enabled={!isRefreshingList}
          style={{ flex: 1 }}
          selectedValue={sortBy}
          onValueChange={(itemValue, itemIndex) => onSortByChanged(itemValue)}>
          <Picker.Item label='Market Cap' value='market_cap_desc' />
          <Picker.Item label='ID' value='id_asc' />
          <Picker.Item label='Price' value='price_desc' />
          <Picker.Item label='Volume' value='volume_desc' />
        </Picker>
      </View>
      <View style={styles.coinTitleContainer}>
        <View style={{ flex: column1Flex }}></View>
        <Text style={styles.coinTitlePriceText}>Price</Text>
        <Text style={styles.coinTitleVolumeText}>Volume</Text>
      </View>
      <FlatList
        data={coinData}
        renderItem={renderCoinItem}
        ListFooterComponent={renderFooter}
        onRefresh={onPullToRefreshCoinDataList}
        refreshing={isRefreshingList}
        onEndReached={getMoreCoinData}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
      />
    </View>
  );
});

const column1Flex = 1;
const column2Flex = 1;
const column3Flex = 1.5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  titleBackground: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#21b1ff'
  },
  titleText: {
    color: 'white'
  },
  pickerContainer: {
    flexDirection: 'row',
    padding: 5
  },
  coinTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 40,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5
  },
  coinTitlePriceText: {
    flex: column2Flex,
    textAlign: 'right',
    fontSize: scaleText(16)
  },
  coinTitleVolumeText: {
    flex: column3Flex,
    textAlign: 'right',
    fontSize: scaleText(16)
  },
  coinItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  coinItemLogo: {
    width: 30,
    height: 30,
    marginRight: 8
  },
  coinItemNameContainer: {
    flex: column1Flex,
    flexDirection: 'column'
  },
  coinItemSymbolText: {
    flex: column1Flex,
    textAlign: 'left',
    fontSize: scaleText(20)
  },
  coinItemNameText: {
    flex: column1Flex,
    textAlign: 'left',
    fontSize: scaleText(13),
    color: 'grey'
  },
  coinItemPriceText: {
    flex: column2Flex,
    textAlign: 'right',
    fontSize: scaleText(16)
  },
  coinItemVolumeText: {
    flex: column3Flex,
    textAlign: 'right',
    fontSize: scaleText(16)
  }
});
