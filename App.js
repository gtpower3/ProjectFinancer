import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Button,
  TextInput,
  ImageBackground,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import "react-native-gesture-handler";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  useTheme,
} from "@react-navigation/native";
import {
  CardStyleInterpolators,
  createStackNavigator,
} from "@react-navigation/stack";
import { AppearanceProvider, useColorScheme } from "react-native-appearance";
import { FakeCurrencyInput } from "react-native-currency-input";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { CollapsibleHeaderFlatList } from "react-native-collapsible-header-views";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import Collapsible from "react-native-collapsible";

const db = SQLite.openDatabase("db.testDb"); // returns Database object
const dbVer = "1.0";

const currency = "AED";

const Stack = createStackNavigator();

function DataDummy() {
  /*
  var DATA = [];
  for (var i = 0; i < 10; i++) {
    var item = {
      id: i.toString(),
      title: "item " + (i + 1),
    };
    DATA.push(item);
  }*/

  var DATA = [];

  return DATA;
}

const Item = ({ item, onPress, style, isCollapsed }) => (
  <TouchableOpacity onPress={onPress} style={[styles.itemContainer, style]}>
    <View style={styles.itemContainerTopRow}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.amount}>{item.amount}</Text>
    </View>
    <View>
      <Text style={styles.date}>
        {format(new Date(item.date), "dd/MM/yyyy")}
      </Text>
    </View>
    <Collapsible collapsed={isCollapsed}>
      <Text style={styles.date}>{item.type}</Text>
    </Collapsible>
  </TouchableOpacity>
);

function RGBToHex(rgb) {
  // Choose correct separator
  let sep = rgb.indexOf(",") > -1 ? "," : " ";
  // Turn "rgb(r,g,b)" into [r,g,b]
  rgb = rgb.substr(4).split(")")[0].split(sep);

  let r = (+rgb[0]).toString(16),
    g = (+rgb[1]).toString(16),
    b = (+rgb[2]).toString(16);

  if (r.length == 1) r = "0" + r;
  if (g.length == 1) g = "0" + g;
  if (b.length == 1) b = "0" + b;

  return "#" + r + g + b;
}

function RenderPickerList() {
  var pickerListArray = [
    "Food",
    "Service",
    "Entertainment",
    "Groceries",
    "Electronics",
    "Other",
  ];

  return pickerListArray.map((item, key) => (
    <Picker.Item key={key} label={item} value={item.toLowerCase()} />
  ));
}

function DBcreate() {
  db.transaction((tx) => {
    tx.executeSql(
      "CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, type TEXT, amount INT, date DATE)"
    );
    console.log("db created? v" + db.version);
  });
}

