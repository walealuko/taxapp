import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  AsyncStorage
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import axios from "axios";

const API_URL = "http://YOUR_IP:5000/api";
const Stack = createNativeStackNavigator();

// Storage helpers
const storeToken = async (token) => await AsyncStorage.setItem("taxapp_token", token);
const getStoredToken = async () => {
  const token = await AsyncStorage.getItem("taxapp_token");
  if (!token) throw new Error("Not authenticated");
  return token;
};
const formatCurrency = (amount) =>
  `₦${parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Result Row Component
function ResultRow({ label, value, highlight }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, highlight && styles.resultHighlight]}>{value}</Text>
    </View>
  );
}

// Tax Types
const TAX_TYPES = [
  { id: "paye", name: "PAYE", description: "Pay As You Earn", icon: "💼" },
  { id: "vat", name: "VAT", description: "Value Added Tax", icon: "🧾" },
  { id: "wht", name: "WHT", description: "Withholding Tax", icon: "✂️" },
  { id: "cgt", name: "CGT", description: "Capital Gains Tax", icon: "📈" }
];

// LOGIN SCREEN
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const r = await axios.post(`${API_URL}/auth/login`, { email, password });
      await storeToken(r.data.token);
      navigation.replace("Dashboard", { user: r.data.user });
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <View style={styles.authCard}>
        <Text style={styles.authTitle}>TaxApp</Text>
        <Text style={styles.authSubtitle}>Nigeria Tax Calculator</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.authBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authBtnText}>Login</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.authLink}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// REGISTER SCREEN
function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { firstName, lastName, email, password });
      Alert.alert("Success", "Registration successful! Please login.", [
        { text: "OK", onPress: () => navigation.navigate("Login") }
      ]);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <ScrollView>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Create Account</Text>
          <Text style={styles.authSubtitle}>Join TaxApp</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity style={styles.authBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authBtnText}>Register</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.authLink}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// DASHBOARD SCREEN
function DashboardScreen({ navigation, route }) {
  const { user } = route.params || {};

  const handleLogout = async () => {
    await AsyncStorage.removeItem("taxapp_token");
    navigation.replace("Login");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome{user?.firstName ? `, ${user.firstName}` : ""}</Text>
          <Text style={styles.subtitle}>Select a tax type to calculate</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.taxGrid}>
        {TAX_TYPES.map((tax) => (
          <TouchableOpacity
            key={tax.id}
            style={styles.taxCard}
            onPress={() => navigation.navigate(tax.name)}
          >
            <Text style={styles.taxIcon}>{tax.icon}</Text>
            <Text style={styles.taxName}>{tax.name}</Text>
            <Text style={styles.taxDesc}>{tax.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.summaryBtn} onPress={() => navigation.navigate("Summary")}>
        <Text style={styles.summaryBtnText}>View Tax Summary</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// PAYE SCREEN
function PAYEScreen({ navigation }) {
  const [grossIncome, setGrossIncome] = useState("");
  const [frequency, setFrequency] = useState("annual");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculatePAYE = async () => {
    if (!grossIncome) {
      Alert.alert("Error", "Please enter gross income");
      return;
    }
    setLoading(true);
    try {
      const token = await getStoredToken();
      const r = await axios.post(
        `${API_URL}/tax/paye`,
        { grossIncome: parseFloat(grossIncome), frequency },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(r.data);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Gross Income</Text>
        <TextInput style={styles.input} placeholder="Enter amount" keyboardType="numeric" value={grossIncome} onChangeText={setGrossIncome} />
        <Text style={styles.label}>Frequency</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleBtn, frequency === "monthly" && styles.toggleActive]} onPress={() => setFrequency("monthly")}>
            <Text style={[styles.toggleText, frequency === "monthly" && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, frequency === "annual" && styles.toggleActive]} onPress={() => setFrequency("annual")}>
            <Text style={[styles.toggleText, frequency === "annual" && styles.toggleTextActive]}>Annual</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.calcBtn} onPress={calculatePAYE} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>Calculate PAYE</Text>}
        </TouchableOpacity>
      </View>
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>PAYE Tax Result</Text>
          <ResultRow label="Gross Income" value={formatCurrency(result.grossIncome)} />
          <ResultRow label="Frequency" value={result.frequency} />
          <ResultRow label="Annual Income" value={formatCurrency(result.annualIncome)} />
          <View style={styles.divider} />
          <ResultRow label="Annual Tax" value={formatCurrency(result.annualTax)} highlight />
          <ResultRow label="Monthly Tax" value={formatCurrency(result.monthlyTax)} highlight />
        </View>
      )}
    </ScrollView>
  );
}

// VAT SCREEN
function VATScreen({ navigation }) {
  const [revenue, setRevenue] = useState("");
  const [rate, setRate] = useState("0.075");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateVAT = async () => {
    if (!revenue) {
      Alert.alert("Error", "Please enter revenue");
      return;
    }
    setLoading(true);
    try {
      const token = await getStoredToken();
      const r = await axios.post(
        `${API_URL}/tax/vat`,
        { revenue: parseFloat(revenue), rate: parseFloat(rate) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(r.data);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Revenue (VATable)</Text>
        <TextInput style={styles.input} placeholder="Enter revenue" keyboardType="numeric" value={revenue} onChangeText={setRevenue} />
        <Text style={styles.label}>VAT Rate</Text>
        <View style={styles.toggleRow}>
          {["0.075", "0.10", "0.20"].map((r) => (
            <TouchableOpacity key={r} style={[styles.toggleBtn, rate === r && styles.toggleActive]} onPress={() => setRate(r)}>
              <Text style={[styles.toggleText, rate === r && styles.toggleTextActive]}>{parseFloat(r) * 100}%</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.calcBtn} onPress={calculateVAT} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>Calculate VAT</Text>}
        </TouchableOpacity>
      </View>
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>VAT Calculation Result</Text>
          <ResultRow label="Revenue" value={formatCurrency(result.revenue)} />
          <ResultRow label="VAT Rate" value={`${result.vatRate * 100}%`} />
          <View style={styles.divider} />
          <ResultRow label="VAT Amount" value={formatCurrency(result.vatAmount)} highlight />
          <ResultRow label="Net Amount" value={formatCurrency(result.netAmount)} />
        </View>
      )}
    </ScrollView>
  );
}

// WHT SCREEN
function WHTScreen({ navigation }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("contractor");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: "contractor", name: "Contractor", rate: "5%" },
    { id: "dividend", name: "Dividend", rate: "10%" },
    { id: "rent", name: "Rent", rate: "10%" },
    { id: "interest", name: "Interest", rate: "10%" },
    { id: "royalty", name: "Royalty", rate: "15%" }
  ];

  const calculateWHT = async () => {
    if (!amount) {
      Alert.alert("Error", "Please enter amount");
      return;
    }
    setLoading(true);
    try {
      const token = await getStoredToken();
      const r = await axios.post(
        `${API_URL}/tax/wht`,
        { amount: parseFloat(amount), category },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(r.data);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Gross Amount</Text>
        <TextInput style={styles.input} placeholder="Enter amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryBtn, category === cat.id && styles.toggleActive]}
              onPress={() => setCategory(cat.id)}
            >
              <Text style={[styles.categoryText, category === cat.id && styles.toggleTextActive]}>{cat.name}</Text>
              <Text style={[styles.categoryRate, category === cat.id && styles.toggleTextActive]}>{cat.rate}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.calcBtn} onPress={calculateWHT} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>Calculate WHT</Text>}
        </TouchableOpacity>
      </View>
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Withholding Tax Result</Text>
          <ResultRow label="Category" value={result.category} />
          <ResultRow label="Gross Amount" value={formatCurrency(result.grossAmount)} />
          <ResultRow label="WHT Rate" value={`${result.whtRate * 100}%`} />
          <View style={styles.divider} />
          <ResultRow label="Withholding Tax" value={formatCurrency(result.withholdingTax)} highlight />
          <ResultRow label="Net Payment" value={formatCurrency(result.netPayment)} />
        </View>
      )}
    </ScrollView>
  );
}

// CGT SCREEN
function CGTScreen({ navigation }) {
  const [disposalProceeds, setDisposalProceeds] = useState("");
  const [costBase, setCostBase] = useState("");
  const [expenses, setExpenses] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateCGT = async () => {
    if (!disposalProceeds) {
      Alert.alert("Error", "Please enter disposal proceeds");
      return;
    }
    setLoading(true);
    try {
      const token = await getStoredToken();
      const r = await axios.post(
        `${API_URL}/tax/cgt`,
        { disposalProceeds: parseFloat(disposalProceeds), costBase: parseFloat(costBase) || 0, expenses: parseFloat(expenses) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(r.data);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Disposal Proceeds</Text>
        <TextInput style={styles.input} placeholder="Amount realized from disposal" keyboardType="numeric" value={disposalProceeds} onChangeText={setDisposalProceeds} />
        <Text style={styles.label}>Cost Base</Text>
        <TextInput style={styles.input} placeholder="Original cost of asset" keyboardType="numeric" value={costBase} onChangeText={setCostBase} />
        <Text style={styles.label}>Allowable Expenses</Text>
        <TextInput style={styles.input} placeholder="Selling expenses, etc." keyboardType="numeric" value={expenses} onChangeText={setExpenses} />
        <TouchableOpacity style={styles.calcBtn} onPress={calculateCGT} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>Calculate CGT</Text>}
        </TouchableOpacity>
      </View>
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Capital Gains Tax Result</Text>
          <ResultRow label="Disposal Proceeds" value={formatCurrency(result.disposalProceeds)} />
          <ResultRow label="Cost Base" value={formatCurrency(result.costBase)} />
          <ResultRow label="Allowable Expenses" value={formatCurrency(result.allowableExpenses)} />
          <View style={styles.divider} />
          <ResultRow label="Chargeable Gain" value={formatCurrency(result.chargeableGain)} />
          <ResultRow label="CGT Rate" value={`${result.cgtRate * 100}%`} />
          <ResultRow label="Capital Gains Tax" value={formatCurrency(result.capitalGainsTax)} highlight />
        </View>
      )}
    </ScrollView>
  );
}

// SUMMARY SCREEN
function SummaryScreen({ navigation }) {
  const [grossIncome, setGrossIncome] = useState("");
  const [revenue, setRevenue] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const getSummary = async () => {
    if (!grossIncome && !revenue) {
      Alert.alert("Error", "Please enter at least one value");
      return;
    }
    setLoading(true);
    try {
      const token = await getStoredToken();
      const r = await axios.post(
        `${API_URL}/tax/summary`,
        { grossIncome: parseFloat(grossIncome) || 0, revenue: parseFloat(revenue) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(r.data);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Summary failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Annual Gross Income (PAYE)</Text>
        <TextInput style={styles.input} placeholder="Enter annual income" keyboardType="numeric" value={grossIncome} onChangeText={setGrossIncome} />
        <Text style={styles.label}>Annual Revenue (VAT)</Text>
        <TextInput style={styles.input} placeholder="Enter annual revenue" keyboardType="numeric" value={revenue} onChangeText={setRevenue} />
        <TouchableOpacity style={styles.calcBtn} onPress={getSummary} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>Get Summary</Text>}
        </TouchableOpacity>
      </View>
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Tax Summary</Text>
          <ResultRow label="PAYE Annual Tax" value={formatCurrency(result.breakdown?.paye || 0)} />
          <ResultRow label="VAT Amount" value={formatCurrency(result.breakdown?.vat || 0)} />
          <ResultRow label="Withholding Tax" value={formatCurrency(result.breakdown?.wht || 0)} />
          <View style={styles.divider} />
          <ResultRow label="Total Estimated Tax" value={formatCurrency(result.totalEstimatedTax)} highlight />
        </View>
      )}
    </ScrollView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  authContainer: { flex: 1, backgroundColor: "#1a73e8" },
  authCard: { flex: 1, justifyContent: "center", padding: 24 },
  authTitle: { fontSize: 32, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 8 },
  authSubtitle: { fontSize: 16, color: "#fff", textAlign: "center", marginBottom: 32, opacity: 0.8 },
  authBtn: { backgroundColor: "#fff", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 24 },
  authBtnText: { color: "#1a73e8", fontSize: 18, fontWeight: "600" },
  authLink: { color: "#fff", textAlign: "center", marginTop: 16, textDecorationLine: "underline" },
  header: { padding: 20, backgroundColor: "#1a73e8", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  logoutBtn: { color: "#fff", textDecorationLine: "underline" },
  taxGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12 },
  taxCard: { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 16, margin: "1.5%", elevation: 2 },
  taxIcon: { fontSize: 32, marginBottom: 8 },
  taxName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  taxDesc: { fontSize: 12, color: "#666", marginTop: 4 },
  summaryBtn: { margin: 20, backgroundColor: "#34a853", padding: 16, borderRadius: 8, alignItems: "center" },
  summaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 20, margin: 16, elevation: 2 },
  label: { fontSize: 14, color: "#666", marginBottom: 8, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  nameRow: { flexDirection: "row", justifyContent: "space-between" },
  nameInput: { width: "48%" },
  toggleRow: { flexDirection: "row", marginBottom: 16 },
  toggleBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: "#ddd", alignItems: "center", marginRight: 8 },
  toggleActive: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  toggleText: { color: "#333", fontWeight: "500" },
  toggleTextActive: { color: "#fff" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  categoryBtn: { width: "31%", margin: "1%", padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, alignItems: "center" },
  categoryText: { fontSize: 12, color: "#333", fontWeight: "500" },
  categoryRate: { fontSize: 10, color: "#666", marginTop: 2 },
  calcBtn: { backgroundColor: "#1a73e8", padding: 16, borderRadius: 8, alignItems: "center" },
  calcBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resultCard: { backgroundColor: "#fff", borderRadius: 12, padding: 20, margin: 16, marginTop: 0, elevation: 2 },
  resultTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 16 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  resultLabel: { fontSize: 14, color: "#666" },
  resultValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  resultHighlight: { color: "#1a73e8", fontSize: 18 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 8 }
});

// MAIN APP
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PAYE" component={PAYEScreen} options={{ title: "PAYE Tax" }} />
        <Stack.Screen name="VAT" component={VATScreen} options={{ title: "VAT Calculation" }} />
        <Stack.Screen name="WHT" component={WHTScreen} options={{ title: "Withholding Tax" }} />
        <Stack.Screen name="CGT" component={CGTScreen} options={{ title: "Capital Gains Tax" }} />
        <Stack.Screen name="Summary" component={SummaryScreen} options={{ title: "Tax Summary" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
