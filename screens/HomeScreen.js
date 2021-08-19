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
import { connectActionSheet, useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
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

export default memo(connectActionSheet(function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [coinData, setCoinData] = useState([]);
  const [currency, setCurrency] = useState('usd');
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [coinDataRequestParams, setCoinDataRequestParams] = useState(defaultCoinDataRequestParams);
  const [isListLoadedCompletely, setIsListLoadedCompletely] = useState(false);
  const { showActionSheetWithOptions } = useActionSheet();

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

  const onOpenCurrencyActionSheet = useCallback(() => {
    const options = ['USD', 'TWD', 'Cancel'];

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 2,
        destructiveButtonIndex: null,
        title: 'Currency'
      },
      buttonIndex => {
        newCurrency = '';

        if (buttonIndex === 0) {
          newCurrency = 'usd';
        }
        else if (buttonIndex === 1) {
          newCurrency = 'twd';
        }
        
        if (newCurrency) {
          onCurrencyChanged(newCurrency);
        }
      },
    );
  }, [onCurrencyChanged]);

  const onOpenSortByActionSheet = useCallback(() => {
    const options = ['Market Cap', 'ID', 'Price', 'Volume', 'Cancel'];

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 4,
        destructiveButtonIndex: null,
        title: 'Sort by'
      },
      buttonIndex => {
        newSortBy = '';

        if (buttonIndex === 0) {
          newSortBy = 'market_cap_desc';
        }
        else if (buttonIndex === 1) {
          newSortBy = 'id_asc';
        }
        else if (buttonIndex === 2) {
          newSortBy = 'price_desc';
        }
        else if (buttonIndex === 3) {
          newSortBy = 'volume_desc';
        }
        
        if (newSortBy) {
          onSortByChanged(newSortBy);
        }
      },
    );
  }, [onSortByChanged]);

  useEffect(() => {
    getCoinData(coinDataRequestParams);
  }, [coinDataRequestParams]);

  useEffect(() => {
    printLog('=====On coin data, currency, sortBy changed.=====');
    printLog('coin data size: ' + coinData.length);
    printLog('currency: ' + currency + ', sortBy: ' + sortBy);
    //coinData.forEach(element => printLog(element.id));

    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightIconContainer}>
          <TouchableOpacity
            style={{ padding: 5 }}
            onPress={onOpenCurrencyActionSheet}>
            <MaterialCommunityIcons name="currency-usd-circle" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ padding: 5 }}
            disabled={coinData.length == 0}
            onPress={shareToTwitter}>
            <Ionicons name="logo-twitter" size={24} color="white" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [coinData, currency, sortBy]);

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
      <View style={styles.coinTitleContainer}>
        <View style={{ flex: column1Flex }}></View>
        <View style={styles.coinTitlePriceContainer}>
          <Text style={styles.coinTitlePriceText}>Price</Text>
        </View>
        <View style={styles.coinTitleVolumeContainer}>
          <TouchableOpacity
            style={styles.coinTitleVolumeButton}
            onPress={onOpenSortByActionSheet}>
            <Text style={styles.coinTitleVolumeText}>Volume</Text>
            <FontAwesome name="sort" size={15} color="black" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        </View>
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
}));

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
  headerRightIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5
  },
  coinTitleContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingLeft: 48,
    paddingRight: 10,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: '#e8e8e8'
  },
  coinTitlePriceContainer: {
    flex: column2Flex,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  coinTitlePriceText: {
    textAlign: 'right',
    fontSize: scaleText(18)
  },
  coinTitleVolumeContainer: {
    flex: column3Flex,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  coinTitleVolumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5
  },
  coinTitleVolumeText: {
    textAlign: 'right',
    fontSize: scaleText(18)
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