function Home({ navigation, route }) {
  const [totalMoney, setTotalMoney] = useState(0);
  const [newTransactionFlag, setNewTransactionFlag] = useState(true);
  const [resArray, setResArray] = useState(null);
  const [showActivityIndicator, setShowActivityIndicator] = useState(true);
  const DBfetch = () => {
    console.log("fetching data to resArray...");
    db.transaction((tx) => {
      // sending 4 arguments in executeSql
      tx.executeSql(
        "SELECT * FROM transactions ORDER BY date DESC",
        null, // passing sql query and parameters:null
        // success callback which sends two things Transaction object and ResultSet Object
        (txObj, ResultSet) => {
          setResArray(ResultSet.rows._array);
          setShowActivityIndicator(false);
        },
        // failure callback which sends two things Transaction object and Error
        (txObj, error) => {
          console.log("Error ", error);
          Alert.alert("Error", error);
        }
      ); // end executeSQL
    }); // end transaction
  };

  const DBsum = () => {
    console.log("adding sum to totalMoney...");
    db.transaction((tx) => {
      // sending 4 arguments in executeSql
      tx.executeSql(
        "SELECT SUM(amount) FROM transactions",
        null, // passing sql query and parameters:null
        // success callback which sends two things Transaction object and ResultSet Object
        (txObj, ResultSet) => {
          if (ResultSet.rows.item(0)["SUM(amount)"] == null) {
            setTotalMoney(0);
          } else {
            setTotalMoney(ResultSet.rows.item(0)["SUM(amount)"]);
          }
        },
        // failure callback which sends two things Transaction object and Error
        (txObj, error) => console.log("Error ", error)
      ); // end executeSQL
    }); // end transaction
  };

  const DBdrop = () => {
    db.transaction((tx) => {
      tx.executeSql("DROP TABLE IF EXISTS transactions");
      console.log("db table dropped");
    });
  };

  React.useEffect(() => {
    if (route.params?.newTransactionAmount) {
      // Post updated, do something with `route.params.post`
      // For example, send the post to the server
      setShowActivityIndicator(true);
      console.log(
        "transaction: " + JSON.stringify(route.params.newTransactionAmount)
      );
      //addToTotalMoney(totalMoney + parseFloat(JSON.stringify(route.params.newTransactionAmount)));
    }

    //DBdrop();
    try {
      DBcreate();
    } catch (error) {
      console.error(error);
    }

    try {
      DBfetch();
    } catch (error) {
      console.error(error);
    }

    try {
      DBsum();
    } catch (error) {
      console.error(error);
    }
  }, [route.params?.newTransactionAmount]);

  const addToMoney = () => navigation.navigate("AddTransaction");
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState(null);
  const renderItem = ({ item }) => {
    const backgroundColor =
      item.id.toString() === selectedId ? "#007ab3" : "#14b5ff";
    const collapsed = item.id.toString() === selectedId ? false : true;

    return (
      <Item
        item={item}
        onPress={() => {
          if (item.id.toString() === selectedId) {
            setSelectedId("-1");
          } else {
            setSelectedId(item.id.toString());
          }
        }}
        style={{ backgroundColor }}
        isCollapsed={collapsed}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CollapsibleHeaderFlatList
        CollapsibleHeaderComponent={
          <View>
            <ImageBackground
              style={styles.headerImg}
              source={{
                uri: "https://picsum.photos/500/500?blur",
              }}
            >
              <Text
                style={{
                  color: "#000",
                  fontSize: 20,
                }}
              >
                You currently have...
              </Text>
              <Text
                style={{
                  color: "#000",
                  fontSize: 50,
                  textShadowColor: "white",
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 1,
                  fontWeight: "bold",
                }}
              >
                {totalMoney.toFixed(2)} {currency}
              </Text>
              <Text style={{ color: "#000" }}>in total</Text>
            </ImageBackground>
          </View>
        }
        headerHeight={300}
        statusBarHeight={Platform.OS === "ios" ? 20 : 0}
        clipHeader={true}
        data={resArray}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        extraData={selectedId}
      ></CollapsibleHeaderFlatList>

      <TouchableOpacity
        style={styles.touchableOpacityStyle}
        onPress={addToMoney}
      >
        <Image
          // FAB using TouchableOpacity with an image
          // For online image
          source={{
            uri: "https://raw.githubusercontent.com/AboutReact/sampleresource/master/plus_icon.png",
          }}
          style={styles.floatingButtonStyle}
        />
      </TouchableOpacity>

      <View style={styles.dbDebugButton}>
        <Button title="Clear DB" onPress={DBdrop} color="#ff0000" />
        <Button title="Remake DB" onPress={DBcreate} color="#ff0000" />
      </View>

      <View
        style={[
          styles.activityIndicatorStyle,
          showActivityIndicator ? { opacity: 0.5 } : { opacity: 0 },
        ]}
        pointerEvents={showActivityIndicator ? "auto" : "box-none"}
      >
        <ActivityIndicator
          size="large"
          animating={showActivityIndicator}
          color="#0000ff"
        />
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function AddTransaction({ navigation }) {
  const { colors } = useTheme();

  const [transactionAmount, setTransactionAmount] = useState(0); // can also be null

  const [name, setName] = useState(null);

  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState("date");
  const [show, setShow] = useState(false);

  const [selectedType, setSelectedType] = useState("food");

  const [resArray, setResArray] = useState(null);

  const DBadd = () => {
    console.log(
      "new data passed: { name: " +
        name +
        " amount: " +
        transactionAmount +
        " date: " +
        date +
        " }"
    );
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO transactions (name, type, amount, date) values (?, ?, ?, ?)",
        [name, selectedType, transactionAmount, format(date, "yyyy-MM-dd")],
        (txObj, ResultSet) => {},
        (txObj, error) => console.log("Error", error)
      );
    });
  };

  const onDateChange = (event, selectedDate) => {
    console.log(`${selectedDate}, ${typeof selectedDate}`);
    const currentDate = selectedDate || date;
    setShow(Platform.OS === "ios");
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };

  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => {
    setIsEnabled((previousState) => !previousState);
    setTransactionAmount(transactionAmount * -1);
  };

  const [isCollapsed, toggleIsCollapsed] = useState(false);

  return (
    /* 
      Amount - Fake currency (default: 0 but can be null if user clears then submits)
      Name - text input (default: null?)
      Type - dropdown list (default: first option)
      Date - date picker (default: today's date)
      Submit - button (text: Add? Submit? Done?) (when clicked: save locally & save to cloud? send value back to home screen to be added to total money)

    */

    <View style={styles.container}>
      <View style={styles.inputViewStyle}>
        <Text style={{ color: colors.text }}>How much was it?</Text>
        <FakeCurrencyInput
          style={{ color: colors.text }}
          value={transactionAmount}
          onChangeValue={(value) => {
            if (isEnabled) {
              //if debit
              if (value > 0) setTransactionAmount(-value);
              else setTransactionAmount(value);
            } else {
              //else credit
              setTransactionAmount(value);
            }
          }}
          unit={currency}
          delimiter=","
          separator="."
          precision={2}
          onChangeText={(formattedValue) => {
            // ...
            //console.log(formattedValue);
            //console.log(value);
          }}
        />
      </View>

      <View style={styles.inputViewStyle}>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>

      <View style={styles.inputViewStyle}>
        <Text style={{ color: colors.text }}>What was it?</Text>
        <TextInput
          placeholder="Was it lunch? or maybe just fuel?"
          placeholderTextColor={colors.text}
          color={colors.text}
          onChangeText={(name) => setName(name)}
        />
      </View>

      <View style={styles.pickerViewStyle}>
        <Text style={{ color: colors.text }}>How would you describe it?</Text>
        <Picker
          prompt="what"
          style={{ color: colors.text }}
          dropdownIconColor={RGBToHex(colors.text)}
          selectedValue={selectedType}
          onValueChange={(itemValue, itemIndex) => {
            setSelectedType(itemValue);
            console.log(`${itemValue}, ${typeof itemValue}`);
          }}
        >
          {RenderPickerList()}
        </Picker>
      </View>

      <Text style={{ color: colors.text }}>When was it?</Text>
      <View onTouchStart={showDatepicker} style={styles.inputViewStyle}>
        <Text style={{ color: colors.text }}>{format(date, "dd/MM/yyyy")}</Text>
      </View>
      {/* <View>
           <Button onPress={showTimepicker} title="Show time picker!" /> 
        </View> */}
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      <Button
        title="Add"
        onPress={() => {
          DBadd();
          navigation.navigate({
            name: "Home",
            params: { newTransactionAmount: transactionAmount },
            merge: true,
          });
        }}
      />

      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  const scheme = useColorScheme();

  React.useEffect(() => {
    DBcreate();
  });

  return (
    <AppearanceProvider>
      <NavigationContainer theme={scheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ title: "Financier", headerShown: false }}
          />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransaction}
            options={{
              title: "New transaction",
              cardStyleInterpolator:
                CardStyleInterpolators.forRevealFromBottomAndroid,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppearanceProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  homeContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  headerImg: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  previousTransactionsStyle: {
    flex: 1,
  },
  accountViewStyle: {
    justifyContent: "center",
    alignItems: "center",
  },
  touchableOpacityStyle: {
    position: "absolute",
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    right: 30,
    bottom: 30,
  },
  floatingButtonStyle: {
    resizeMode: "contain",
    width: 50,
    height: 50,
    //backgroundColor:'black'
  },
  pickerStyle: {
    height: 150,
    width: "80%",
    color: "#344953",
  },
  inputViewStyle: {
    width: "80%",
    borderWidth: 2,
  },
  itemContainerTopRow: {
    flexDirection: "row",
  },
  itemContainer: {
    padding: 20,
    marginTop: 4,
  },
  title: {
    flex: 1,
    fontSize: 32,
  },
  amount: {
    flex: -1,
    fontSize: 32,
  },
  date: {
    fontSize: 16,
  },
  activityIndicatorStyle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  dbDebugButton: {
    position: "absolute",
    bottom: 10,
    width: "30%",
    justifyContent: "center",
    alignSelf: "center",
  },
});
