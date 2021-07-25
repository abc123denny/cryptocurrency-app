import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
  FlatList,
  StatusBar
} from "react-native";
import { Picker } from '@react-native-picker/picker';

export default function App() {
  const isDebug = true;
  const baseApiUrl = 'https://api.coingecko.com/api/v3';
  const defaultCoinDataRequestParams = {
    currency: 'usd',
    sortBy: 'market_cap_desc',
    dataPerPage: 25,
    page: 1
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [coinData, setCoinData] = useState([]);
  const [currency, setCurrency] = useState('usd');
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [coinDataRequestParams, setCoinDataRequestParams] = useState(defaultCoinDataRequestParams);
  const [isListLoadedCompletely, setIsListLoadedCompletely] = useState(false);

  const printLog = (str) => {
    if (isDebug) {
      console.log(str);
    }
  }

  const getCoinData = async (requestParams) => {
    printLog('Get coin data. isLoading: ' + isLoading
      + ', page: ' + requestParams.page
      + ', isListLoadedCompletely: ' + isListLoadedCompletely);
    if (!isLoading && (requestParams.page == 1 || !isListLoadedCompletely)) {
      try {
        setIsLoading(true);

        let getCoinDataParameters = [];
        getCoinDataParameters.push('vs_currency=' + requestParams.currency);
        getCoinDataParameters.push('order=' + requestParams.sortBy);
        getCoinDataParameters.push('per_page=' + requestParams.dataPerPage);
        getCoinDataParameters.push('page=' + requestParams.page);
        getCoinDataParameters.push('price_change_percentage=24h');
        getCoinDataParameters.push('category=stablecoins');
        const url = baseApiUrl + '/coins/markets?' + getCoinDataParameters.join('&');
        printLog('request url: ' + url);

        const response = await fetch(url);
        const json = await response.json();
        printLog('=====On coin data downloaded.=====');
        printLog('page: ' + requestParams.page + ', coin data size: ' + json.length);

        if (json.length > 0) {
          let tempCoinData = requestParams.page > 1 ? coinData : [];
          // Remove duplicated data.
          let newCoinData = [...tempCoinData, ...json, ...json].filter((element, index, array) =>
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
  }

  const onPullToRefreshCoinDataList = () => {
    printLog('>>>>> Pull to refresh coin data list.');
    setIsRefreshingList(true);
    setCoinDataRequestParams({
      ...defaultCoinDataRequestParams,
      currency: currency,
      sortBy: sortBy
    });
  }

  const onCurrencyChanged = (newCurrency) => {
    printLog('>>>>> On currency changed. currency: ' + newCurrency);
    setIsRefreshingList(true);
    setCurrency(newCurrency);
    setCoinDataRequestParams({
      ...coinDataRequestParams,
      currency: newCurrency,
      page: 1
    });
  }

  const onSortByChanged = (newSortBy) => {
    printLog('>>>>> On sort by changed. sortBy: ' + sortBy);
    setIsRefreshingList(true);
    setSortBy(newSortBy);
    setCoinDataRequestParams({
      ...coinDataRequestParams,
      sortBy: newSortBy,
      page: 1
    })
  }

  const getMoreCoinData = () => {
    if (!isLoading && !isListLoadedCompletely) {
      const newRequestParams = {
        ...coinDataRequestParams,
        page: coinDataRequestParams.page + 1
      };
      printLog('>>>>> Get more coin data. page: ' + newRequestParams.page);
      setCoinDataRequestParams(newRequestParams);
    }
  }

  useEffect(() => {
    getCoinData(coinDataRequestParams);
  }, [coinDataRequestParams]);

  useEffect(() => {
    printLog('=====On coin data changed.=====');
    printLog('total coin data size: ' + coinData.length);
    //coinData.forEach(element => printLog(element.id));
  }, [coinData]);

  const renderCoinItem = ({ item }) => {
    return (
      <View style={styles.coinItemContainer}>
        <Image
          style={styles.coinItemLogo}
          source={{ uri: item.image }} />
        <Text style={styles.coinItemNameText}>{item.name}</Text>
        <Text style={styles.coinItemPriceText}>{item.current_price}</Text>
        <Text style={styles.coinItemVolumeText}>{item.total_volume}</Text>
      </View>
    );
  }

  const renderFooter = () => {
    return (
      <>
        {isLoading && coinData.length > 0 ? <ActivityIndicator size="large" color="#b3b3b3" /> : null}
      </>
    );
  }

  return (
    <View style={styles.container} >
      <StatusBar hidden={false} />
      <View style={styles.titleBackground}>
        <Text style={styles.titleText}>My crypto currency dashboard</Text>
      </View>
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
}

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
    paddingLeft: 40,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5
  },
  coinTitlePriceText: {
    flex: column2Flex,
    textAlign: 'right',
    textAlignVertical: 'center'
  },
  coinTitleVolumeText: {
    flex: column3Flex,
    textAlign: 'right',
    textAlignVertical: 'center'
  },
  coinItemContainer: {
    flexDirection: 'row',
    padding: 10
  },
  coinItemLogo: {
    width: 30,
    height: 30,
    marginRight: 8
  },
  coinItemNameText: {
    flex: column1Flex,
    textAlign: 'left',
    textAlignVertical: 'center'
  },
  coinItemPriceText: {
    flex: column2Flex,
    textAlign: 'right',
    textAlignVertical: 'center'
  },
  coinItemVolumeText: {
    flex: column3Flex,
    textAlign: 'right',
    textAlignVertical: 'center'
  }
});
